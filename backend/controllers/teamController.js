const prisma = require('../api/db');
const { PIC_ROLES } = require('../config/permissions');

const FUNNEL = ['APPLIED', 'ATS_SCREENED', 'SHORTLISTED', 'INTERVIEW_HR', 'INTERVIEW_USER', 'OFFERING', 'HIRED'];
const CLOSED = ['HIRED', 'REJECTED', 'TALENT_POOL'];
const STALE_DAYS = 7;
const DAY = 86400000;

const isForward = (from, to) => {
  const a = FUNNEL.indexOf(from);
  const b = FUNNEL.indexOf(to);
  return a >= 0 && b > a;
};
const avg = (xs) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : null);
const round1 = (x) => (x === null ? null : Math.round(x * 10) / 10);

/**
 * GET /api/team/performance?days=30
 * Per-recruiter workload (now) + activity outcomes (in period) for TA monitoring.
 */
async function getTeamPerformance(req, res) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const since = new Date(Date.now() - days * DAY);
    const staleBefore = Date.now() - STALE_DAYS * DAY;

    const [users, holdings, activities, unassignedCount] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: PIC_ROLES } },
        select: { id: true, name: true, email: true, role: true, isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.jobApplication.findMany({
        where: { assignedRecruiterId: { not: null }, status: { notIn: CLOSED } },
        select: { assignedRecruiterId: true, status: true, stageChangedAt: true, atsScore: true }
      }),
      prisma.applicationActivity.findMany({
        where: { createdAt: { gte: since } },
        select: {
          actorId: true,
          action: true,
          fromStatus: true,
          toStatus: true,
          createdAt: true,
          application: { select: { appliedAt: true } }
        }
      }),
      prisma.jobApplication.count({ where: { assignedRecruiterId: null, status: { notIn: CLOSED } } })
    ]);

    const lastActivity = await prisma.applicationActivity.groupBy({
      by: ['actorId'],
      where: { actorId: { in: users.map((u) => u.id) } },
      _max: { createdAt: true }
    });

    const members = users.map((u) => {
      const held = holdings.filter((h) => h.assignedRecruiterId === u.id);
      const acts = activities.filter((a) => a.actorId === u.id);
      const moves = acts.filter((a) => a.action === 'STAGE_CHANGE');
      const claims = acts.filter((a) => a.action === 'CLAIM');

      const byStage = {};
      held.forEach((h) => (byStage[h.status] = (byStage[h.status] || 0) + 1));

      const hired = moves.filter((m) => m.toStatus === 'HIRED').length;
      const rejected = moves.filter((m) => m.toStatus === 'REJECTED').length;
      const talentPool = moves.filter((m) => m.toStatus === 'TALENT_POOL').length;
      const closedOut = hired + rejected + talentPool;

      return {
        ...u,
        activeCount: held.length,
        staleCount: held.filter((h) => new Date(h.stageChangedAt).getTime() < staleBefore).length,
        avgDaysInStage: round1(avg(held.map((h) => (Date.now() - new Date(h.stageChangedAt).getTime()) / DAY))),
        avgAtsScore: held.length ? Math.round(avg(held.map((h) => h.atsScore || 0))) : null,
        byStage,
        period: {
          claims: claims.length,
          moves: moves.length,
          advanced: moves.filter((m) => isForward(m.fromStatus, m.toStatus)).length,
          offerings: moves.filter((m) => m.toStatus === 'OFFERING').length,
          hired,
          rejected,
          talentPool,
          hireRate: closedOut ? Math.round((hired / closedOut) * 100) : null,
          // How quickly new applicants get picked up (applied → claimed), in hours
          avgClaimHours: round1(
            avg(claims.map((c) => (new Date(c.createdAt) - new Date(c.application.appliedAt)) / 3600000))
          )
        },
        lastActiveAt: lastActivity.find((l) => l.actorId === u.id)?._max.createdAt || null
      };
    });

    const sum = (fn) => members.reduce((n, m) => n + fn(m), 0);
    return res.json({
      success: true,
      data: {
        days,
        since,
        team: {
          members: members.filter((m) => m.isActive).length,
          activeCandidates: sum((m) => m.activeCount),
          unassignedCandidates: unassignedCount,
          staleCandidates: sum((m) => m.staleCount),
          claims: sum((m) => m.period.claims),
          moves: sum((m) => m.period.moves),
          hired: sum((m) => m.period.hired),
          avgClaimHours: round1(
            avg(activities.filter((a) => a.action === 'CLAIM').map(
              (c) => (new Date(c.createdAt) - new Date(c.application.appliedAt)) / 3600000
            ))
          )
        },
        members
      }
    });
  } catch (error) {
    console.error('Error computing team performance:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/team/activity?recruiterId=&limit=50
 * Recent activity feed (whole team, or one recruiter as actor)
 */
async function getTeamActivity(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const where = req.query.recruiterId ? { actorId: req.query.recruiterId } : {};

    const rows = await prisma.applicationActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: { select: { id: true, name: true } },
        application: {
          select: {
            id: true,
            status: true,
            candidate: { select: { id: true, fullName: true } },
            job: { select: { title: true } }
          }
        }
      }
    });

    // Resolve assignee names for ASSIGN / CLAIM rows
    const targetIds = [...new Set(rows.map((r) => r.toRecruiterId).filter(Boolean))];
    const targets = targetIds.length
      ? await prisma.user.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true } })
      : [];

    return res.json({
      success: true,
      data: rows.map((r) => ({
        ...r,
        toRecruiter: targets.find((t) => t.id === r.toRecruiterId) || null
      }))
    });
  } catch (error) {
    console.error('Error listing team activity:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getTeamPerformance, getTeamActivity };
