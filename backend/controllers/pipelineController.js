/**
 * Applicant Pipeline board.
 *   GET   /api/candidates/pipeline                   → applications + owner + pending approval
 *   PATCH /api/candidates/applications/bulk-status   → bulk move (direct moves only)
 */
const prisma = require('../api/db');
const { evaluateTransition, VALID_STATUSES } = require('../services/stageGateService');
const { PENDING, applyStageChange } = require('../services/stageMoveService');
const { canMoveApplication, resolveMovePermission } = require('./assignmentController');
const { hasPermission } = require('../config/permissions');
const { jobScope } = require('../services/hiringManagerScope');

/**
 * ?owner=me|unassigned|all (default all), plus jobId, search, minScore, jobFamily, minRating
 */
async function listPipeline(req, res) {
  try {
    const { jobId, search, minScore, jobFamily, minRating, owner } = req.query;

    const where = {};
    if (jobId) where.jobId = jobId;
    if (minScore) where.atsScore = { gte: parseFloat(minScore) || 0 };
    if (minRating) where.scorecardRating = { gte: parseInt(minRating, 10) || 0 };

    const candidateWhere = {};
    if (jobFamily) candidateWhere.jobFamily = jobFamily;
    if (search) {
      candidateWhere.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (Object.keys(candidateWhere).length) where.candidate = candidateWhere;
    const hmJob = jobScope(req.user);
    if (hmJob) where.job = hmJob;

    const rows = await prisma.jobApplication.findMany({
      where,
      orderBy: [{ atsScore: 'desc' }, { appliedAt: 'desc' }],
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            headline: true,
            location: true,
            totalExperienceYrs: true,
            availability: true,
            jobFamily: true,
            seniorityLevel: true
          }
        },
        job: { select: { id: true, title: true, department: true, division: true } },
        assignedRecruiter: { select: { id: true, name: true } },
        stageRequests: {
          where: { status: PENDING },
          take: 1,
          select: {
            id: true,
            toStatus: true,
            approvalPermission: true,
            createdAt: true,
            requestedBy: { select: { id: true, name: true } }
          }
        }
      }
    });
    const all = rows.map(({ stageRequests, ...a }) => ({ ...a, pendingRequest: stageRequests[0] || null }));

    const me = req.user.id;
    const ownerCounts = {
      me: all.filter((a) => a.assignedRecruiterId === me).length,
      unassigned: all.filter((a) => !a.assignedRecruiterId).length,
      all: all.length
    };

    let applications = all;
    if (owner === 'me') applications = all.filter((a) => a.assignedRecruiterId === me);
    else if (owner === 'unassigned') applications = all.filter((a) => !a.assignedRecruiterId);

    const counts = applications.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: applications,
      summary: {
        total: applications.length,
        counts,
        ownerCounts,
        pendingApprovals: all.filter((a) => a.pendingRequest).length
      }
    });
  } catch (error) {
    console.error('Error listing pipeline:', error);
    return res.status(500).json({ success: false, message: 'Failed to load pipeline data: ' + error.message });
  }
}

/**
 * Bulk move. `note` doubles as the gate's reason field (rejection, moving back, ...).
 * Moves that need form input or approval are skipped and reported as `needsReview`.
 */
async function bulkUpdateApplicationStatus(req, res) {
  try {
    const { applicationIds, status, note } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one application.' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid stage.' });
    }
    if (!hasPermission(req.user, 'pipeline.move.own') && !hasPermission(req.user, 'pipeline.move.any')) {
      return res.status(403).json({ success: false, message: 'Your role is not allowed to change candidate stages.' });
    }

    const apps = await prisma.jobApplication.findMany({
      where: { id: { in: [...new Set(applicationIds)] } },
      include: {
        job: { select: { salaryMax: true } },
        stageRequests: { where: { status: PENDING }, select: { id: true }, take: 1 }
      }
    });

    // Ownership is checked read-only first so cards that end up skipped are never auto-claimed
    const gateData = typeof note === 'string' && note.trim() ? { reason: note.trim() } : {};
    const candidates = [];
    const needsReview = [];
    const deniedIds = [];
    apps.forEach((app) => {
      if (app.status === status) return;
      if (!canMoveApplication(req.user, app).allowed) return deniedIds.push(app.id);
      const ev = evaluateTransition({ app, toStatus: status, data: gateData, user: req.user });
      if (app.stageRequests.length || ev.blocks.length || ev.errors.length || ev.approval) needsReview.push(app.id);
      else candidates.push(app);
    });

    // Claims unassigned cards (race-safe) for the ones that will actually move
    const claim = await resolveMovePermission(req.user, candidates.map((a) => a.id));
    deniedIds.push(...claim.deniedIds);
    const toMove = candidates.filter((a) => claim.allowedIds.includes(a.id));

    await prisma.$transaction(async (tx) => {
      for (const app of toMove) {
        await applyStageChange(tx, { app, toStatus: status, actorId: req.user.id, note: gateData.reason });
      }
    });

    const movedIds = toMove.map((a) => a.id);
    const parts = [`${movedIds.length} candidate(s) moved.`];
    if (needsReview.length) parts.push(`${needsReview.length} need individual validation — move them one by one.`);
    if (deniedIds.length) parts.push(`${deniedIds.length} owned by another recruiter.`);

    return res.json({
      success: true,
      message: parts.join(' '),
      data: { count: movedIds.length, movedIds, deniedIds, needsReview }
    });
  } catch (error) {
    console.error('Error bulk updating application status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listPipeline, bulkUpdateApplicationStatus };
