const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeManpowerInput, canDecide, canEdit, canCancel, canConvert, canView, nextRequestNo, jobPrefill } = require('../../services/manpowerRules');

const valid = {
  companyId: 'pt-1',
  positionTitle: ' Store  Supervisor ',
  department: 'Retail Operations',
  division: 'MRA Retail',
  location: 'Bali',
  employmentType: 'Full-time',
  headcount: '2',
  reason: 'additional',
  justification: 'New boutique opening in Q1 needs two supervisors.',
  priority: 'urgent',
  targetStartDate: '2027-01-04',
  salaryMin: '8.000.000',
  salaryMax: 12000000,
  minExperience: '3',
  skills: ['Retail', 'retail', 'Leadership']
};

test('valid request is normalised', () => {
  const { data, errors } = sanitizeManpowerInput(valid);
  assert.deepEqual(errors, []);
  assert.equal(data.positionTitle, 'Store Supervisor');
  assert.equal(data.headcount, 2);
  assert.equal(data.reason, 'ADDITIONAL');
  assert.equal(data.priority, 'URGENT');
  assert.equal(data.salaryMin, 8000000);
  assert.equal(data.targetStartDate.toISOString(), '2027-01-04T00:00:00.000Z');
  assert.deepEqual(data.skills, ['Retail', 'Leadership']);
  assert.equal(data.replacementFor, null);
});

test('required fields, headcount, salary range and replacement name are checked', () => {
  const { errors } = sanitizeManpowerInput({ ...valid, companyId: '', headcount: 0, salaryMin: 20000000, reason: 'REPLACEMENT', justification: 'short' });
  assert.ok(errors.some((e) => e.includes('company')));
  assert.ok(errors.some((e) => e.includes('Headcount')));
  assert.ok(errors.some((e) => e.includes('Minimum salary')));
  assert.ok(errors.some((e) => e.includes('replaced')));
  assert.ok(errors.some((e) => e.includes('at least 10')));
});

const hm = { id: 'hm', role: 'HIRING_MANAGER' };
const lead = { id: 'lead', role: 'HR_ADMIN' };
const admin = { id: 'admin', role: 'SUPERADMIN' };
const recruiter = { id: 'rec', role: 'RECRUITER' };

test('approval rules: no self-approval except Super Admin, only pending', () => {
  const byHm = { requestedById: 'hm', status: 'PENDING', jobId: null };
  const byLead = { requestedById: 'lead', status: 'PENDING', jobId: null };
  assert.equal(canDecide(lead, byHm), true);
  assert.equal(canDecide(hm, byHm), false);
  assert.equal(canDecide(lead, byLead), false);
  assert.equal(canDecide(admin, { ...byHm, requestedById: 'admin' }), true);
  assert.equal(canDecide(lead, { ...byHm, status: 'APPROVED' }), false);
});

test('edit, cancel, open-as-job and visibility rules', () => {
  const pending = { requestedById: 'hm', status: 'PENDING', jobId: null };
  const approved = { ...pending, status: 'APPROVED' };
  assert.equal(canEdit(hm, pending), true);
  assert.equal(canEdit(hm, approved), false);
  assert.equal(canCancel(hm, approved), true);
  assert.equal(canCancel(hm, { ...approved, jobId: 'job' }), false);
  assert.equal(canConvert(lead, approved), true);
  assert.equal(canConvert(hm, approved), false);
  assert.equal(canConvert(lead, { ...approved, jobId: 'job' }), false);
  assert.equal(canView(recruiter, pending), true);
  assert.equal(canView({ id: 'other-hm', role: 'HIRING_MANAGER' }, pending), false);
});

test('request numbers and job prefill', () => {
  assert.equal(nextRequestNo(['MPR-2026-0004', 'MPR-2025-0099'], 2026), 'MPR-2026-0005');
  const p = jobPrefill({ ...sanitizeManpowerInput(valid).data, salaryMin: 8000000, salaryMax: 12000000, requestedBy: { id: 'hm', role: 'HIRING_MANAGER' } });
  assert.equal(p.title, 'Store Supervisor');
  assert.equal(p.companyId, 'pt-1');
  assert.equal(p.hiringManagerId, 'hm');
  assert.equal(p.salaryVisibility, 'CONFIDENTIAL');
  assert.deepEqual(p.mustHaveSkills, ['Retail', 'Leadership']);
});
