const { test } = require('node:test');
const assert = require('node:assert/strict');
const { furthestStage, segmentOf, daysSinceRejection, matchCandidatesToJob, bestJobsForCandidate, sanitizeInvite } = require('../../services/talentPoolMatcher');

const job = {
  id: 'job-store',
  title: 'Store Supervisor',
  mustHaveSkills: ['Retail Operations', 'Visual Merchandising', 'Team Leadership'],
  niceToHaveSkills: ['Luxury Retail'],
  minExperience: 3,
  minEducation: 'S1'
};
const otherJob = { id: 'job-dev', title: 'Backend Engineer', mustHaveSkills: ['Node.js', 'PostgreSQL'], niceToHaveSkills: [], minExperience: 2, minEducation: 'S1' };

const profile = (skills, years = 5, degree = 'S1') => ({
  skills: skills.map((skillName) => ({ skillName })),
  experiences: [{ roleTitle: 'Supervisor', description: '' }],
  educations: [{ degree }],
  totalExperienceYrs: years
});
const app = (jobId, status, extra = {}) => ({ jobId, status, furthest: status, stageChangedAt: new Date('2026-09-01T00:00:00Z'), ...extra });
const strongRetail = ['Retail Operations', 'Visual Merchandising', 'Leadership', 'Luxury Retail'];

test('furthest stage reached comes from the stage-change history', () => {
  assert.equal(furthestStage('REJECTED', ['ATS_SCREENED', 'INTERVIEW_USER', 'REJECTED']), 'INTERVIEW_USER');
  assert.equal(furthestStage('TALENT_POOL', []), 'APPLIED');
  assert.equal(furthestStage('SHORTLISTED'), 'SHORTLISTED');
});

test('segments: already applied and hires are excluded; pool, silver medalist, past applicant, active', () => {
  assert.equal(segmentOf({ applications: [app('job-store', 'REJECTED')] }, 'job-store'), null);
  assert.equal(segmentOf({ applications: [app('x', 'HIRED')] }, 'job-store'), 'HIRED');
  assert.equal(segmentOf({ applications: [app('x', 'REJECTED')], employeeCount: 1 }, 'job-store'), 'HIRED');
  assert.equal(segmentOf({ applications: [app('x', 'REJECTED'), app('y', 'INTERVIEW_HR')] }, 'job-store'), 'ACTIVE');
  assert.equal(segmentOf({ applications: [app('x', 'REJECTED'), app('y', 'TALENT_POOL')] }, 'job-store'), 'TALENT_POOL');
  assert.equal(segmentOf({ applications: [app('x', 'REJECTED', { furthest: 'INTERVIEW_HR' })] }, 'job-store'), 'SILVER_MEDALIST');
  assert.equal(segmentOf({ applications: [app('x', 'REJECTED', { furthest: 'SHORTLISTED' })] }, 'job-store'), 'PAST_APPLICANT');
});

test('days since the latest rejection', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  assert.equal(daysSinceRejection({ applications: [app('x', 'REJECTED'), app('y', 'REJECTED', { stageChangedAt: new Date('2026-09-21T00:00:00Z') })] }, now), 10);
  assert.equal(daysSinceRejection({ applications: [app('x', 'TALENT_POOL')] }, now), null);
});

test('job matching ranks by ATS score, filters by min score and segment, counts every segment', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  const cands = [
    { id: 'pool', ...profile(strongRetail), applications: [app('x', 'TALENT_POOL')] },
    { id: 'silver', ...profile(strongRetail, 2), applications: [app('x', 'REJECTED', { furthest: 'INTERVIEW_USER', stageChangedAt: new Date('2026-09-11T00:00:00Z') })] },
    { id: 'weak', ...profile(['Accounting'], 1, 'SMA'), applications: [app('x', 'REJECTED')] },
    { id: 'busy', ...profile(strongRetail), applications: [app('x', 'SHORTLISTED')] },
    { id: 'applied', ...profile(strongRetail), applications: [app('job-store', 'REJECTED')] },
    { id: 'hired', ...profile(strongRetail), applications: [app('x', 'HIRED')] }
  ];
  const { matches, counts } = matchCandidatesToJob(cands, job, { minScore: 60, now });
  assert.deepEqual(matches.map((m) => m.candidateId), ['pool', 'silver']);
  assert.ok(matches[0].atsScore > matches[1].atsScore, 'more experience scores higher');
  assert.ok(matches[0].atsScore >= 85);
  assert.ok(matches[0].matchedKeywords.includes('team leadership'), 'partial "Leadership" match counts');
  assert.equal(matches[1].recentRejection, true);
  assert.equal(matches[1].rejectedDaysAgo, 20);
  assert.deepEqual(counts, { TALENT_POOL: 1, SILVER_MEDALIST: 1, PAST_APPLICANT: 0, ACTIVE: 1 });

  const withActive = matchCandidatesToJob(cands, job, { minScore: 60, segments: ['ACTIVE'], now });
  assert.deepEqual(withActive.matches.map((m) => m.candidateId), ['busy']);
  assert.equal(matchCandidatesToJob(cands, job, { minScore: 0, now }).counts.PAST_APPLICANT, 1, 'weak profile appears once the bar is lowered');
});

test('best jobs for a candidate skip jobs they applied to', () => {
  const cand = { id: 'c', ...profile([...strongRetail, 'Node.js', 'PostgreSQL']), applications: [app('job-dev', 'REJECTED')] };
  const best = bestJobsForCandidate(cand, [job, otherJob]);
  assert.deepEqual(best.map((b) => b.jobId), ['job-store']);
});

test('add-to-pipeline input: unique ids, 1–50, claim on by default', () => {
  assert.deepEqual(sanitizeInvite({ candidateIds: ['a', 'a', ' b ', ''] }), { ids: ['a', 'b'], claim: true });
  assert.equal(sanitizeInvite({ candidateIds: ['a'], claim: false }).claim, false);
  assert.ok(sanitizeInvite({}).error);
  assert.ok(sanitizeInvite({ candidateIds: Array.from({ length: 51 }, (_, i) => `c${i}`) }).error);
});
