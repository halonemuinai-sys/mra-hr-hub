/**
 * API tests against the real database. Read-only by design: every request either reads
 * or is expected to be refused/rejected before it writes, so the shared DB is never changed.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../api/app');

let server;
let BASE;
const tokens = {};
const ACCOUNTS = {
  SUPERADMIN: 'admin@mragroup.co.id',
  RECRUITER: 'ta.dewi@mragroup.co.id',
  HIRING_MANAGER: 'hiring.manager@mragroup.co.id'
};

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  BASE = `http://127.0.0.1:${server.address().port}/api`;
  for (const [role, email] of Object.entries(ACCOUNTS)) {
    const r = await call('POST', '/auth/login', { body: { email, password: 'Password123!' } });
    assert.equal(r.status, 200, `login ${role}`);
    tokens[role] = r.body.token;
  }
});

after(() => {
  server.close();
  // Prisma's pool keeps the process alive; tests are done
  setTimeout(() => process.exit(0), 100).unref();
});

test('login returns the role permission list', async () => {
  const r = await call('POST', '/auth/login', { body: { email: ACCOUNTS.RECRUITER, password: 'Password123!' } });
  assert.ok(r.body.user.permissions.includes('pipeline.claim'));
  assert.equal(r.body.user.permissions.includes('users.manage'), false);
});

test('wrong password and unknown email are refused', async () => {
  assert.equal((await call('POST', '/auth/login', { body: { email: ACCOUNTS.RECRUITER, password: 'nope' } })).status, 401);
  assert.equal((await call('POST', '/auth/login', { body: { email: 'ghost@example.com', password: 'x' } })).status, 401);
});

test('CMS endpoints require a token', async () => {
  for (const path of ['/candidates', '/candidates/pipeline', '/stats/dashboard', '/team/performance', '/users', '/reminders']) {
    assert.equal((await call('GET', path)).status, 401, path);
  }
  assert.equal((await call('GET', '/candidates', { token: 'not-a-jwt' })).status, 401);
});

test('permissions are enforced per role', async () => {
  assert.equal((await call('GET', '/users', { token: tokens.RECRUITER })).status, 403);
  assert.equal((await call('GET', '/team/performance', { token: tokens.RECRUITER })).status, 403);
  assert.equal((await call('GET', '/team/rebalance', { token: tokens.HIRING_MANAGER })).status, 403);
  assert.equal((await call('POST', '/jobs', { token: tokens.RECRUITER, body: {} })).status, 403);
  assert.equal((await call('POST', '/candidates/applications/assign', { token: tokens.RECRUITER, body: { applicationIds: ['x'], recruiterId: 'y' } })).status, 403);
  assert.equal((await call('PATCH', '/candidates/applications/bulk-status', { token: tokens.HIRING_MANAGER, body: { applicationIds: ['x'], status: 'HIRED' } })).status, 403);
  assert.equal((await call('POST', '/candidates/applications/claim', { token: tokens.HIRING_MANAGER, body: { applicationIds: ['x'] } })).status, 403);
  assert.equal((await call('GET', '/users', { token: tokens.SUPERADMIN })).status, 200);
  assert.equal((await call('GET', '/jobs/hiring-managers', { token: tokens.RECRUITER })).status, 403);
  assert.equal((await call('GET', '/jobs/manage')).status, 401);
  assert.equal((await call('GET', '/jobs/manage', { token: tokens.RECRUITER })).status, 403);
  assert.equal((await call('GET', '/jobs/manage', { token: tokens.SUPERADMIN })).status, 200);
  assert.equal((await call('GET', '/jobs/hiring-managers', { token: tokens.SUPERADMIN })).status, 200);
  // Reports contain candidate contacts
  assert.equal((await fetch(BASE + '/reports/recruitment.xlsx', { headers: { Authorization: `Bearer ${tokens.RECRUITER}` } })).status, 403);
  assert.equal((await fetch(BASE + '/reports/recruitment.xlsx', { headers: { Authorization: `Bearer ${tokens.HIRING_MANAGER}` } })).status, 403);
  assert.equal((await fetch(BASE + '/reports/recruitment.xlsx')).status, 401);
});

test('Super Admin cannot demote themselves', async () => {
  const me = await call('GET', '/auth/me', { token: tokens.SUPERADMIN });
  const r = await call('PATCH', `/users/${me.body.user.id}`, { token: tokens.SUPERADMIN, body: { role: 'RECRUITER' } });
  assert.equal(r.status, 400);
});

test('public job endpoints never expose applicants', async () => {
  const list = await call('GET', '/jobs');
  assert.equal(list.status, 200);
  const job = list.body.data.find((j) => j._count.applications > 0) || list.body.data[0];
  const detail = await call('GET', `/jobs/${job.id}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.applications, undefined);
  assert.equal((await call('GET', `/jobs/${job.id}/manage`)).status, 401);
});

test('public status lookup returns minimal fields only', async () => {
  const r = await call('GET', '/candidates/status?email=nobody-at-all@example.com');
  assert.equal(r.status, 200);
  assert.equal(r.body.data, null);
  assert.equal((await call('GET', '/candidates/status')).status, 400);
});

test('validation rejects bad input before writing', async () => {
  assert.equal((await call('POST', '/candidates/apply', { body: { email: 'x@y.z' } })).status, 400);
  assert.equal((await call('POST', '/candidates/apply', { body: { fullName: 'X', email: 'x@y.z', jobId: 'does-not-exist' } })).status, 404);
  assert.equal((await call('PATCH', '/candidates/applications/bulk-status', { token: tokens.RECRUITER, body: { applicationIds: [], status: 'HIRED' } })).status, 400);
  assert.equal((await call('PATCH', '/candidates/applications/bulk-status', { token: tokens.RECRUITER, body: { applicationIds: ['x'], status: 'BOGUS' } })).status, 400);
  assert.equal((await call('PUT', '/jobs/does-not-exist', { token: tokens.SUPERADMIN, body: { title: 'x' } })).status, 404);
  // Only an active HIRING_MANAGER can own a job (validated before the job lookup writes anything)
  const jobs = (await call('GET', '/jobs')).body.data;
  const me = await call('GET', '/auth/me', { token: tokens.SUPERADMIN });
  assert.equal((await call('PUT', `/jobs/${jobs[0].id}`, { token: tokens.SUPERADMIN, body: { hiringManagerId: me.body.user.id } })).status, 400);
});

test('templates: bulk upload needs login', async () => {
  const form = new FormData();
  form.append('template', new Blob(['x']), 't.xlsx');
  const r = await fetch(BASE + '/templates/upload', { method: 'POST', body: form });
  assert.equal(r.status, 401);
});

test('reminders and dashboard respond for every role', async () => {
  for (const role of Object.keys(ACCOUNTS)) {
    const rem = await call('GET', '/reminders', { token: tokens[role] });
    assert.equal(rem.status, 200, role);
    assert.ok(Array.isArray(rem.body.data.items));
    assert.equal((await call('GET', '/stats/dashboard', { token: tokens[role] })).status, 200, role);
  }
});
