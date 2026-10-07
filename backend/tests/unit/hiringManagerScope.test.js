const { test } = require('node:test');
const assert = require('node:assert/strict');
const { jobScope, applicationScope, canAccessJob, isScopedHiringManager } = require('../../services/hiringManagerScope');

const hm = { id: 'hm-1', role: 'HIRING_MANAGER' };

test('only Hiring Managers are scoped', () => {
  assert.equal(isScopedHiringManager(hm), true);
  for (const role of ['SUPERADMIN', 'HR_ADMIN', 'RECRUITER']) {
    assert.equal(jobScope({ id: 'x', role }), null);
    assert.deepEqual(applicationScope({ id: 'x', role }), {});
  }
});

test('a Hiring Manager sees their own jobs and unassigned jobs', () => {
  assert.deepEqual(jobScope(hm), { OR: [{ hiringManagerId: 'hm-1' }, { hiringManagerId: null }] });
  assert.deepEqual(applicationScope(hm), { job: jobScope(hm) });
});

test('canAccessJob', () => {
  assert.equal(canAccessJob(hm, { hiringManagerId: 'hm-1' }), true);
  assert.equal(canAccessJob(hm, { hiringManagerId: null }), true);
  assert.equal(canAccessJob(hm, { hiringManagerId: 'hm-2' }), false);
  assert.equal(canAccessJob({ id: 'a', role: 'SUPERADMIN' }, { hiringManagerId: 'hm-2' }), true);
});
