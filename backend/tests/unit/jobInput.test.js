const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeJobInput, salaryRangeError } = require('../../controllers/jobController');

test('only whitelisted fields are kept', () => {
  const { data } = sanitizeJobInput({ title: 'Dev', department: 'IT', id: 'x', slug: 'hack', createdAt: 'now', foo: 1 }, { partial: false });
  assert.deepEqual(Object.keys(data).sort(), ['department', 'title']);
});

test('create requires title and department', () => {
  assert.ok(sanitizeJobInput({ title: 'Dev' }, { partial: false }).error);
  assert.ok(sanitizeJobInput({ department: 'IT' }, { partial: false }).error);
});

test('partial update may omit fields but not blank them', () => {
  assert.equal(sanitizeJobInput({ location: 'Bali' }, { partial: true }).error, undefined);
  assert.ok(sanitizeJobInput({ title: '   ' }, { partial: true }).error);
});

test('keywords accept arrays or comma strings, trimmed and deduped case-insensitively', () => {
  assert.deepEqual(sanitizeJobInput({ mustHaveSkills: ' React, TypeScript ,react,, SQL' }, { partial: true }).data.mustHaveSkills, ['React', 'TypeScript', 'SQL']);
  assert.deepEqual(sanitizeJobInput({ niceToHaveSkills: ['Docker', 'docker', ' Prisma '] }, { partial: true }).data.niceToHaveSkills, ['Docker', 'Prisma']);
});

test('numbers are normalized and validated', () => {
  const { data } = sanitizeJobInput({ minExperience: '-3', salaryMin: '', salaryMax: '12000000', isActive: 0 }, { partial: true });
  assert.equal(data.minExperience, 0);
  assert.equal(data.salaryMin, null);
  assert.equal(data.salaryMax, 12000000);
  assert.equal(data.isActive, false);
  assert.ok(sanitizeJobInput({ salaryMax: 'abc' }, { partial: true }).error);
  assert.ok(sanitizeJobInput({ salaryMin: -1 }, { partial: true }).error);
});

test('salary range check', () => {
  assert.ok(salaryRangeError(20000000, 10000000));
  assert.equal(salaryRangeError(10000000, 20000000), null);
  assert.equal(salaryRangeError(null, 20000000), null);
});
