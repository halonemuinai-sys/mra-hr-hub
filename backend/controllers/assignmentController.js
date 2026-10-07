const prisma = require('../api/db');
const { hasPermission, PIC_ROLES } = require('../config/permissions');
const { isScopedHiringManager, canAccessJob } = require('../services/hiringManagerScope');

const CLOSED_STATUSES = ['HIRED', 'REJECTED', 'TALENT_POOL'];
const STALE_DAYS = 7;


function parseIds(body) {
  const ids = body && Array.isArray(body.applicationIds) ? body.applicationIds.filter(Boolean) : [];
  return [...new Set(ids)];
}

async function logActivities(rows) {
  if (rows.length) await prisma.applicationActivity.createMany({ data: rows });
}

/**
 * GET /api/candidates/recruiters
 * TA team members with their current workload (for assign dropdown & workload panel)
 */
async function listRecruiters(req, res) {
  try {
    const staleBefore = new Date(Date.now() - STALE_DAYS * 86400000);
    const users = await prisma.user.findMany({
      where: { role: { in: PIC_ROLES }, isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    });

    const [active, stale] = await Promise.all([
      prisma.jobApplication.groupBy({
        by: ['assignedRecruiterId'],
        where: { assignedRecruiterId: { not: null }, status: { notIn: CLOSED_STATUSES } },
        _count: { _all: true }
      }),
      prisma.jobApplication.groupBy({
        by: ['assignedRecruiterId'],
        where: {
          assignedRecruiterId: { not: null },
          status: { notIn: CLOSED_STATUSES },
          stageChangedAt: { lt: staleBefore }
        },
        _count: { _all: true }
      })
    ]);
    const countOf = (rows, id) => rows.find((r) => r.assignedRecruiterId === id)?._count._all || 0;

    return res.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        activeCount: countOf(active, u.id),
        staleCount: countOf(stale, u.id)
      }))
    });
  } catch (error) {
    console.error('Error listing recruiters:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/candidates/applications/claim  { applicationIds }
 * Atomic: only unassigned applications are claimed; the rest are reported as conflicts.
 */
async function claimApplications(req, res) {
  try {
    if (!hasPermission(req.user, 'pipeline.claim')) {
      return res.status(403).json({ success: false, message: 'Your role is not allowed to claim candidates.' });
    }
    const ids = parseIds(req.body);
    if (!ids.length) return res.status(400).json({ success: false, message: 'Select at least one application.' });

    const now = new Date();
    // Find claimable first so we know exactly which rows this request won
    const unassigned = await prisma.jobApplication.findMany({
      where: { id: { in: ids }, assignedRecruiterId: null },
      select: { id: true }
    });
    const claimedIds = [];
    for (const { id } of unassigned) {
      // Per-row conditional update = race-safe claim
      const r = await prisma.jobApplication.updateMany({
        where: { id, assignedRecruiterId: null },
        data: { assignedRecruiterId: req.user.id, assignedAt: now }
      });
      if (r.count) claimedIds.push(id);
    }

    await logActivities(
      claimedIds.map((id) => ({ applicationId: id, actorId: req.user.id, action: 'CLAIM', toRecruiterId: req.user.id }))
    );

    const conflictIds = ids.filter((id) => !claimedIds.includes(id));
    const conflicts = conflictIds.length
      ? await prisma.jobApplication.findMany({
          where: { id: { in: conflictIds } },
          select: { id: true, assignedRecruiter: { select: { id: true, name: true } } }
        })
      : [];

    const takenBy = conflicts.filter((c) => c.assignedRecruiter && c.assignedRecruiter.id !== req.user.id);
    const message = takenBy.length
      ? `${claimedIds.length} candidate(s) claimed. ${takenBy.length} already claimed by ${[
          ...new Set(takenBy.map((c) => c.assignedRecruiter.name))
        ].join(', ')}.`
      : `${claimedIds.length} candidate(s) claimed.`;

    return res.json({
      success: true,
      message,
      data: { claimedIds, conflicts: takenBy }
    });
  } catch (error) {
    console.error('Error claiming applications:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/candidates/applications/release  { applicationIds }
 * Release own (pipeline.claim) or anyone's (pipeline.assign).
 */
async function releaseApplications(req, res) {
  try {
    const ids = parseIds(req.body);
    if (!ids.length) return res.status(400).json({ success: false, message: 'Select at least one application.' });

    const canReleaseAny = hasPermission(req.user, 'pipeline.assign');
    if (!canReleaseAny && !hasPermission(req.user, 'pipeline.claim')) {
      return res.status(403).json({ success: false, message: 'Your role is not allowed to release candidates.' });
    }
    const where = { id: { in: ids }, assignedRecruiterId: canReleaseAny ? { not: null } : req.user.id };
    const owned = await prisma.jobApplication.findMany({ where, select: { id: true } });
    const releasedIds = owned.map((a) => a.id);

    if (releasedIds.length) {
      await prisma.jobApplication.updateMany({
        where: { id: { in: releasedIds } },
        data: { assignedRecruiterId: null, assignedAt: null }
      });
      await logActivities(releasedIds.map((id) => ({ applicationId: id, actorId: req.user.id, action: 'RELEASE' })));
    }

    return res.json({
      success: true,
      message: `${releasedIds.length} candidate(s) returned to the queue.`,
      data: { releasedIds }
    });
  } catch (error) {
    console.error('Error releasing applications:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/candidates/applications/assign  { applicationIds, recruiterId }  (pipeline.assign)
 */
async function assignApplications(req, res) {
  try {
    if (!hasPermission(req.user, 'pipeline.assign')) {
      return res.status(403).json({ success: false, message: 'Only a TA Lead can assign candidates.' });
    }
    const ids = parseIds(req.body);
    const { recruiterId } = req.body;
    if (!ids.length || !recruiterId) {
      return res.status(400).json({ success: false, message: 'Select the applications and a target recruiter.' });
    }

    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterId },
      select: { id: true, name: true, role: true, isActive: true }
    });
    if (!recruiter || !recruiter.isActive || !PIC_ROLES.includes(recruiter.role)) {
      return res.status(400).json({ success: false, message: 'Invalid target recruiter.' });
    }

    const result = await prisma.jobApplication.updateMany({
      where: { id: { in: ids } },
      data: { assignedRecruiterId: recruiter.id, assignedAt: new Date() }
    });
    await logActivities(
      ids.map((id) => ({ applicationId: id, actorId: req.user.id, action: 'ASSIGN', toRecruiterId: recruiter.id }))
    );

    return res.json({
      success: true,
      message: `${result.count} candidate(s) assigned to ${recruiter.name}.`,
      data: { count: result.count }
    });
  } catch (error) {
    console.error('Error assigning applications:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/candidates/applications/:applicationId/activity
 */
async function listApplicationActivity(req, res) {
  try {
    if (isScopedHiringManager(req.user)) {
      const app = await prisma.jobApplication.findUnique({
        where: { id: req.params.applicationId },
        select: { job: { select: { hiringManagerId: true } } }
      });
      if (!app || !canAccessJob(req.user, app.job)) {
        return res.status(404).json({ success: false, message: 'Lamaran tidak ditemukan.' });
      }
    }
    const rows = await prisma.applicationActivity.findMany({
      where: { applicationId: req.params.applicationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actor: { select: { id: true, name: true } } }
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listing activity:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Read-only ownership check (no auto-claim) — for previews.
 */
function canMoveApplication(user, app) {
  if (hasPermission(user, 'pipeline.move.any')) return { allowed: true, needsClaim: false };
  if (!hasPermission(user, 'pipeline.move.own')) return { allowed: false, needsClaim: false };
  if (app.assignedRecruiterId === user.id) return { allowed: true, needsClaim: false };
  if (!app.assignedRecruiterId && hasPermission(user, 'pipeline.claim')) return { allowed: true, needsClaim: true };
  return { allowed: false, needsClaim: false };
}

/**
 * Strict ownership guard for stage moves.
 * - pipeline.move.any: may move anything.
 * - pipeline.move.own: may move their own; unassigned ones are auto-claimed (needs pipeline.claim).
 * - otherwise: no stage moves.
 * Returns { allowedIds, autoClaimIds, deniedIds }.
 */
async function resolveMovePermission(user, ids) {
  if (hasPermission(user, 'pipeline.move.any')) return { allowedIds: ids, autoClaimIds: [], deniedIds: [] };
  if (!hasPermission(user, 'pipeline.move.own')) return { allowedIds: [], autoClaimIds: [], deniedIds: ids };
  const mayClaim = hasPermission(user, 'pipeline.claim');

  const apps = await prisma.jobApplication.findMany({
    where: { id: { in: ids } },
    select: { id: true, assignedRecruiterId: true }
  });
  const allowedIds = [];
  const autoClaimIds = [];
  const deniedIds = [];
  apps.forEach((a) => {
    if (a.assignedRecruiterId === user.id) allowedIds.push(a.id);
    else if (!a.assignedRecruiterId && mayClaim) autoClaimIds.push(a.id);
    else deniedIds.push(a.id);
  });

  // Claim unassigned ones race-safely before moving
  const now = new Date();
  for (const id of autoClaimIds) {
    const r = await prisma.jobApplication.updateMany({
      where: { id, assignedRecruiterId: null },
      data: { assignedRecruiterId: user.id, assignedAt: now }
    });
    if (r.count) {
      allowedIds.push(id);
      await logActivities([{ applicationId: id, actorId: user.id, action: 'CLAIM', toRecruiterId: user.id }]);
    } else {
      deniedIds.push(id);
    }
  }
  return { allowedIds, autoClaimIds, deniedIds };
}

module.exports = {
  canMoveApplication,
  logActivities,
  resolveMovePermission,
  listRecruiters,
  claimApplications,
  releaseApplications,
  assignApplications,
  listApplicationActivity
};
