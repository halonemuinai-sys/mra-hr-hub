const path = require('path');
const prisma = require('../api/db');
const { calculateAtsMatchScore } = require('../services/profilingService');
const { intakeCandidate } = require('../services/candidateIntakeService');
const { jobScope, applicationScope, isScopedHiringManager } = require('../services/hiringManagerScope');
const { resolveStored, removeStored, mimeOf } = require('../services/resumeStorage');
const { resolveMovePermission } = require('./assignmentController');
const { evaluateTransition } = require('../services/stageGateService');
const { loadApplicationForGate, applyStageChange } = require('../services/stageMoveService');
const { hasPermission } = require('../config/permissions');
const { later, notifyApplicationReceived } = require('../services/mail/applicantMail');

/**
 * List candidates with standard contract { success, data, meta, summary }
 */
async function listCandidates(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { search, jobId, status, jobFamily, seniorityLevel, minScore } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (jobFamily) {
      where.jobFamily = jobFamily;
    }

    if (seniorityLevel) {
      where.seniorityLevel = seniorityLevel;
    }

    // minScore is applied in the query (not after paging) so totals and pages stay consistent
    const minVal = minScore ? parseFloat(minScore) : NaN;
    // Hiring Managers only see candidates who applied to their jobs
    const hmJob = jobScope(req.user);
    if (jobId || status || !Number.isNaN(minVal) || hmJob) {
      where.applications = {
        some: {
          ...(jobId ? { jobId } : {}),
          ...(status ? { status } : {}),
          ...(!Number.isNaN(minVal) ? { atsScore: { gte: minVal } } : {}),
          ...(hmJob ? { job: hmJob } : {})
        }
      };
    }

    const [total, rawCandidates] = await Promise.all([
      prisma.candidate.count({ where }),
      prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          skills: true,
          experiences: { orderBy: { startDate: 'desc' }, take: 3 },
          educations: { take: 2 },
          applications: {
            where: applicationScope(req.user),
            include: { job: { select: { id: true, title: true, department: true } } },
            orderBy: { appliedAt: 'desc' },
            take: 1
          }
        }
      })
    ]);

    // Format and augment candidate data
    const candidates = rawCandidates.map(c => {
      const activeApp = c.applications && c.applications.length > 0 ? c.applications[0] : null;
      return {
        ...c,
        latestApplication: activeApp,
        atsScore: activeApp ? activeApp.atsScore : 75,
        status: activeApp ? activeApp.status : 'TALENT_POOL'
      };
    });

    const filteredCandidates = candidates;

    // Summary KPIs for filter header
    const allCandidatesCount = await prisma.candidate.count();
    const shortlistedCount = await prisma.jobApplication.count({ where: { status: 'SHORTLISTED' } });
    const interviewCount = await prisma.jobApplication.count({
      where: { status: { in: ['INTERVIEW_HR', 'INTERVIEW_USER'] } }
    });

    return res.json({
      success: true,
      data: filteredCandidates,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalDatabase: allCandidatesCount,
        currentResultCount: filteredCandidates.length,
        shortlistedCount,
        interviewCount
      }
    });
  } catch (error) {
    console.error('Error listing candidates:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data kandidat: ' + error.message });
  }
}

/**
 * Get single candidate detail with full relations and DNA radar chart
 */
