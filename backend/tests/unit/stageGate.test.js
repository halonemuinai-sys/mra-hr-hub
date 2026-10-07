const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateTransition } = require('../../services/stageGateService');

const recruiter = { role: 'RECRUITER' };
const lead = { role: 'HR_ADMIN' };
const base = { status: 'SHORTLISTED', atsScore: 80, scorecardRating: 4, job: { salaryMax: 20000000 } };
const ev = (app, toStatus, data = {}, user = recruiter) => evaluateTransition({ app: { ...base, ...app }, toStatus, data, user });

test('Interview HR requires schedule fields', () => {
  const empty = ev({}, 'INTERVIEW_HR');
  assert.equal(empty.direct, false);
  assert.deepEqual(empty.fields.map((f) => f.key), ['interviewAt', 'interviewer', 'interviewMode']);
  assert.equal(empty.errors.length, 3);

  const filled = ev({}, 'INTERVIEW_HR', { interviewAt: '2026-10-10T10:00', interviewer: 'Siti', interviewMode: 'Online' });
  assert.equal(filled.direct, true);
  assert.equal(filled.errors.length, 0);
});

test('select fields only accept their options', () => {
  const r = ev({}, 'INTERVIEW_HR', { interviewAt: '2026-10-10T10:00', interviewer: 'Siti', interviewMode: 'Phone' });
  assert.ok(r.errors.some((e) => e.includes('Mode')));
});

test('recruiters cannot skip stages; leads can with a reason', () => {
  const rec = ev({ status: 'INTERVIEW_HR' }, 'OFFERING');
  assert.ok(rec.blocks.some((b) => b.includes('Skipping')));

  const ld = ev({ status: 'INTERVIEW_HR' }, 'OFFERING', {}, lead);
  assert.equal(ld.blocks.length, 0);
  assert.ok(ld.fields.some((f) => f.key === 'reason'));
});

test('offer above the job budget needs TA Lead approval, within budget does not', () => {
  const data = { hmFeedback: 'ok', startDate: '2026-11-01' };
  const over = ev({ status: 'INTERVIEW_USER' }, 'OFFERING', { ...data, offerSalary: 30000000 });
  assert.equal(over.approval?.permission, 'approval.offer');

  const under = ev({ status: 'INTERVIEW_USER' }, 'OFFERING', { ...data, offerSalary: 15000000 });
  assert.equal(under.approval, null);
  assert.equal(under.direct, true);
});

test('a lead holding approval.offer is not asked to approve their own offer', () => {
  const r = ev({ status: 'INTERVIEW_USER' }, 'OFFERING', { hmFeedback: 'ok', startDate: '2026-11-01', offerSalary: 30000000 }, lead);
  assert.equal(r.approval, null);
  assert.ok(r.warnings.some((w) => w.includes('approval right')));
});

test('hire always needs Hiring Manager confirmation for recruiters and leads', () => {
  const data = { offerSigned: true, joinDate: '2026-11-01' };
  assert.equal(ev({ status: 'OFFERING' }, 'HIRED', data).approval?.permission, 'approval.hire');
  assert.equal(ev({ status: 'OFFERING' }, 'HIRED', data, lead).approval?.permission, 'approval.hire');
  assert.equal(ev({ status: 'OFFERING' }, 'HIRED', data, { role: 'SUPERADMIN' }).approval, null);
});

test('HR rating below 3 blocks the user interview', () => {
  const r = ev({ status: 'INTERVIEW_HR', scorecardRating: 2 }, 'INTERVIEW_USER', {
    recommendation: 'Proceed', interviewAt: '2026-10-12T10:00', hiringManager: 'H'
  });
  assert.ok(r.blocks.some((b) => b.includes('rating')));
});

test('moving back, re-opening and rejecting need a reason', () => {
  assert.ok(ev({}, 'APPLIED').errors.length > 0);
  assert.equal(ev({}, 'APPLIED', { reason: 'Data salah' }).errors.length, 0);
  assert.ok(ev({ status: 'REJECTED' }, 'SHORTLISTED').fields.some((f) => f.key === 'reason'));
  assert.equal(ev({}, 'REJECTED', { reason: 'Gaji' }).direct, true);
});

test('low ATS score needs a justification to pass screening', () => {
  const low = ev({ status: 'APPLIED', atsScore: 50 }, 'ATS_SCREENED');
  assert.ok(low.errors.length > 0);
  assert.equal(ev({ status: 'APPLIED', atsScore: 75 }, 'ATS_SCREENED').direct, true);
});

test('existing rating pre-fills the Shortlisted gate', () => {
  const r = ev({ status: 'ATS_SCREENED', scorecardRating: 4 }, 'SHORTLISTED');
  assert.equal(r.values.rating, 4);
  assert.equal(r.direct, true);
});

test('invalid and same-stage moves are blocked', () => {
  assert.ok(ev({}, 'NOPE').blocks.length > 0);
  assert.ok(ev({}, 'SHORTLISTED').blocks.some((b) => b.includes('already')));
});
