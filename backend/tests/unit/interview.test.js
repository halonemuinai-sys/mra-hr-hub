const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildInterviews, summarize, sanitizeSchedule } = require('../../services/interviewService');

const now = new Date('2026-10-08T09:00:00');
const at = (s) => new Date(s);
const move = (id, to, createdAt, stageData = null) => ({ id, action: 'STAGE_CHANGE', toStatus: to, createdAt: at(createdAt), stageData });
const resched = (id, createdAt, stageData) => ({ id, action: 'INTERVIEW_SCHEDULED', toStatus: 'INTERVIEW_HR', createdAt: at(createdAt), stageData });
const app = (id, status, activities) => ({ id, status, candidate: { fullName: id }, job: { title: 'Job' }, assignedRecruiter: { id: 'pic' }, activities });

test('upcoming, awaiting outcome, completed, cancelled and unscheduled', () => {
  const apps = [
    app('upcoming', 'INTERVIEW_HR', [move('a1', 'INTERVIEW_HR', '2026-10-06T08:00', { interviewAt: '2026-10-09T10:00', interviewer: 'Siti', interviewMode: 'Online' })]),
    app('awaiting', 'INTERVIEW_USER', [move('b1', 'INTERVIEW_USER', '2026-10-01T08:00', { interviewAt: '2026-10-07T14:00', hiringManager: 'Hendrawan' })]),
    app('done', 'OFFERING', [move('c1', 'INTERVIEW_USER', '2026-09-20T08:00', { interviewAt: '2026-09-22T10:00', hiringManager: 'Hendrawan' }), move('c2', 'OFFERING', '2026-09-25T08:00')]),
    app('cancel', 'REJECTED', [move('d1', 'INTERVIEW_HR', '2026-10-01T08:00', { interviewAt: '2026-10-10T10:00', interviewer: 'Dewi' }), move('d2', 'REJECTED', '2026-10-02T08:00')]),
    app('nodate', 'INTERVIEW_HR', [move('e1', 'INTERVIEW_HR', '2026-10-05T08:00')])
  ];
  const { events, unscheduled } = buildInterviews(apps, now);
  const by = Object.fromEntries(events.map((e) => [e.applicationId, e]));
  assert.equal(by.upcoming.status, 'UPCOMING');
  assert.equal(by.upcoming.mode, 'Online');
  assert.equal(by.awaiting.status, 'AWAITING_OUTCOME');
  assert.equal(by.awaiting.interviewer, 'Hendrawan');
  assert.equal(by.done.status, 'COMPLETED');
  assert.equal(by.done.outcome, 'OFFERING');
  assert.equal(by.cancel.status, 'CANCELLED');
  assert.deepEqual(unscheduled.map((u) => u.applicationId), ['nodate']);
});

test('a reschedule during the visit overrides the stage-gate schedule', () => {
  const { events } = buildInterviews([
    app('x', 'INTERVIEW_HR', [
      move('m', 'INTERVIEW_HR', '2026-10-05T08:00', { interviewAt: '2026-10-09T10:00', interviewer: 'Siti', interviewMode: 'Online' }),
      resched('r', '2026-10-07T08:00', { interviewAt: '2026-10-12T15:00', interviewer: 'Siti' })
    ])
  ], now);
  assert.equal(events.length, 1);
  assert.equal(events[0].interviewAt, '2026-10-12T15:00');
  assert.equal(events[0].mode, 'Online', 'fields not in the reschedule are kept');
  assert.equal(events[0].rescheduled, 1);
  assert.equal(events[0].id, 'r');
});

test('overlapping slots for the same interviewer are conflicts; different interviewers are not', () => {
  const { events } = buildInterviews([
    app('p', 'INTERVIEW_HR', [move('p1', 'INTERVIEW_HR', '2026-10-05T08:00', { interviewAt: '2026-10-09T10:00', interviewer: 'Siti Rahma' })]),
    app('q', 'INTERVIEW_HR', [move('q1', 'INTERVIEW_HR', '2026-10-05T08:00', { interviewAt: '2026-10-09T10:30', interviewer: ' siti  rahma ' })]),
    app('r', 'INTERVIEW_HR', [move('r1', 'INTERVIEW_HR', '2026-10-05T08:00', { interviewAt: '2026-10-09T10:00', interviewer: 'Dewi' })])
  ], now);
  const by = Object.fromEntries(events.map((e) => [e.applicationId, e]));
  assert.equal(by.p.conflict, true);
  assert.equal(by.q.conflict, true);
  assert.equal(by.r.conflict, false);
  const s = summarize(events, [], now);
  assert.equal(s.conflicts, 2);
  assert.equal(s.thisWeek, 3);
  assert.equal(s.interviewersThisWeek[0].count, 2);
});

test('schedule input is validated', () => {
  assert.deepEqual(sanitizeSchedule({ interviewAt: '2026-10-12T10:00', interviewer: 'Siti', interviewMode: 'Onsite' }, now).errors, []);
  const bad = sanitizeSchedule({ interviewAt: '', interviewer: '', interviewMode: 'Phone' }, now).errors;
  assert.equal(bad.length, 3);
  assert.ok(sanitizeSchedule({ interviewAt: '2026-09-01T10:00', interviewer: 'Siti' }, now).errors[0].includes('past'));
});
