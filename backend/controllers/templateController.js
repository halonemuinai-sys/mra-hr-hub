const { generateCandidateTemplateWorkbook, parseCandidateTemplateWorkbook } = require('../services/excelTemplateService');
const { classifyCandidateProfiling, calculateAtsMatchScore } = require('../services/profilingService');
const prisma = require('../api/db');

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

async function uploadTemplate(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File Excel (.xlsx) wajib diunggah.' });
    }

    const previewOnly = req.query.preview === 'true';
    const targetJobId = req.body.jobId || null;

    const parsedResult = await parseCandidateTemplateWorkbook(req.file.buffer);

    if (parsedResult.candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data kandidat valid yang ditemukan dalam file Excel.',
        errors: parsedResult.errors
      });
    }

    let targetJob = null;
    if (targetJobId) {
      targetJob = await prisma.jobPosting.findUnique({ where: { id: targetJobId } });
    }

    // Process and enrich candidates
    const enrichedCandidates = parsedResult.candidates.map(cand => {
      const evaluation = calculateAtsMatchScore(cand, targetJob);
      const classification = classifyCandidateProfiling(cand, evaluation.atsScore);
      return {
        ...cand,
        jobFamily: classification.jobFamily,
        seniorityLevel: classification.seniorityLevel,
        tags: classification.tags,
        atsScore: evaluation.atsScore,
        evaluation
      };
    });

    // If preview mode, return extracted list without writing to DB
    if (previewOnly) {
      return res.json({
        success: true,
        preview: true,
        total: enrichedCandidates.length,
        errors: parsedResult.errors,
        data: enrichedCandidates
      });
    }

    // Persist to Database (Transaction / sequential upserts)
    let savedCount = 0;
    for (const cand of enrichedCandidates) {
      try {
        const candidateRecord = await prisma.candidate.upsert({
          where: { email: cand.email },
          update: {
            fullName: cand.fullName,
            phone: cand.phone,
            location: cand.location,
            headline: cand.headline,
            currentCompany: cand.currentCompany,
            totalExperienceYrs: cand.totalExperienceYrs,
            expectedSalary: cand.expectedSalary,
            availability: cand.availability,
            profileSummary: cand.profileSummary,
            intakeSource: 'EXCEL_TEMPLATE',
            jobFamily: cand.jobFamily,
            seniorityLevel: cand.seniorityLevel,
            tags: cand.tags
          },
          create: {
            fullName: cand.fullName,
            email: cand.email,
            phone: cand.phone,
            location: cand.location,
            headline: cand.headline,
            currentCompany: cand.currentCompany,
            totalExperienceYrs: cand.totalExperienceYrs,
            expectedSalary: cand.expectedSalary,
            availability: cand.availability,
            profileSummary: cand.profileSummary,
            intakeSource: 'EXCEL_TEMPLATE',
            jobFamily: cand.jobFamily,
            seniorityLevel: cand.seniorityLevel,
            tags: cand.tags
          }
        });

        // Insert or replace skills
        if (cand.skills && cand.skills.length > 0) {
          await prisma.candidateSkill.deleteMany({ where: { candidateId: candidateRecord.id } });
          await prisma.candidateSkill.createMany({
            data: cand.skills.map(s => ({
              candidateId: candidateRecord.id,
              skillName: s.skillName,
              category: s.category,
              proficiency: s.proficiency
            }))
          });
        }

        // Insert or replace experiences
        if (cand.experiences && cand.experiences.length > 0) {
          await prisma.candidateExperience.deleteMany({ where: { candidateId: candidateRecord.id } });
          await prisma.candidateExperience.createMany({
            data: cand.experiences.map(e => ({
              candidateId: candidateRecord.id,
              companyName: e.companyName,
              roleTitle: e.roleTitle,
              industry: e.industry,
              startDate: e.startDate,
              endDate: e.endDate,
              isCurrent: e.isCurrent,
              description: e.description
            }))
          });
        }

        // Insert or replace educations
        if (cand.educations && cand.educations.length > 0) {
          await prisma.candidateEducation.deleteMany({ where: { candidateId: candidateRecord.id } });
          await prisma.candidateEducation.createMany({
            data: cand.educations.map(ed => ({
              candidateId: candidateRecord.id,
              institution: ed.institution,
              degree: ed.degree,
              major: ed.major,
              graduationYear: ed.graduationYear,
              gpa: ed.gpa
            }))
          });
        }

        // If a target job was selected, link application
        if (targetJob) {
          await prisma.jobApplication.upsert({
            where: {
              // Using compound unique or findFirst
              id: `${targetJob.id}_${candidateRecord.id}`
            },
            update: {
              atsScore: cand.atsScore,
              skillsScore: cand.evaluation.skillsScore,
              expScore: cand.evaluation.expScore,
              eduScore: cand.evaluation.eduScore,
              matchedKeywords: cand.evaluation.matchedKeywords,
              missingKeywords: cand.evaluation.missingKeywords
            },
            create: {
              id: `${targetJob.id}_${candidateRecord.id}`,
              jobId: targetJob.id,
              candidateId: candidateRecord.id,
              status: 'APPLIED',
              atsScore: cand.atsScore,
              skillsScore: cand.evaluation.skillsScore,
              expScore: cand.evaluation.expScore,
              eduScore: cand.evaluation.eduScore,
              matchedKeywords: cand.evaluation.matchedKeywords,
              missingKeywords: cand.evaluation.missingKeywords
            }
          });
        }

        savedCount++;
      } catch (err) {
        console.error('Error saving candidate row:', cand.email, err.message);
        parsedResult.errors.push(`Gagal menyimpan kandidat ${cand.email}: ${err.message}`);
      }
    }

    // Log upload history
    await prisma.templateUploadLog.create({
      data: {
        fileName: req.file.originalname,
        totalRows: parsedResult.candidates.length,
        successRows: savedCount,
        failedRows: parsedResult.candidates.length - savedCount,
        errorLog: parsedResult.errors.join('\n'),
        uploadedBy: req.user ? req.user.name : 'System/HR'
      }
    });

    return res.json({
      success: true,
      message: `Berhasil mengimpor ${savedCount} dari ${parsedResult.candidates.length} kandidat.`,
      savedCount,
      totalCount: parsedResult.candidates.length,
      errors: parsedResult.errors
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ success: false, message: error.message || 'Gagal memproses file template.' });
  }
}

module.exports = {
  downloadTemplate,
  uploadTemplate
};
