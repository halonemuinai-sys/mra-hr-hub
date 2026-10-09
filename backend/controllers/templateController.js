const {
  generateCandidateTemplateWorkbook,
  parseCandidateTemplateWorkbook,
  TEMPLATE_EXAMPLE_EMAILS
} = require('../services/excelTemplateService');
const { classifyCandidateProfiling, calculateAtsMatchScore } = require('../services/profilingService');
const prisma = require('../api/db');
const { intakeCandidate } = require('../services/candidateIntakeService');
const { later, notifyApplicationReceived } = require('../services/mail/applicantMail');

async function downloadTemplate(req, res) {
  try {
    const workbook = await generateCandidateTemplateWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="HR_HUB_Master_Candidate_Template.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat file template Excel.' });
  }
}

/** Parse the uploaded workbook and resolve the optional target job */
async function readTemplate(req) {
  if (!req.file) throw Object.assign(new Error('File Excel (.xlsx) wajib diunggah.'), { status: 400 });
  const parsed = await parseCandidateTemplateWorkbook(req.file.buffer);
  if (parsed.candidates.length === 0) {
    throw Object.assign(new Error('Tidak ada data kandidat valid yang ditemukan dalam file Excel.'), {
      status: 400,
      errors: parsed.errors
    });
  }
  const jobId = req.body.jobId || null;
  const job = jobId ? await prisma.jobPosting.findUnique({ where: { id: jobId } }) : null;
  return { parsed, job };
}

function sendError(res, error, fallback) {
  if (error.status === 400) return res.status(400).json({ success: false, message: error.message, errors: error.errors });
  console.error(fallback, error);
  return res.status(500).json({ success: false, message: fallback });
}

/**
 * POST /api/templates/upload  (CMS, candidate.import) — bulk import; may update existing profiles.
 * ?preview=true returns the parsed rows without writing.
 */
async function uploadTemplate(req, res) {
  try {
    const { parsed, job } = await readTemplate(req);

    if (req.query.preview === 'true') {
      const data = parsed.candidates.map((cand) => {
        const evaluation = calculateAtsMatchScore(cand, job);
        const classification = classifyCandidateProfiling(cand, evaluation.atsScore);
        return { ...cand, ...classification, atsScore: evaluation.atsScore, evaluation };
      });
      return res.json({ success: true, preview: true, total: data.length, errors: parsed.errors, data });
    }

    let savedCount = 0;
    for (const cand of parsed.candidates) {
      try {
        await intakeCandidate({ profile: cand, job, source: 'EXCEL_TEMPLATE', overwriteExisting: true });
        savedCount++;
      } catch (err) {
        parsed.errors.push(`Gagal menyimpan kandidat ${cand.email}: ${err.message}`);
      }
    }

    await prisma.templateUploadLog.create({
      data: {
        fileName: req.file.originalname,
        totalRows: parsed.candidates.length,
        successRows: savedCount,
        failedRows: parsed.candidates.length - savedCount,
        errorLog: parsed.errors.join('\n'),
        uploadedBy: req.user.name
      }
    });

    return res.json({
      success: true,
      message: `Berhasil mengimpor ${savedCount} dari ${parsed.candidates.length} kandidat.`,
      savedCount,
      totalCount: parsed.candidates.length,
      errors: parsed.errors
    });
  } catch (error) {
    return sendError(res, error, 'Gagal memproses file template.');
  }
}

/**
 * POST /api/templates/apply  (public career portal) — exactly one applicant per file;
 * never overwrites an existing candidate's profile.
 */
async function applyWithTemplate(req, res) {
  try {
    const { parsed, job } = await readTemplate(req);
    // Applicants often leave the template's example rows in place — ignore them
    const rows = parsed.candidates.filter((c) => !TEMPLATE_EXAMPLE_EMAILS.includes(String(c.email).toLowerCase()));
    if (rows.length !== 1) {
      return res.status(400).json({
        success: false,
        message: rows.length
          ? 'Template lamaran hanya boleh berisi data satu pelamar.'
          : 'Isi data Anda di template (baris contoh tidak dihitung).'
      });
    }
    if (req.body.jobId && (!job || !job.isActive)) {
      return res.status(404).json({ success: false, message: 'Lowongan tidak ditemukan atau sudah ditutup.' });
    }

    const result = await intakeCandidate({
      profile: rows[0],
      job,
      source: 'EXCEL_TEMPLATE',
      overwriteExisting: false
    });
    if (result.applicationCreated) later(() => notifyApplicationReceived(result.application.id));
    return res.status(201).json({
      success: true,
      message: 'Lamaran kerja berhasil didaftarkan.',
      savedCount: 1,
      data: { atsScore: result.evaluation.atsScore }
    });
  } catch (error) {
    return sendError(res, error, 'Gagal memproses file template.');
  }
}

module.exports = {
  downloadTemplate,
  uploadTemplate,
  applyWithTemplate
};
