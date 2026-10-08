/**
 * Talent pool matching (TA team, pipeline.claim).
 *   GET  /api/talent-pool/jobs                 → open jobs with their number of pool matches
 *   GET  /api/talent-pool/jobs/:jobId          → ranked existing candidates for one job (?minScore=&segments=&search=)
 *   GET  /api/talent-pool/candidates           → the pool (talent pool / silver medalists / past applicants) with their best open jobs
 *   POST /api/talent-pool/jobs/:jobId/add      → put chosen candidates into the job's pipeline (Applied), optionally claimed
 * Scores come from the same ATS engine as intake, computed live against the stored profile.
 */
const prisma = require('../api/db');
const { calculateAtsMatchScore } = require('../services/profilingService');
const {
  SEGMENTS,
  POOL_SEGMENTS,
  furthestStage,
  segmentOf,
  daysSinceRejection,
  matchCandidatesToJob,
  bestJobsForCandidate,
  sanitizeInvite
} = require('../services/talentPoolMatcher');

const STRONG = 75;
const JOB_SELECT = {
  id: true, title: true, department: true, division: true, location: true, employmentType: true, minExperience: true, minEducation: true,
  mustHaveSkills: true, niceToHaveSkills: true, isActive: true, createdAt: true, companyId: true,
  company: { select: { id: true, code: true, name: true } }
};
const SEGMENT_LABEL = { TALENT_POOL: 'Talent pool', SILVER_MEDALIST: 'Silver medalist', PAST_APPLICANT: 'Past applicant', ACTIVE: 'Active elsewhere' };

/** Every candidate with profile, applications (incl. furthest stage reached) and hire count */
async function loadCandidates(where = {}) {
  const [cands, reached] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: {
        skills: true,
        experiences: true,
        educations: true,
        applications: {
          select: { id: true, jobId: true, status: true, stageChangedAt: true, appliedAt: true, job: { select: { title: true, company: { select: { code: true } } } } }
        },
        _count: { select: { employees: true } }
      }
    }),
    prisma.applicationActivity.findMany({
      where: { action: 'STAGE_CHANGE', application: { status: { in: ['REJECTED', 'TALENT_POOL'] }, ...(where.id ? { candidateId: where.id } : {}) } },
      select: { applicationId: true, toStatus: true }
    })
  ]);
  const byApp = new Map();
  reached.forEach((r) => byApp.set(r.applicationId, [...(byApp.get(r.applicationId) || []), r.toStatus]));
  return cands.map((c) => ({
    ...c,
    employeeCount: c._count.employees,
    applications: c.applications.map((a) => ({ ...a, furthest: furthestStage(a.status, byApp.get(a.id)) }))
  }));
}

const summary = (c, now = new Date()) => ({
  id: c.id,
  fullName: c.fullName,
  email: c.email,
  phone: c.phone,
  location: c.location,
  headline: c.headline,
  currentCompany: c.currentCompany,
  totalExperienceYrs: c.totalExperienceYrs,
  expectedSalary: c.expectedSalary === null ? null : Number(c.expectedSalary),
  availability: c.availability,
  seniorityLevel: c.seniorityLevel,
  jobFamily: c.jobFamily,
  hasResume: !!c.rawResumePath,
  skills: c.skills.map((s) => s.skillName).slice(0, 12),
  rejectedDaysAgo: daysSinceRejection(c, now),
  history: [...c.applications]
    .sort((a, b) => new Date(b.stageChangedAt) - new Date(a.stageChangedAt))
    .map((a) => ({ jobId: a.jobId, jobTitle: a.job.title, companyCode: a.job.company && a.job.company.code, status: a.status, furthest: a.furthest, date: a.stageChangedAt }))
});

const matchesSearch = (c, q) =>
  !q || [c.fullName, c.email, c.headline, c.currentCompany, c.location, ...c.skills.map((s) => s.skillName)].some((v) => v && v.toLowerCase().includes(q));

function parseSegments(raw) {
  const list = String(raw || '').split(',').map((s) => s.trim().toUpperCase()).filter((s) => SEGMENTS.includes(s));
  return list.length ? list : POOL_SEGMENTS;
}
const parseMin = (raw, dflt = 60) => {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : dflt;
};

