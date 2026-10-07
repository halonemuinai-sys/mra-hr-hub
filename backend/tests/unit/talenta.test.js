const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { signRequest } = require('../../services/talenta/talentaHmac');
const { buildEmployeePayload, defaultTalentaData, sanitizeTalentaData, maskPayload } = require('../../services/talenta/talentaEmployeePayload');
const { talentaConfig } = require('../../config/talenta');

test('HMAC header follows the Mekari scheme (date + request line)', () => {
  const date = 'Wed, 28 Oct 2020 06:23:23 GMT';
  const h = signRequest({ method: 'post', path: '/v2/talenta/v3/employee', username: 'user', secret: 'secret', date });
  const expected = crypto.createHmac('sha256', 'secret').update(`date: ${date}\nPOST /v2/talenta/v3/employee HTTP/1.1`).digest('base64');
  assert.equal(h.Date, date);
  assert.equal(h.Authorization, `hmac username="user", algorithm="hmac-sha256", headers="date request-line", signature="${expected}"`);
});

const employee = {
  fullName: 'Utami Dewi Permata',
  personalEmail: 'utami@mail.com',
  workEmail: 'utami.permata@mragroup.co.id',
  employeeNo: 'MRA-2026-0007',
  phone: '0812',
  joinDate: new Date('2026-11-02T00:00:00Z'),
  position: 'Retail Area Manager',
  department: 'Retail Operations',
  division: 'Retail',
  workLocation: 'Bali',
  employmentStatus: 'PROBATION'
};
const masters = {
  branches: [{ name: 'Bali' }],
  organizations: [{ name: 'Retail Operations' }],
  jobPositions: [{ name: 'Retail Area Manager' }],
  jobLevels: [{ name: 'Manager' }, { name: 'Staff' }]
};
const complete = {
  ...defaultTalentaData(employee, { offerSalary: 15000000, masters }),
  dateOfBirth: '1994-03-10',
  gender: '2',
  maritalStatus: '1',
  religion: '2',
  ptkpStatus: '1',
  overtimeStatus: '2',
  endEmploymentStatusDate: '2027-02-01',
  npwp: '12.345.678.9-012.345',
  bankName: '1',
  bankAccount: '1234567890'
};

test('defaults match master data and carry the offer salary', () => {
  const d = defaultTalentaData(employee, { offerSalary: 15000000, masters });
  assert.equal(d.branch, 'Bali');
  assert.equal(d.organizationName, 'Retail Operations');
  assert.equal(d.jobLevel, 'Manager');
  assert.equal(d.employmentStatus, '3');
  assert.equal(d.basicSalary, '15000000');
});

test('complete data builds a valid Talenta payload', () => {
  const { payload, errors } = buildEmployeePayload(employee, complete, masters);
  assert.deepEqual(errors, []);
  assert.equal(payload.first_name, 'Utami');
  assert.equal(payload.last_name, 'Dewi Permata');
  assert.equal(payload.email, 'utami.permata@mragroup.co.id');
  assert.equal(payload.employee_id, 'MRA-2026-0007');
  assert.equal(payload.join_date, '2026-11-02');
  assert.equal(payload.gender, 2);
  assert.equal(payload.employment_status, 3);
  assert.equal(payload.basic_salary, 15000000);
  assert.equal(payload.npwp, '123456789012345');
  assert.equal(payload.bank_name, '1');
  assert.equal(maskPayload(payload).bank_account, '••••••7890');
});

test('missing required fields, wrong options and unknown master names are reported', () => {
  const { errors } = buildEmployeePayload(employee, { ...complete, dateOfBirth: '', gender: '9', branch: 'Medan', endEmploymentStatusDate: '' }, masters);
  assert.ok(errors.some((e) => e.includes('Tanggal lahir')));
  assert.ok(errors.some((e) => e.includes('Jenis kelamin')));
  assert.ok(errors.some((e) => e.includes('Medan')));
  assert.ok(errors.some((e) => e.includes('Akhir kontrak')), 'probation needs an end date');
});

test('permanent staff need no end date; auto employee id omits employee_id', () => {
  const { payload, errors } = buildEmployeePayload(employee, { ...complete, employmentStatus: '1', endEmploymentStatusDate: '', autoEmployeeId: true }, masters);
  assert.deepEqual(errors, []);
  assert.equal(payload.employee_id, undefined);
});

test('sanitize keeps known keys only', () => {
  assert.deepEqual(sanitizeTalentaData({ gender: ' 1 ', hack: 'x', autoEmployeeId: 'yes' }), { gender: '1', autoEmployeeId: true });
});

test('config: mock by default in development, credentials required for sandbox', () => {
  assert.equal(talentaConfig({}).mode, 'mock');
  assert.equal(talentaConfig({ NODE_ENV: 'production' }).mode, 'off');
  const sb = talentaConfig({ TALENTA_MODE: 'sandbox' });
  assert.equal(sb.ready, false);
  assert.deepEqual(sb.missing, ['TALENTA_HMAC_USERNAME', 'TALENTA_HMAC_SECRET']);
  assert.equal(talentaConfig({ TALENTA_MODE: 'sandbox', TALENTA_HMAC_USERNAME: 'u', TALENTA_HMAC_SECRET: 's' }).baseUrl, 'https://sandbox-api.mekari.com');
});

test('simulator: accepts a valid payload once, then rejects duplicates in Talenta error format', async () => {
  const { talentaRequest, TalentaError } = require('../../services/talenta/talentaClient');
  const mock = require('../../services/talenta/talentaMock');
  mock.setKnownPositions(['Retail Area Manager']);
  const cfg = talentaConfig({ TALENTA_MODE: 'mock' });
  const m = mock.masterData();
  const { payload, errors } = buildEmployeePayload(
    { ...employee, workEmail: 'dup.test@mragroup.co.id', employeeNo: 'MRA-TEST-0001' },
    { ...complete, branch: 'Bali', organizationName: 'Retail Operations', jobLevel: 'Manager' },
    m
  );
  assert.deepEqual(errors, []);
  const ok = await talentaRequest('POST', '/v2/talenta/v3/employee', payload, cfg);
  assert.ok(ok.data.user_id > 0);
  await assert.rejects(talentaRequest('POST', '/v2/talenta/v3/employee', payload, cfg), (err) => {
    assert.ok(err instanceof TalentaError);
    assert.ok(err.errors.some((e) => e.includes('has already been taken')));
    return true;
  });
  await assert.rejects(talentaRequest('GET', '/v2/talenta/v2/employee/1', undefined, talentaConfig({ TALENTA_MODE: 'off' })), /nonaktif|belum diaktifkan/);
});