async function getCandidateById(req, res) {
  try {
    const { id } = req.params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        skills: true,
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { graduationYear: 'desc' } },
        applications: {
          where: applicationScope(req.user),
          include: { job: true },
          orderBy: { appliedAt: 'desc' }
        }
      }
    });

    // A Hiring Manager may only open candidates of their own jobs
    if (!candidate || (isScopedHiringManager(req.user) && candidate.applications.length === 0)) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
    }

    const latestApp = candidate.applications && candidate.applications.length > 0 ? candidate.applications[0] : null;
    const evaluation = calculateAtsMatchScore(candidate, latestApp ? latestApp.job : null);

    return res.json({
      success: true,
      data: {
        ...candidate,
        evaluation,
        radarDimensions: evaluation.radarDimensions
      }
    });
  } catch (error) {
    console.error('Error fetching candidate detail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Career portal apply (public). Existing candidates are never overwritten — see
 * services/candidateIntakeService.js. The response only carries what the applicant
 * needs to see (no stored profile data).
 */
async function createCandidateWithApplication(req, res) {
  try {
    const { jobId, intakeSource } = req.body;
    if (!req.body.fullName || !req.body.email) {
      return res.status(400).json({ success: false, message: 'Nama dan Email wajib diisi.' });
    }

    const job = jobId ? await prisma.jobPosting.findFirst({ where: { id: jobId, isActive: true } }) : null;
    if (jobId && !job) {
      return res.status(404).json({ success: false, message: 'Lowongan tidak ditemukan atau sudah ditutup.' });
    }

    const source = ['ATS_RESUME_UPLOAD', 'MANUAL_INPUT'].includes(intakeSource) ? intakeSource : 'ATS_RESUME_UPLOAD';
    const result = await intakeCandidate({
      profile: req.body,
      job,
      source,
      overwriteExisting: false,
      resumeToken: req.body.resumeToken || null
    });

    if (result.applicationCreated) later(() => notifyApplicationReceived(result.application.id));
    return res.status(201).json({
      success: true,
      message: 'Lamaran kerja berhasil didaftarkan.',
      data: { atsScore: result.evaluation.atsScore, applied: !!result.application }
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error('Error creating candidate application:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses lamaran. Silakan coba lagi.' });
  }
}

/**
 * Update candidate application status & scorecard (candidate drawer).
 * Notes & rating need candidate.evaluate. A stage change must pass the stage gate
 * as a direct move; anything needing a form or approval goes through the Pipeline.
 */
async function updateApplicationStatus(req, res) {
  try {
    const { applicationId } = req.params;
    const { status, recruiterNotes, scorecardRating } = req.body;

    const app = await loadApplicationForGate(applicationId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const statusChanged = Boolean(status) && status !== app.status;
    const evaluates = recruiterNotes !== undefined || scorecardRating !== undefined;
    if (evaluates && !hasPermission(req.user, 'candidate.evaluate')) {
      return res.status(403).json({ success: false, message: 'Your role is not allowed to submit evaluations.' });
    }

    if (statusChanged) {
      const rating = scorecardRating ? parseInt(scorecardRating, 10) : undefined;
      const ev = evaluateTransition({ app, toStatus: status, data: rating ? { rating } : {}, user: req.user });
      if (ev.blocks.length) return res.status(409).json({ success: false, message: ev.blocks[0] });
      if (app.stageRequests.length || ev.approval || ev.errors.length || ev.warnings.length) {
        return res.status(409).json({
          success: false,
          message: 'This stage move needs validation (form or approval). Please move the candidate from the Applicant Pipeline.'
        });
      }
      const { deniedIds } = await resolveMovePermission(req.user, [applicationId]);
      if (deniedIds.length) {
        return res.status(403).json({
          success: false,
          message: 'This candidate is owned by another recruiter — only the owner or a TA Lead can change the stage.'
        });
      }
    }

    const dataToUpdate = {};
    if (recruiterNotes !== undefined) dataToUpdate.recruiterNotes = recruiterNotes;
    if (scorecardRating !== undefined) dataToUpdate.scorecardRating = parseInt(scorecardRating, 10);

    await prisma.$transaction(async (tx) => {
      if (Object.keys(dataToUpdate).length) {
        await tx.jobApplication.update({ where: { id: applicationId }, data: dataToUpdate });
      }
      if (statusChanged) {
        await applyStageChange(tx, {
          app: { ...app, recruiterNotes: dataToUpdate.recruiterNotes ?? app.recruiterNotes },
          toStatus: status,
          actorId: req.user.id
        });
      }
    });

    const updated = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { candidate: true, job: true }
    });
    return res.json({
      success: true,
      message: 'Status tahapan seleksi berhasil diperbarui.',
      data: updated
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Public self-service status lookup (exact email match, minimal fields only)
 */
async function getPublicApplicationStatus(req, res) {
  try {
    const email = String(req.query.email || '').trim();
    if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi.' });

    const c = await prisma.candidate.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        fullName: true,
        email: true,
        headline: true,
        createdAt: true,
        applications: {
          orderBy: { appliedAt: 'desc' },
          take: 1,
          select: { status: true, atsScore: true, job: { select: { title: true } } }
        }
      }
    });
    if (!c) return res.json({ success: true, data: null });

    const app = c.applications[0] || null;
    const { applications, ...profile } = c;
    return res.json({
      success: true,
      data: {
        ...profile,
        status: app ? app.status : 'TALENT_POOL',
        atsScore: app ? app.atsScore : null,
        latestApplication: app
      }
    });
  } catch (error) {
    console.error('Error fetching public status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Delete candidate
 */
async function deleteCandidate(req, res) {
  try {
    const { id } = req.params;
    const removed = await prisma.candidate.delete({ where: { id }, select: { rawResumePath: true } });
    removeStored(removed.rawResumePath);
    return res.json({ success: true, message: 'Data kandidat berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/candidates/:id/resume — stream the original CV file (CMS, candidate.view;
 * Hiring Managers only for candidates of their jobs).
 */
async function downloadResume(req, res) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: req.params.id },
      select: { fullName: true, rawResumePath: true, applications: { where: applicationScope(req.user), select: { id: true }, take: 1 } }
    });
    if (!candidate || (isScopedHiringManager(req.user) && !candidate.applications.length)) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
    }
    const abs = resolveStored(candidate.rawResumePath);
    if (!abs) return res.status(404).json({ success: false, message: 'File CV asli tidak tersedia untuk kandidat ini.' });

    const safeName = candidate.fullName.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'kandidat';
    res.setHeader('Content-Type', mimeOf(abs));
    res.setHeader('Content-Disposition', `inline; filename="CV_${safeName}${path.extname(abs)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(abs);
  } catch (error) {
    console.error('Error downloading resume:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  downloadResume,
  listCandidates,
  getCandidateById,
  createCandidateWithApplication,
  updateApplicationStatus,
  getPublicApplicationStatus,
  deleteCandidate
};
