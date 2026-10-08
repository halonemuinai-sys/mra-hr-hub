/**
 * Talent pool matching — ranks existing candidates against a job with the same ATS engine as intake
 * (profilingService.calculateAtsMatchScore). Pure (no DB), unit-tested.
 *
 * Segments (why the person is worth a second look), in priority order:
 *   TALENT_POOL      parked in the Talent Pool column of another job
 *   SILVER_MEDALIST  rejected elsewhere after reaching an interview or later
 *   PAST_APPLICANT   rejected early elsewhere
 *   ACTIVE           still in another job's pipeline (shown only on request)
 * Excluded: anyone who already applied to this job, and hires (now employees).
 */
const { calculateAtsMatchScore } = require('./profilingService');
const { FUNNEL } = require('../config/stageRules');

const SEGMENTS = ['TALENT_POOL', 'SILVER_MEDALIST', 'PAST_APPLICANT', 'ACTIVE'];
const POOL_SEGMENTS = ['TALENT_POOL', 'SILVER_MEDALIST', 'PAST_APPLICANT'];
const CLOSED = ['HIRED', 'REJECTED', 'TALENT_POOL'];
const SILVER_FROM = FUNNEL.indexOf('INTERVIEW_HR');
const RECENT_REJECTION_DAYS = 90;
const DAY = 86400000;

const stageIndex = (s) => FUNNEL.indexOf(s);

/** Furthest funnel stage an application reached: its status, or the furthest STAGE_CHANGE target */
function furthestStage(status, reachedStatuses = []) {
  const all = [status, ...reachedStatuses].filter((s) => stageIndex(s) >= 0);
  return all.reduce((best, s) => (stageIndex(s) > stageIndex(best) ? s : best), all[0] || 'APPLIED');
}

/**
 * @param {object} cand { applications: [{ jobId, status, furthest, stageChangedAt }], employeeCount }
 * @returns segment key, 'HIRED', or null when the person already applied to this job
 */
function segmentOf(cand, jobId) {
  const apps = cand.applications || [];
  if (apps.some((a) => a.jobId === jobId)) return null;
  if ((cand.employeeCount || 0) > 0 || apps.some((a) => a.status === 'HIRED')) return 'HIRED';
  if (apps.some((a) => !CLOSED.includes(a.status))) return 'ACTIVE';
  if (apps.some((a) => a.status === 'TALENT_POOL')) return 'TALENT_POOL';
  if (apps.some((a) => a.status === 'REJECTED' && stageIndex(a.furthest || a.status) >= SILVER_FROM)) return 'SILVER_MEDALIST';
  return 'PAST_APPLICANT';
}

/** Days since the latest rejection (null when never rejected) */
function daysSinceRejection(cand, now = new Date()) {
  const times = (cand.applications || []).filter((a) => a.status === 'REJECTED' && a.stageChangedAt).map((a) => new Date(a.stageChangedAt).getTime());
  return times.length ? Math.floor((now.getTime() - Math.max(...times)) / DAY) : null;
}

/**
 * Ranks candidates for one job.
 * @param {object[]} candidates  profile (skills / experiences / educations) + applications + employeeCount
 * @param {object}   job         JobPosting
 * @param {object}   [opts]      { minScore = 60, segments = POOL_SEGMENTS, now }
 * @returns {{ matches: object[], counts: Record<string, number> }}  counts per segment above minScore (before the segment filter)
 */
function matchCandidatesToJob(candidates, job, opts = {}) {
  const minScore = Number.isFinite(opts.minScore) ? opts.minScore : 60;
  const segments = opts.segments && opts.segments.length ? opts.segments : POOL_SEGMENTS;
  const now = opts.now || new Date();
  const counts = Object.fromEntries(SEGMENTS.map((s) => [s, 0]));
  const matches = [];

  for (const cand of candidates) {
    const segment = segmentOf(cand, job.id);
    if (!segment || segment === 'HIRED') continue;
    const ev = calculateAtsMatchScore(cand, job);
    if (ev.atsScore < minScore) continue;
    counts[segment] += 1;
    if (!segments.includes(segment)) continue;
    const rejectedDays = daysSinceRejection(cand, now);
    matches.push({
      candidateId: cand.id,
      segment,
      atsScore: ev.atsScore,
      skillsScore: Math.round(ev.skillsScore),
      expScore: Math.round(ev.expScore),
      eduScore: Math.round(ev.eduScore),
      matchedKeywords: ev.matchedKeywords,
      missingKeywords: ev.missingKeywords,
      rejectedDaysAgo: rejectedDays,
      recentRejection: rejectedDays !== null && rejectedDays < RECENT_REJECTION_DAYS
    });
  }
  const rank = (s) => SEGMENTS.indexOf(s);
  matches.sort((a, b) => b.atsScore - a.atsScore || rank(a.segment) - rank(b.segment) || b.skillsScore - a.skillsScore);
  return { matches, counts };
}

/** Best open jobs for one candidate (jobs they never applied to), highest score first */
function bestJobsForCandidate(cand, jobs, { minScore = 60, limit = 3 } = {}) {
  const applied = new Set((cand.applications || []).map((a) => a.jobId));
  return jobs
    .filter((j) => !applied.has(j.id))
    .map((j) => ({ jobId: j.id, atsScore: calculateAtsMatchScore(cand, j).atsScore }))
    .filter((m) => m.atsScore >= minScore)
    .sort((a, b) => b.atsScore - a.atsScore)
    .slice(0, limit);
}

/**
 * Validates an "add to pipeline" request.
 * @returns {{ ids: string[], claim: boolean, error?: string }}
 */
function sanitizeInvite(body = {}) {
  const ids = [...new Set((Array.isArray(body.candidateIds) ? body.candidateIds : []).map((x) => String(x || '').trim()).filter(Boolean))];
  if (!ids.length) return { ids, claim: false, error: 'Choose at least one candidate.' };
  if (ids.length > 50) return { ids, claim: false, error: 'Add at most 50 candidates at a time.' };
  return { ids, claim: body.claim !== false };
}

module.exports = {
  SEGMENTS,
  POOL_SEGMENTS,
  RECENT_REJECTION_DAYS,
  furthestStage,
  segmentOf,
  daysSinceRejection,
  matchCandidatesToJob,
  bestJobsForCandidate,
  sanitizeInvite
};
