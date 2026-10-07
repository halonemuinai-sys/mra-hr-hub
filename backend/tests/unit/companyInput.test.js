const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeCompanyInput } = require('../../services/companyInput');
const { sanitizeJobInput } = require('../../controllers/jobController');

test('company input is normalised', () => {
  const { data, errors } = sanitizeCompanyInput({ name: '  PT  Mugi   Rekso Abadi ', code: 'mra', npwp: '01.234.567.8-901.000', talentaBranch: ' Pusat ', isActive: 1 });
  assert.deepEqual(errors, []);
  assert.equal(data.name, 'PT Mugi Rekso Abadi');
  assert.equal(data.code, 'MRA');
  assert.equal(data.npwp, '012345678901000');
  assert.equal(data.talentaBranch, 'Pusat');
  assert.equal(data.address, null);
  assert.equal(data.isActive, true);
});

test('company input rejects missing name, bad code and bad NPWP', () => {
  const { errors } = sanitizeCompanyInput({ name: '', code: 'm r a!', npwp: '123' });
  assert.equal(errors.length, 3);
});

test('partial update only touches sent fields', () => {
  assert.deepEqual(sanitizeCompanyInput({ isActive: false }, { partial: true }), { data: { isActive: false }, errors: [] });
});

test('jobs accept companyId (and can clear it)', () => {
  assert.equal(sanitizeJobInput({ title: 'Dev', department: 'IT', companyId: 'abc' }, { partial: false }).data.companyId, 'abc');
  assert.equal(sanitizeJobInput({ companyId: '' }, { partial: true }).data.companyId, null);
});

test('creating a job requires an active PT once companies exist', async (t) => {
  const prisma = require('../../api/db');
  const { createJob } = require('../../controllers/jobController');
  const stub = (model, method, fn) => {
    const original = prisma[model][method];
    prisma[model][method] = fn;
    t.after(() => { prisma[model][method] = original; });
  };
  const response = () => ({ code: 200, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } });
  stub('company', 'count', async () => 2);
  stub('company', 'findUnique', async ({ where }) => (where.id === 'pt-active' ? { isActive: true } : where.id === 'pt-old' ? { isActive: false } : null));
  stub('jobPosting', 'create', async ({ data }) => data);

  const missing = response();
  await createJob({ body: { title: 'Dev', department: 'IT' } }, missing);
  assert.equal(missing.code, 400);
  assert.match(missing.body.message, /company/i);

  const inactive = response();
  await createJob({ body: { title: 'Dev', department: 'IT', companyId: 'pt-old' } }, inactive);
  assert.equal(inactive.code, 400);

  const ok = response();
  await createJob({ body: { title: 'Dev', department: 'IT', companyId: 'pt-active' } }, ok);
  assert.equal(ok.code, 201);
  assert.equal(ok.body.data.companyId, 'pt-active');
});
