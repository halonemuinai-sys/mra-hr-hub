const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProfile } = require('../../services/candidateIntakeService');

test('email is trimmed and lower-cased (matching is case-insensitive)', () => {
  assert.equal(normalizeProfile({ fullName: ' Andi ', email: '  Andi.W@Example.COM ' }).email, 'andi.w@example.com');
  assert.equal(normalizeProfile({ fullName: ' Andi ' }).fullName, 'Andi');
});

test('skills accept strings or objects and drop empties', () => {
  const p = normalizeProfile({ skills: ['React', { skillName: 'SQL', category: 'TOOLS' }, { skillName: '' }, null] });
  assert.deepEqual(p.skills.map((s) => s.skillName), ['React', 'SQL']);
  assert.equal(p.skills[1].category, 'TOOLS');
  assert.equal(p.skills[0].proficiency, 'INTERMEDIATE');
});

test('numbers and dates are normalized with safe defaults', () => {
  const p = normalizeProfile({
    totalExperienceYrs: 'abc',
    expectedSalary: '9000000',
    experiences: [{ startDate: '2020-01-01' }],
    educations: [{ graduationYear: '2019', gpa: '3.5' }]
  });
  assert.equal(p.totalExperienceYrs, 0);
  assert.equal(p.expectedSalary, 9000000);
  assert.ok(p.experiences[0].startDate instanceof Date);
  assert.equal(p.experiences[0].companyName, 'Perusahaan');
  assert.equal(p.educations[0].graduationYear, 2019);
  assert.equal(p.educations[0].gpa, 3.5);
});

test('missing arrays become empty arrays', () => {
  const p = normalizeProfile({ fullName: 'X', email: 'x@y.z' });
  assert.deepEqual([p.skills, p.experiences, p.educations], [[], [], []]);
});
