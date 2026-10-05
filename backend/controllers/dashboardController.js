/**
 * GET /api/stats/dashboard?weeks=12 — analytics for the recruitment dashboard.
 * Everything is computed in memory from applications + activity log (HR HUB volumes are small).
 */
const prisma = require('../api/db');
const { FUNNEL, CLOSED } = require('../config/stageRules');

const DAY = 86400000;
const WEEK = 7 * DAY;
const STALE_DAYS = 7;

const avg = (xs) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : null);
const round1 = (x) => (x === null ? null : Math.round(x * 10) / 10);
const pctChange = (now, prev) => (prev ? Math.round(((now - prev) / prev) * 100) : null);

/** Monday 00:00 of the week containing `t` */
function weekStart(t) {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  return d.getTime() - day * DAY;
}

const SCORE_BUCKETS = [
  { label: '<50', min: 0, max: 50 },
  { label: '50–59', min: 50, max: 60 },
  { label: '60–69', min: 60, max: 70 },
  { label: '70–79', min: 70, max: 80 },
  { label: '80–84', min: 80, max: 85 },
  { label: '85–89', min: 85, max: 90 },
  { label: '90–100', min: 90, max: 101 }
];
const scoreBand = (min) => (min >= 85 ? 'top' : min >= 70 ? 'qualified' : 'review');

