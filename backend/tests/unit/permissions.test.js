const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PERMISSIONS, ROLE_PERMISSIONS, PIC_ROLES, hasPermission, permissionsFor } = require('../../config/permissions');

test('every role only references known permission keys', () => {
  const keys = new Set(PERMISSIONS.map((p) => p.key));
  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    for (const p of perms) assert.ok(keys.has(p), `${role} has unknown permission ${p}`);
  }
});

test('Super Admin holds every permission', () => {
  assert.equal(permissionsFor('SUPERADMIN').length, PERMISSIONS.length);
});

test('only Super Admin manages users', () => {
  assert.equal(hasPermission('SUPERADMIN', 'users.manage'), true);
  for (const role of ['HR_ADMIN', 'RECRUITER', 'HIRING_MANAGER']) assert.equal(hasPermission(role, 'users.manage'), false);
});

test('hire confirmation belongs to the Hiring Manager, not the TA Lead', () => {
  assert.equal(hasPermission('HIRING_MANAGER', 'approval.hire'), true);
  assert.equal(hasPermission('HR_ADMIN', 'approval.hire'), false);
  assert.equal(hasPermission('HR_ADMIN', 'approval.offer'), true);
});

test('recruiters move their own candidates only', () => {
  assert.equal(hasPermission('RECRUITER', 'pipeline.move.own'), true);
  assert.equal(hasPermission('RECRUITER', 'pipeline.move.any'), false);
  assert.equal(hasPermission('RECRUITER', 'pipeline.assign'), false);
});

test('hiring managers cannot claim or move candidates', () => {
  assert.equal(hasPermission('HIRING_MANAGER', 'pipeline.claim'), false);
  assert.equal(hasPermission('HIRING_MANAGER', 'pipeline.move.own'), false);
});

test('PIC roles are exactly the roles that can claim', () => {
  assert.deepEqual([...PIC_ROLES].sort(), ['HR_ADMIN', 'RECRUITER', 'SUPERADMIN']);
});

test('unknown roles and missing users get nothing', () => {
  assert.deepEqual(permissionsFor('INTERN'), []);
  assert.equal(hasPermission(null, 'dashboard.view'), false);
  assert.equal(hasPermission({ role: 'RECRUITER' }, 'dashboard.view'), true);
});
