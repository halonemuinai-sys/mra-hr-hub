const { test } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../../api/db');
const { normalizeSalary, publicJob } = require('../../services/jobSalary');
const { sanitizeJobInput, listJobs, getJobById, createJob, updateJob } = require('../../controllers/jobController');
const { evaluateTransition } = require('../../services/stageGateService');

const confidential = { id: 'job-private', title: 'Developer', salaryVisibility: 'CONFIDENTIAL', salaryMin: 10000000, salaryMax: 20000000 };
function stubJobMethod(t, method, implementation) {
  const original = prisma.jobPosting[method];
  prisma.jobPosting[method] = implementation;
  t.after(() => { prisma.jobPosting[method] = original; });
}

const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('visibility is validated and unspecified removes both salary bounds', () => {
  for (const mode of ['hidden', '', null, true]) {
    assert.ok(sanitizeJobInput({ salaryVisibility: mode }, { partial: true }).error);
  }
  for (const current of [confidential, { ...confidential, salaryVisibility: 'PUBLIC' }]) {
    const data = { salaryVisibility: 'UNSPECIFIED', salaryMin: 100, salaryMax: 200 };
    assert.equal(normalizeSalary(data, current), null);
    assert.deepEqual(data, { salaryVisibility: 'UNSPECIFIED', salaryMin: null, salaryMax: null });
  }
  const partial = { salaryMax: 300 };
  normalizeSalary(partial, { salaryVisibility: 'UNSPECIFIED' });
  assert.equal(partial.salaryMax, null);
  assert.equal(partial.salaryMin, null);
});

test('public serialization hides private and unknown modes without mutating internal budgets', () => {
  for (const salaryVisibility of ['CONFIDENTIAL', 'UNSPECIFIED', undefined, 'invalid']) {
    const original = { ...confidential, salaryVisibility };
    const result = publicJob(original);
    assert.equal(result.salaryMin, null);
    assert.equal(result.salaryMax, null);
    assert.equal(original.salaryMax, 20000000);
  }
  const visible = { ...confidential, salaryVisibility: 'PUBLIC', salaryMin: 0 };
  assert.equal(publicJob(visible).salaryMin, 0);
  assert.equal(publicJob(visible).salaryMax, 20000000);
});

test('public list/detail redact salaries even with management query flags; CMS list retains them', async (t) => {
  stubJobMethod(t, 'findMany', async () => [confidential]);
  stubJobMethod(t, 'findFirst', async () => confidential);
  const publicList = response();
  await listJobs({ query: { activeOnly: 'false', jobsManagement: 'true' } }, publicList);
  assert.equal(publicList.body.data[0].salaryMax, null);
  const detail = response();
  await getJobById({ params: { id: confidential.id } }, detail);
  assert.equal(detail.body.data.salaryMin, null);
  const management = response();
  await listJobs({ query: { activeOnly: 'false' }, jobsManagement: true }, management);
  assert.equal(management.body.data[0].salaryMax, 20000000);
});

test('create without range saves null amounts; editing visibility preserves or clears the budget', async (t) => {
  let saved;
  stubJobMethod(t, 'create', async ({ data }) => { saved = data; return data; });
  stubJobMethod(t, 'findUnique', async () => confidential);
  stubJobMethod(t, 'update', async ({ data }) => { saved = data; return { ...confidential, ...data }; });
  // No active companies → the "choose a PT" rule does not apply (that rule has its own tests)
  const originalCount = prisma.company.count;
  prisma.company.count = async () => 0;
  t.after(() => { prisma.company.count = originalCount; });
  const created = response();
  await createJob({ body: { title: 'Developer', department: 'IT', salaryVisibility: 'UNSPECIFIED', salaryMin: 500, salaryMax: 100 } }, created);
  assert.equal(created.code, 201);
  assert.equal(saved.salaryMin, null);
  assert.equal(saved.salaryMax, null);

  const published = response();
  await updateJob({ params: { id: confidential.id }, body: { salaryVisibility: 'PUBLIC' } }, published);
  assert.equal(published.body.data.salaryMax, 20000000);
  assert.equal(saved.salaryMax, undefined);

  const cleared = response();
  await updateJob({ params: { id: confidential.id }, body: { salaryVisibility: 'UNSPECIFIED' } }, cleared);
  assert.equal(cleared.body.data.salaryMax, null);

  const invalid = response();
  await updateJob({ params: { id: confidential.id }, body: { salaryMin: 30000000 } }, invalid);
  assert.equal(invalid.code, 400);
});

test('confidential salary still enforces offer budget approval; unspecified has no budget cap', () => {
  const evaluate = (job) => evaluateTransition({
    app: { status: 'INTERVIEW_USER', atsScore: 80, scorecardRating: 4, job },
    toStatus: 'OFFERING', user: { role: 'RECRUITER' },
    data: { hmFeedback: 'Approved', offerSalary: 25000000, startDate: '2027-01-01' }
  });
  assert.equal(evaluate(confidential).direct, false);
  assert.equal(evaluate({ salaryVisibility: 'UNSPECIFIED', salaryMax: null }).direct, true);
});
