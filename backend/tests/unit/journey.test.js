const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildJourney } = require('../../services/journeyService');

const d = (s) => new Date(`2026-09-${s}T09:00:00Z`);
const siti = { id: 'u1', name: 'Siti' };
const lead = { id: 'u2', name: 'Budi' };
const hm = { id: 'u3', name: 'Hendrawan' };
const move = (at, from, to, actor = siti, stageData = null) => ({ action: 'STAGE_CHANGE', createdAt: d(at), fromStatus: from, toStatus: to, actor, stageData });

const activities = [
  { action: 'CLAIM', createdAt: d('02'), actor: siti },
  move('03', 'APPLIED', 'ATS_SCREENED'),
  move('05', 'ATS_SCREENED', 'SHORTLISTED', siti, { rating: 4 }),
  move('08', 'SHORTLISTED', 'INTERVIEW_HR', siti, { interviewAt: '2026-09-09T10:00', interviewer: 'Siti' }),
  move('10', 'INTERVIEW_HR', 'SHORTLISTED', siti), // moved back
  move('11', 'SHORTLISTED', 'INTERVIEW_HR'),
  move('14', 'INTERVIEW_HR', 'INTERVIEW_USER'),
  move('17', 'INTERVIEW_USER', 'OFFERING', lead, { offerSalary: 15000000 }),
  { action: 'APPROVAL_REQUESTED', createdAt: d('20'), actor: siti, toStatus: 'HIRED' },
  move('22', 'OFFERING', 'HIRED', hm, { joinDate: '2026-10-01', offerSigned: true }),
  { action: 'EMPLOYEE_REGISTERED', createdAt: d('23'), actor: siti, note: 'NIK MRA-2026-0001' }
].reverse(); // order must not matter

const requests = [{ id: 'r1', toStatus: 'HIRED', status: 'APPROVED', approvalReason: 'HM confirms', createdAt: d('20'), decidedAt: d('22'), requestedBy: siti, decidedBy: hm }];

test('journey: stage visits, durations, events and after-hire', () => {
  const j = buildJourney({ application: { appliedAt: d('01') }, activities, requests, now: d('30') });
  assert.deepEqual(j.stages.map((s) => s.status), ['APPLIED', 'ATS_SCREENED', 'SHORTLISTED', 'INTERVIEW_HR', 'SHORTLISTED', 'INTERVIEW_HR', 'INTERVIEW_USER', 'OFFERING', 'HIRED']);
  assert.equal(j.stages[0].days, 2);
  assert.equal(j.stages[0].events[0].action, 'CLAIM');
  assert.equal(j.stages[4].backward, true);
  assert.equal(j.stages[8].days, null, 'HIRED has no duration');
  assert.equal(j.stages[8].current, true);
  assert.equal(j.stages[7].events[0].action, 'APPROVAL_REQUESTED');
  assert.deepEqual(j.afterHire.map((a) => a.action), ['EMPLOYEE_REGISTERED']);
});

test('journey: metrics', () => {
  const j = buildJourney({ application: { appliedAt: d('01') }, activities, requests, employee: { joinDate: new Date('2026-10-01T00:00:00Z') }, now: d('30') });
  assert.equal(j.metrics.timeToHireDays, 21);
  assert.equal(j.metrics.timeToClaimDays, 1);
  assert.equal(j.metrics.timeToInterviewDays, 7);
  assert.equal(j.metrics.offerToHireDays, 5);
  assert.equal(j.metrics.interviewCount, 3);
  assert.equal(j.metrics.backMoves, 1);
  assert.equal(j.metrics.peopleInvolved, 3);
  assert.equal(j.metrics.approvalWaitDays, 2);
  assert.deepEqual(j.metrics.slowestStage, { status: 'OFFERING', days: 5 });
  assert.equal(j.metrics.offerSalary, 15000000);
  assert.equal(j.metrics.hireToJoinDays, 9);
  assert.equal(j.approvals[0].decidedBy, 'Hendrawan');
});

test('journey without any activity is a single APPLIED visit', () => {
  const j = buildJourney({ application: { appliedAt: d('01') }, now: d('04') });
  assert.equal(j.stages.length, 1);
  assert.equal(j.stages[0].days, 3);
  assert.equal(j.metrics.timeToHireDays, null);
});