async function listJobs(req, res) {
  try {
    const [jobs, cands] = await Promise.all([
      prisma.jobPosting.findMany({ where: { isActive: true }, select: JOB_SELECT, orderBy: { createdAt: 'desc' } }),
      loadCandidates()
    ]);
    const data = jobs.map((j) => {
      const { matches } = matchCandidatesToJob(cands, j, { minScore: 60 });
      return { ...j, matches: matches.length, strongMatches: matches.filter((m) => m.atsScore >= STRONG).length, topScore: matches[0] ? matches[0].atsScore : null };
    });
    return res.json({ success: true, data, poolSize: cands.filter((c) => POOL_SEGMENTS.includes(segmentOf(c, null))).length });
  } catch (error) {
    console.error('Error listing talent pool jobs:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function matchJob(req, res) {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: String(req.params.jobId) }, select: JOB_SELECT });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    const q = String(req.query.search || '').trim().toLowerCase();
    const cands = (await loadCandidates()).filter((c) => matchesSearch(c, q));
    const now = new Date();
    const { matches, counts } = matchCandidatesToJob(cands, job, { minScore: parseMin(req.query.minScore), segments: parseSegments(req.query.segments), now });
    const byId = new Map(cands.map((c) => [c.id, c]));
    return res.json({
      success: true,
      job,
      counts,
      data: matches.slice(0, 200).map((m) => ({ ...m, candidate: summary(byId.get(m.candidateId), now) }))
    });
  } catch (error) {
    console.error('Error matching talent pool:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function listPool(req, res) {
  try {
    const q = String(req.query.search || '').trim().toLowerCase();
    const segments = parseSegments(req.query.segments);
    const [jobs, all] = await Promise.all([
      prisma.jobPosting.findMany({ where: { isActive: true }, select: JOB_SELECT }),
      loadCandidates()
    ]);
    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const now = new Date();
    const counts = Object.fromEntries(SEGMENTS.map((s) => [s, 0]));
    const data = [];
    for (const c of all) {
      const segment = segmentOf(c, null);
      if (!SEGMENTS.includes(segment) || !matchesSearch(c, q)) continue;
      counts[segment] += 1;
      if (!segments.includes(segment)) continue;
      const best = bestJobsForCandidate(c, jobs, { minScore: parseMin(req.query.minScore) }).map((m) => {
        const j = jobById.get(m.jobId);
        return { ...m, title: j.title, companyCode: j.company && j.company.code };
      });
      data.push({ segment, candidate: summary(c, now), bestJobs: best, topScore: best[0] ? best[0].atsScore : null });
    }
    const rank = (s) => SEGMENTS.indexOf(s);
    data.sort((a, b) => (b.topScore ?? -1) - (a.topScore ?? -1) || rank(a.segment) - rank(b.segment));
    return res.json({ success: true, data, counts });
  } catch (error) {
    console.error('Error listing talent pool:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function addToJob(req, res) {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: String(req.params.jobId) }, select: JOB_SELECT });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (!job.isActive) return res.status(409).json({ success: false, message: 'The job is closed — reopen it before adding candidates.' });
    const { ids, claim, error } = sanitizeInvite(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const cands = await loadCandidates({ id: { in: ids } });
    const now = new Date();
    const added = [];
    const skipped = [];
    for (const id of ids) {
      const c = cands.find((x) => x.id === id);
      const segment = c ? segmentOf(c, job.id) : undefined;
      if (!c) skipped.push({ id, reason: 'Candidate not found' });
      else if (segment === null) skipped.push({ id, name: c.fullName, reason: 'Already in this job’s pipeline' });
      else if (segment === 'HIRED') skipped.push({ id, name: c.fullName, reason: 'Already hired' });
      if (!c || segment === null || segment === 'HIRED') continue;

      const ev = calculateAtsMatchScore(c, job);
      try {
        await prisma.$transaction(async (tx) => {
          const app = await tx.jobApplication.create({
            data: {
              id: `${job.id}_${c.id}`,
              jobId: job.id,
              candidateId: c.id,
              status: 'APPLIED',
              atsScore: ev.atsScore,
              skillsScore: ev.skillsScore,
              expScore: ev.expScore,
              eduScore: ev.eduScore,
              matchedKeywords: ev.matchedKeywords,
              missingKeywords: ev.missingKeywords,
              stageChangedAt: now,
              ...(claim ? { assignedRecruiterId: req.user.id, assignedAt: now } : {})
            }
          });
          await tx.applicationActivity.create({
            data: {
              applicationId: app.id,
              actorId: req.user.id,
              action: 'TALENT_POOL_ADDED',
              toStatus: 'APPLIED',
              note: `${SEGMENT_LABEL[segment]} · ATS ${ev.atsScore}`,
              stageData: { source: 'TALENT_POOL', segment, atsScore: ev.atsScore, previousJobs: c.applications.map((a) => `${a.job.title} (${a.status})`).slice(0, 5) }
            }
          });
          if (claim) await tx.applicationActivity.create({ data: { applicationId: app.id, actorId: req.user.id, action: 'CLAIM', toStatus: 'APPLIED' } });
        });
        added.push({ id: c.id, name: c.fullName, atsScore: ev.atsScore });
      } catch (err) {
        if (err.code !== 'P2002') throw err;
        skipped.push({ id, name: c.fullName, reason: 'Already in this job’s pipeline' });
      }
    }
    poolCache = null;
    const message = added.length
      ? `${added.length} candidate${added.length === 1 ? '' : 's'} added to ${job.title}${claim ? ' and assigned to you' : ''}.${skipped.length ? ` ${skipped.length} skipped.` : ''}`
      : 'Nobody was added.';
    return res.status(added.length ? 201 : 200).json({ success: true, message, data: { added, skipped } });
  } catch (error) {
    console.error('Error adding talent pool candidates:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** For reminders: new jobs (≤14 days) with strong talent-pool / silver-medalist matches. Cached 5 minutes. */
let poolCache = null;
async function recentJobsWithStrongMatches() {
  if (poolCache && Date.now() - poolCache.at < 5 * 60000) return poolCache.data;
  const since = new Date(Date.now() - 14 * 86400000);
  const jobs = await prisma.jobPosting.findMany({ where: { isActive: true, createdAt: { gte: since } }, select: JOB_SELECT });
  let data = [];
  if (jobs.length) {
    const cands = await loadCandidates();
    data = jobs
      .map((j) => ({ id: j.id, title: j.title, strong: matchCandidatesToJob(cands, j, { minScore: 80, segments: ['TALENT_POOL', 'SILVER_MEDALIST'] }).matches.length }))
      .filter((j) => j.strong > 0);
  }
  poolCache = { at: Date.now(), data };
  return data;
}

module.exports = { listJobs, matchJob, listPool, addToJob, recentJobsWithStrongMatches };