async function getDashboardAnalytics(req, res) {
  try {
    const weeks = Math.min(Math.max(parseInt(req.query.weeks, 10) || 12, 4), 52);
    const now = Date.now();

    const [apps, moves, jobs, candidates] = await Promise.all([
      prisma.jobApplication.findMany({
        select: {
          id: true,
          jobId: true,
          status: true,
          atsScore: true,
          appliedAt: true,
          stageChangedAt: true,
          assignedRecruiterId: true
        }
      }),
      prisma.applicationActivity.findMany({
        where: { action: 'STAGE_CHANGE' },
        select: { applicationId: true, fromStatus: true, toStatus: true, createdAt: true }
      }),
      prisma.jobPosting.findMany({ select: { id: true, title: true, division: true, isActive: true } }),
      prisma.candidate.findMany({ select: { jobFamily: true, intakeSource: true } })
    ]);

    // ---- Furthest funnel stage each application ever reached ----
    const furthest = new Map();
    apps.forEach((a) => furthest.set(a.id, Math.max(FUNNEL.indexOf(a.status), 0)));
    moves.forEach((m) => {
      const idx = Math.max(FUNNEL.indexOf(m.fromStatus), FUNNEL.indexOf(m.toStatus));
      if (idx > (furthest.get(m.applicationId) ?? 0)) furthest.set(m.applicationId, idx);
    });
    const reached = FUNNEL.map((_, i) => [...furthest.values()].filter((f) => f >= i).length);
    const funnel = FUNNEL.map((stage, i) => ({
      stage,
      current: apps.filter((a) => a.status === stage).length,
      reached: reached[i],
      conversion: i === 0 || !reached[i - 1] ? null : Math.round((reached[i] / reached[i - 1]) * 100)
    }));

    // ---- Weekly trend: applications vs hires vs rejections ----
    const firstWeek = weekStart(now) - (weeks - 1) * WEEK;
    const trend = Array.from({ length: weeks }, (_, i) => ({
      weekStart: new Date(firstWeek + i * WEEK).toISOString(),
      applications: 0,
      hired: 0,
      rejected: 0
    }));
    const bucketOf = (t) => {
      const i = Math.floor((weekStart(t) - firstWeek) / WEEK);
      return i >= 0 && i < weeks ? trend[i] : null;
    };
    apps.forEach((a) => {
      const b = bucketOf(new Date(a.appliedAt).getTime());
      if (b) b.applications++;
    });
    moves.forEach((m) => {
      const b = bucketOf(new Date(m.createdAt).getTime());
      if (!b) return;
      if (m.toStatus === 'HIRED') b.hired++;
      if (m.toStatus === 'REJECTED') b.rejected++;
    });

    // ---- KPIs with 30-day deltas ----
    const inWindow = (t, from, to) => t >= from && t < to;
    const d30 = now - 30 * DAY;
    const d60 = now - 60 * DAY;
    const appliedTimes = apps.map((a) => new Date(a.appliedAt).getTime());
    const hireMoves = moves.filter((m) => m.toStatus === 'HIRED');
    const hireTimes = hireMoves.map((m) => new Date(m.createdAt).getTime());
    const appById = new Map(apps.map((a) => [a.id, a]));
    const timeToHire = hireMoves
      .map((m) => {
        const a = appById.get(m.applicationId);
        return a ? (new Date(m.createdAt) - new Date(a.appliedAt)) / DAY : null;
      })
      .filter((x) => x !== null && x >= 0);

    const activeApps = apps.filter((a) => !CLOSED.includes(a.status));
    const kpis = {
      applications30d: appliedTimes.filter((t) => t >= d30).length,
      applicationsDelta: pctChange(
        appliedTimes.filter((t) => t >= d30).length,
        appliedTimes.filter((t) => inWindow(t, d60, d30)).length
      ),
      hired30d: hireTimes.filter((t) => t >= d30).length,
      hiredDelta: pctChange(hireTimes.filter((t) => t >= d30).length, hireTimes.filter((t) => inWindow(t, d60, d30)).length),
      activePipeline: activeApps.length,
      unassigned: activeApps.filter((a) => !a.assignedRecruiterId).length,
      stale: activeApps.filter((a) => a.status !== 'HIRED' && now - new Date(a.stageChangedAt) >= STALE_DAYS * DAY).length,
      avgAtsScore: apps.length ? Math.round(avg(apps.map((a) => a.atsScore || 0))) : null,
      avgTimeToHireDays: round1(avg(timeToHire)),
      openJobs: jobs.filter((j) => j.isActive).length,
      totalCandidates: candidates.length
    };

    // ---- ATS score distribution ----
    const scoreDistribution = SCORE_BUCKETS.map((b) => ({
      label: b.label,
      band: scoreBand(b.min),
      count: apps.filter((a) => (a.atsScore || 0) >= b.min && (a.atsScore || 0) < b.max).length
    }));

    // ---- Stage aging (bottlenecks) ----
    const stageAging = FUNNEL.filter((s) => s !== 'HIRED').map((stage) => {
      const inStage = apps.filter((a) => a.status === stage);
      const days = inStage.map((a) => (now - new Date(a.stageChangedAt)) / DAY);
      return {
        stage,
        count: inStage.length,
        avgDays: round1(avg(days)),
        stale: days.filter((d) => d >= STALE_DAYS).length
      };
    });

    // ---- Top jobs by applicants ----
    const topJobs = jobs
      .map((j) => {
        const ja = apps.filter((a) => a.jobId === j.id);
        return {
          id: j.id,
          title: j.title,
          division: j.division,
          isActive: j.isActive,
          applicants: ja.length,
          active: ja.filter((a) => !CLOSED.includes(a.status)).length,
          inInterview: ja.filter((a) => ['INTERVIEW_HR', 'INTERVIEW_USER'].includes(a.status)).length,
          hired: ja.filter((a) => a.status === 'HIRED').length,
          avgAts: ja.length ? Math.round(avg(ja.map((a) => a.atsScore || 0))) : null
        };
      })
      .filter((j) => j.applicants > 0)
      .sort((a, b) => b.applicants - a.applicants)
      .slice(0, 6);

    // ---- Talent mix ----
    const countBy = (rows, key) =>
      rows.reduce((acc, r) => {
        if (r[key]) acc[r[key]] = (acc[r[key]] || 0) + 1;
        return acc;
      }, {});

    return res.json({
      success: true,
      data: {
        generatedAt: new Date(now).toISOString(),
        weeks,
        kpis,
        trend,
        funnel,
        archived: { rejected: apps.filter((a) => a.status === 'REJECTED').length, talentPool: apps.filter((a) => a.status === 'TALENT_POOL').length },
        scoreDistribution,
        stageAging,
        topJobs,
        jobFamily: countBy(candidates, 'jobFamily'),
        intakeSource: countBy(candidates, 'intakeSource')
      }
    });
  } catch (error) {
    console.error('Error building dashboard analytics:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getDashboardAnalytics };
