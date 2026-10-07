const prisma = require('../api/db');
const { PIC_ROLES } = require('../config/permissions');

const FUNNEL = ['APPLIED', 'ATS_SCREENED', 'SHORTLISTED', 'INTERVIEW_HR', 'INTERVIEW_USER', 'OFFERING', 'HIRED'];
const CLOSED = ['HIRED', 'REJECTED', 'TALENT_POOL'];
const STALE_DAYS = 7;
const CRITICAL_DAYS = 14;
/** Comfortable number of active candidates per recruiter (workload utilization = active / capacity) */
const CAPACITY = 15;
const DAY = 86400000;

const isForward = (from, to) => {
  const a = FUNNEL.indexOf(from);
  const b = FUNNEL.indexOf(to);
  return a >= 0 && b > a;
};
const avg = (xs) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : null);
const round1 = (x) => (x === null ? null : Math.round(x * 10) / 10);
const pct = (num, den) => (den ? Math.round((num / den) * 100) : null);
// % change is meaningless on a tiny baseline (e.g. 1 → 51 = +5000%), so require at least 5
const MIN_BASELINE = 5;
const pctChange = (now, prev) => (prev >= MIN_BASELINE ? Math.round(((now - prev) / prev) * 100) : null);
const daysSince = (d, now) => (now - new Date(d).getTime()) / DAY;

/** Activity outcomes for a set of activity rows */
function outcomes(acts) {
  const moves = acts.filter((a) => a.action === 'STAGE_CHANGE');
  const claims = acts.filter((a) => a.action === 'CLAIM');
  const hired = moves.filter((m) => m.toStatus === 'HIRED').length;
  const rejected = moves.filter((m) => m.toStatus === 'REJECTED').length;
  const talentPool = moves.filter((m) => m.toStatus === 'TALENT_POOL').length;
  const advanced = moves.filter((m) => isForward(m.fromStatus, m.toStatus)).length;
  const closedOut = hired + rejected + talentPool;
  return {
    claims: claims.length,
    moves: moves.length,
    advanced,
    interviews: moves.filter((m) => ['INTERVIEW_HR', 'INTERVIEW_USER'].includes(m.toStatus)).length,
    offerings: moves.filter((m) => m.toStatus === 'OFFERING').length,
    hired,
    rejected,
    talentPool,
    approvalsRequested: acts.filter((a) => a.action === 'APPROVAL_REQUESTED').length,
    hireRate: pct(hired, closedOut),
    advanceRate: pct(advanced, moves.length),
    // How quickly new applicants get picked up (applied → claimed), in hours
    avgClaimHours: round1(avg(claims.map((c) => (new Date(c.createdAt) - new Date(c.application.appliedAt)) / 3600000)))
  };
}

/** Time buckets for sparklines: daily up to 14 days, weekly beyond */
function buckets(days, now) {
  const size = days <= 14 ? DAY : 7 * DAY;
  const count = Math.ceil((days * DAY) / size);
  const start = now - count * size;
  return { size, count, start };
}

/**
 * GET /api/team/performance?days=30
 * Per-recruiter workload (now) + activity outcomes (in period, with previous-period comparison).
 */
