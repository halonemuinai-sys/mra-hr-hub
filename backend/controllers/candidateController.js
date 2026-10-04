const prisma = require('../api/db');
const { calculateAtsMatchScore, classifyCandidateProfiling } = require('../services/profilingService');
const { resolveMovePermission } = require('./assignmentController');
const { evaluateTransition } = require('../services/stageGateService');
const { loadApplicationForGate, applyStageChange } = require('../services/stageMoveService');
const { hasPermission } = require('../config/permissions');

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

    if (jobId || status) {
      where.applications = {
        some: {
          ...(jobId ? { jobId } : {}),
          ...(status ? { status } : {})
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

    // Filter by minScore if provided in query
    let filteredCandidates = candidates;
    if (minScore) {
      const minVal = parseFloat(minScore);
      filteredCandidates = candidates.filter(c => c.atsScore >= minVal);
    }

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
          include: { job: true },
          orderBy: { appliedAt: 'desc' }
        }
      }
    });

    if (!candidate) {
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
 * Create candidate and application from Public Portal (ATS Upload or Manual Apply)
 */
async function createCandidateWithApplication(req, res) {
  try {
    const {
      fullName,
      email,
      phone,
      location,
      headline,
      currentCompany,
      totalExperienceYrs,
      expectedSalary,
      availability,
      intakeSource,
      profileSummary,
      skills,
      experiences,
      educations,
      jobId
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan Email wajib diisi.' });
    }

    let jobPosting = null;
    if (jobId) {
      jobPosting = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    }

    // Evaluate ATS match score
    const tempCandidate = {
      fullName,
      email,
      headline,
      totalExperienceYrs: parseFloat(totalExperienceYrs) || 0,
      profileSummary,
      skills: skills || [],
      experiences: experiences || [],
      educations: educations || []
    };

    const evaluation = calculateAtsMatchScore(tempCandidate, jobPosting);
    const classification = classifyCandidateProfiling(tempCandidate, evaluation.atsScore);

    // Upsert Candidate Record
    const candidate = await prisma.candidate.upsert({
      where: { email },
      update: {
        fullName,
        phone: phone || '',
        location: location || '',
        headline: headline || '',
        currentCompany: currentCompany || '',
        totalExperienceYrs: parseFloat(totalExperienceYrs) || 0,
        expectedSalary: expectedSalary ? parseFloat(expectedSalary) : null,
        availability: availability || 'IMMEDIATE',
        intakeSource: intakeSource || 'ATS_RESUME_UPLOAD',
        profileSummary: profileSummary || '',
        jobFamily: classification.jobFamily,
        seniorityLevel: classification.seniorityLevel,
        tags: classification.tags
      },
      create: {
        fullName,
        email,
        phone: phone || '',
        location: location || '',
        headline: headline || '',
        currentCompany: currentCompany || '',
        totalExperienceYrs: parseFloat(totalExperienceYrs) || 0,
        expectedSalary: expectedSalary ? parseFloat(expectedSalary) : null,
        availability: availability || 'IMMEDIATE',
        intakeSource: intakeSource || 'ATS_RESUME_UPLOAD',
        profileSummary: profileSummary || '',
        jobFamily: classification.jobFamily,
        seniorityLevel: classification.seniorityLevel,
        tags: classification.tags
      }
    });

    // Upsert Skills
    if (skills && Array.isArray(skills) && skills.length > 0) {
      await prisma.candidateSkill.deleteMany({ where: { candidateId: candidate.id } });
      await prisma.candidateSkill.createMany({
        data: skills.map(s => ({
          candidateId: candidate.id,
          skillName: typeof s === 'string' ? s : s.skillName,
          category: (s && s.category) ? s.category : 'TECHNICAL',
          proficiency: (s && s.proficiency) ? s.proficiency : 'INTERMEDIATE'
        }))
      });
    }

    // Upsert Experiences
    if (experiences && Array.isArray(experiences) && experiences.length > 0) {
      await prisma.candidateExperience.deleteMany({ where: { candidateId: candidate.id } });
      await prisma.candidateExperience.createMany({
        data: experiences.map(e => ({
          candidateId: candidate.id,
          companyName: e.companyName || 'Perusahaan',
          roleTitle: e.roleTitle || 'Posisi',
          industry: e.industry || 'Umum',
          startDate: e.startDate ? new Date(e.startDate) : new Date(),
          endDate: e.endDate ? new Date(e.endDate) : null,
          isCurrent: !!e.isCurrent,
          description: e.description || ''
        }))
      });
    }

    // Upsert Educations
    if (educations && Array.isArray(educations) && educations.length > 0) {
      await prisma.candidateEducation.deleteMany({ where: { candidateId: candidate.id } });
      await prisma.candidateEducation.createMany({
        data: educations.map(ed => ({
          candidateId: candidate.id,
          institution: ed.institution || 'Institusi',
          degree: ed.degree || 'S1',
          major: ed.major || 'Umum',
          graduationYear: ed.graduationYear ? parseInt(ed.graduationYear, 10) : null,
          gpa: ed.gpa ? parseFloat(ed.gpa) : null
        }))
      });
    }

    // Create or update JobApplication
    let application = null;
    if (jobPosting) {
      const appId = `${jobPosting.id}_${candidate.id}`;
      application = await prisma.jobApplication.upsert({
        where: { id: appId },
        update: {
          atsScore: evaluation.atsScore,
          skillsScore: evaluation.skillsScore,
          expScore: evaluation.expScore,
          eduScore: evaluation.eduScore,
          matchedKeywords: evaluation.matchedKeywords,
          missingKeywords: evaluation.missingKeywords
        },
        create: {
          id: appId,
          jobId: jobPosting.id,
          candidateId: candidate.id,
          status: 'APPLIED',
          atsScore: evaluation.atsScore,
          skillsScore: evaluation.skillsScore,
          expScore: evaluation.expScore,
          eduScore: evaluation.eduScore,
          matchedKeywords: evaluation.matchedKeywords,
          missingKeywords: evaluation.missingKeywords
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Lamaran kerja dan profil kandidat berhasil didaftarkan.',
      data: {
        candidate,
        application,
        atsScore: evaluation.atsScore,
        evaluation
      }
    });
  } catch (error) {
    console.error('Error creating candidate application:', error);
    return res.status(500).json({ success: false, message: error.message });
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
    await prisma.candidate.delete({ where: { id } });
    return res.json({ success: true, message: 'Data kandidat berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  listCandidates,
  getCandidateById,
  createCandidateWithApplication,
  updateApplicationStatus,
  getPublicApplicationStatus,
  deleteCandidate
};
