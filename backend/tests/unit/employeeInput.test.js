const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeEmployeeInput, suggestEmployeeNo } = require('../../services/employeeInput');

const valid = {
  employeeNo: ' mra-2026-0007 ',
  fullName: 'Utami Permata',
  personalEmail: 'Utami@Mail.com',
  position: 'Senior Frontend Engineer',
  department: 'IT',
  division: 'MRA Corporate',
  workLocation: 'Jakarta',
  employmentStatus: 'contract',
  joinDate: '2026-11-02'
};

test('valid input is normalised', () => {
  const { data, errors } = sanitizeEmployeeInput(valid);
  assert.deepEqual(errors, []);
  assert.equal(data.employeeNo, 'MRA-2026-0007');
  assert.equal(data.personalEmail, 'utami@mail.com');
  assert.equal(data.employmentStatus, 'CONTRACT');
  assert.equal(data.joinDate.toISOString(), '2026-11-02T00:00:00.000Z');
  assert.equal(data.workEmail, null);
});

test('required fields, emails, status and date are checked', () => {
  const { errors } = sanitizeEmployeeInput({ ...valid, employeeNo: '', personalEmail: 'nope', employmentStatus: 'FREELANCE', joinDate: 'soon' });
  assert.equal(errors.length, 4);
  assert.ok(errors.some((e) => e.includes('Employee ID')));
});

test('status defaults to probation', () => {
  const { data } = sanitizeEmployeeInput({ ...valid, employmentStatus: undefined });
  assert.equal(data.employmentStatus, 'PROBATION');
});

test('partial update only touches sent fields', () => {
  const { data, errors } = sanitizeEmployeeInput({ position: 'Lead Engineer' }, { partial: true });
  assert.deepEqual(errors, []);
  assert.deepEqual(data, { position: 'Lead Engineer' });
  assert.ok(sanitizeEmployeeInput({ fullName: '' }, { partial: true }).errors.length);
});

test('suggested NIK continues the year sequence', () => {
  assert.equal(suggestEmployeeNo([], 2026), 'MRA-2026-0001');
  assert.equal(suggestEmployeeNo(['MRA-2026-0003', 'MRA-2026-0011', 'MRA-2025-0099', 'X-1'], 2026), 'MRA-2026-0012');
});