async function getTeamPerformance(req, res) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const now = Date.now();
    const since = new Date(now - days * DAY);
    const prevSince = new Date(now - 2 * days * DAY);

    const [users, holdings, activities, unassigned] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: PIC_ROLES } },
        select: { id: true, name: true, email: true, role: true, isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.jobApplication.findMany({
        where: { assignedRecruiterId: { not: null }, status: { notIn: CLOSED } },
        select: {
          id: true,
          assignedRecruiterId: true,
          status: true,
          stageChangedAt: true,
          atsScore: true,
          candidate: { select: { fullName: true } },
          job: { select: { title: true } }
        }
      }),
      prisma.applicationActivity.findMany({
        where: { createdAt: { gte: prevSince } },
        select: {
          actorId: true,
          action: true,
          fromStatus: true,
          toStatus: true,
          createdAt: true,
          application: { select: { appliedAt: true } }
        }
      }),
      prisma.jobApplication.findMany({
        where: { assignedRecruiterId: null, status: { notIn: CLOSED } },
        select: { appliedAt: true }
      })
    ]);

    const lastActivity = await prisma.applicationActivity.groupBy({
      by: ['actorId'],
      where: { actorId: { in: users.map((u) => u.id) } },
      _max: { createdAt: true }
    });

    const current = activities.filter((a) => new Date(a.createdAt) >= since);
    const previous = activities.filter((a) => new Date(a.createdAt) < since);
    const b = buckets(days, now);

    const members = users.map((u) => {
      const held = holdings.filter((h) => h.assignedRecruiterId === u.id);
      const mine = current.filter((a) => a.actorId === u.id);
      const ages = held.map((h) => ({ ...h, days: daysSince(h.stageChangedAt, now) }));
      const stale = ages.filter((h) => h.days >= STALE_DAYS);

      const byStage = {};
      held.forEach((h) => (byStage[h.status] = (byStage[h.status] || 0) + 1));

      const series = Array.from({ length: b.count }, (_, i) => ({ t: new Date(b.start + i * b.size).toISOString(), moves: 0, hired: 0 }));
      mine.forEach((a) => {
        if (a.action !== 'STAGE_CHANGE') return;
        const i = Math.floor((new Date(a.createdAt).getTime() - b.start) / b.size);
        if (i < 0 || i >= b.count) return;
        series[i].moves++;
        if (a.toStatus === 'HIRED') series[i].hired++;
      });

      return {
        ...u,
        activeCount: held.length,
        staleCount: stale.length,
        criticalCount: ages.filter((h) => h.days >= CRITICAL_DAYS).length,
        utilization: pct(held.length, CAPACITY),
        slaRate: held.length ? pct(held.length - stale.length, held.length) : null,
        avgDaysInStage: round1(avg(ages.map((h) => h.days))),
        avgAtsScore: held.length ? Math.round(avg(held.map((h) => h.atsScore || 0))) : null,
        byStage,
        period: outcomes(mine),
        previous: outcomes(previous.filter((a) => a.actorId === u.id)),
        series,
        staleCandidates: stale
          .sort((x, y) => y.days - x.days)
          .slice(0, 6)
          .map((h) => ({ applicationId: h.id, candidate: h.candidate.fullName, job: h.job.title, status: h.status, days: Math.floor(h.days) })),
        lastActiveAt: lastActivity.find((l) => l.actorId === u.id)?._max.createdAt || null
      };
    });

    const teamNow = outcomes(current.filter((a) => users.some((u) => u.id === a.actorId)));
    const teamPrev = outcomes(previous.filter((a) => users.some((u) => u.id === a.actorId)));
    const activeMembers = members.filter((m) => m.isActive);
    const sum = (fn) => members.reduce((n, m) => n + fn(m), 0);
    const totalActive = sum((m) => m.activeCount);
    const totalStale = sum((m) => m.staleCount);

    return res.json({
      success: true,
      data: {
        days,
        since,
        capacity: CAPACITY,
        staleDays: STALE_DAYS,
        bucket: b.size === DAY ? 'day' : 'week',
        team: {
          members: activeMembers.length,
          activeCandidates: totalActive,
          unassignedCandidates: unassigned.length,
          unassignedWaitingLong: unassigned.filter((a) => daysSince(a.appliedAt, now) >= 2).length,
          staleCandidates: totalStale,
          slaRate: totalActive ? pct(totalActive - totalStale, totalActive) : null,
          avgLoad: activeMembers.length ? round1(totalActive / activeMembers.length) : null,
          ...teamNow,
          deltas: {
            claims: pctChange(teamNow.claims, teamPrev.claims),
            moves: pctChange(teamNow.moves, teamPrev.moves),
            hired: pctChange(teamNow.hired, teamPrev.hired),
            advanced: pctChange(teamNow.advanced, teamPrev.advanced)
          }
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
 * GET /api/team/rebalance — suggested reassignments to even out workload.
 * Only stalled candidates of overloaded recruiters (and the long-waiting unassigned queue)
 * are proposed, so fresh work in progress is never disrupted.
 */
async function getRebalanceSuggestions(req, res) {
  try {
    const now = Date.now();
    const targets = await prisma.user.findMany({
      where: { role: { in: ['RECRUITER', 'HR_ADMIN'] }, isActive: true },
      select: { id: true, name: true }
    });
    if (targets.length < 2) return res.json({ success: true, data: { suggestions: [], loads: [] } });

    const active = await prisma.jobApplication.findMany({
      where: { status: { notIn: CLOSED } },
      select: {
        id: true,
        assignedRecruiterId: true,
        status: true,
        stageChangedAt: true,
        appliedAt: true,
        candidate: { select: { fullName: true } },
        job: { select: { title: true } },
        stageRequests: { where: { status: 'PENDING' }, select: { id: true }, take: 1 }
      }
    });

    const load = new Map(targets.map((t) => [t.id, 0]));
    active.forEach((a) => a.assignedRecruiterId && load.has(a.assignedRecruiterId) && load.set(a.assignedRecruiterId, load.get(a.assignedRecruiterId) + 1));
    const before = new Map(load);
    const total = [...load.values()].reduce((n, x) => n + x, 0);
    const fair = Math.ceil(total / targets.length);
    const name = (id) => targets.find((t) => t.id === id)?.name || '—';

    const pool = active
      .filter((a) => !a.stageRequests.length) // never move cards awaiting approval
      .map((a) => ({
        ...a,
        days: a.assignedRecruiterId ? daysSince(a.stageChangedAt, now) : daysSince(a.appliedAt, now)
      }))
      .filter((a) =>
        a.assignedRecruiterId
          ? load.has(a.assignedRecruiterId) && a.days >= STALE_DAYS && load.get(a.assignedRecruiterId) > fair
          : a.days >= 2
      )
      .sort((x, y) => y.days - x.days);

    const suggestions = [];
    for (const a of pool) {
      const from = a.assignedRecruiterId;
      if (from && load.get(from) <= fair) continue;
      const to = [...load.entries()].filter(([id]) => id !== from).sort((x, y) => x[1] - y[1])[0];
      if (!to || (from && to[1] + 1 > load.get(from) - 1)) continue;
      suggestions.push({
        applicationId: a.id,
        candidate: a.candidate.fullName,
        job: a.job.title,
        status: a.status,
        days: Math.floor(a.days),
        reason: from ? `Tertahan ${Math.floor(a.days)} hari` : `Belum diambil ${Math.floor(a.days)} hari`,
        from: from ? { id: from, name: name(from) } : null,
        to: { id: to[0], name: name(to[0]) }
      });
      if (from) load.set(from, load.get(from) - 1);
      load.set(to[0], to[1] + 1);
      if (suggestions.length >= 12) break;
    }

    return res.json({
      success: true,
      data: {
        fairShare: fair,
        suggestions,
        loads: targets.map((t) => ({ id: t.id, name: t.name, before: before.get(t.id), after: load.get(t.id) }))
      }
    });
  } catch (error) {
    console.error('Error building rebalance suggestions:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/team/activity?recruiterId=&action=&limit=50
 * Recent activity feed (whole team, or one recruiter as actor)
 */
async function getTeamActivity(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const ACTION_GROUPS = {
      moves: ['STAGE_CHANGE'],
      ownership: ['CLAIM', 'RELEASE', 'ASSIGN'],
      approvals: ['APPROVAL_REQUESTED', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'APPROVAL_CANCELLED']
    };
    const where = {};
    if (req.query.recruiterId) where.actorId = req.query.recruiterId;
    if (ACTION_GROUPS[req.query.action]) where.action = { in: ACTION_GROUPS[req.query.action] };

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

module.exports = { getTeamPerformance, getRebalanceSuggestions, getTeamActivity };
