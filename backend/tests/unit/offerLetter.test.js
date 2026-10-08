const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeOffer, nextLetterNo, canManageOffer, displayStatus, actionsFor, prefillOffer } = require('../../services/offerLetter/offerRules');
const { buildOfferDocument, idr } = require('../../services/offerLetter/offerDocument');

const valid = {
  candidateName: 'Rina Wulandari',
  positionTitle: 'Store Supervisor',
  workLocation: 'Plaza Senayan',
  employmentType: 'Full-time',
  startDate: '2026-11-02',
  validUntil: '2026-10-15',
  baseSalary: '8.500.000',
  allowances: [{ label: 'Tunjangan transport', amount: '750.000' }, { label: '', amount: '' }],
  probationMonths: 3,
  signatoryName: 'Siti Rahma',
  signatoryTitle: 'Human Resources'
};

test('valid offer: money with thousand dots, empty allowance rows dropped', () => {
  const { data, errors } = sanitizeOffer(valid);
  assert.deepEqual(errors, []);
  assert.equal(data.baseSalary, 8500000);
  assert.deepEqual(data.allowances, [{ label: 'Tunjangan transport', amount: 750000 }]);
  assert.equal(data.startDate.toISOString().slice(0, 10), '2026-11-02');
  assert.equal(data.language, 'id');
});

test('offer validation: required fields, expiry after start, contract length, probation limit', () => {
  assert.ok(sanitizeOffer({}).errors.length >= 6);
  assert.ok(sanitizeOffer({ ...valid, validUntil: '2026-11-03' }).errors.some((e) => e.includes('expire')));
  assert.ok(sanitizeOffer({ ...valid, employmentType: 'Contract', contractMonths: '' }).errors.some((e) => e.includes('contract length')));
  assert.ok(sanitizeOffer({ ...valid, probationMonths: 9 }).errors.some((e) => e.includes('Probation')));
  assert.ok(sanitizeOffer({ ...valid, baseSalary: '0' }).errors.some((e) => e.includes('salary')));
  assert.ok(sanitizeOffer({ ...valid, allowances: [{ label: 'Makan' }] }).errors.some((e) => e.includes('Makan')));
});

test('letter numbers run per company per year with a Roman month', () => {
  const oct = new Date(2026, 9, 8);
  assert.equal(nextLetterNo([], 'mra', oct), '001/OL-MRA/HR/X/2026');
  const used = ['001/OL-MRA/HR/I/2026', '007/OL-MRA/HR/IX/2026', '012/OL-MPI/HR/X/2026', '020/OL-MRA/HR/XII/2025'];
  assert.equal(nextLetterNo(used, 'MRA', oct), '008/OL-MRA/HR/X/2026');
  assert.equal(nextLetterNo(used, 'MPI', oct), '013/OL-MPI/HR/X/2026');
});

test('only the PIC or a TA Lead manage a letter; actions follow the status', () => {
  const lead = { id: 'lead', role: 'HR_ADMIN' };
  const pic = { id: 'ta1', role: 'RECRUITER' };
  const other = { id: 'ta2', role: 'RECRUITER' };
  const hm = { id: 'hm', role: 'HIRING_MANAGER' };
  const app = { assignedRecruiterId: 'ta1' };
  assert.ok(canManageOffer(lead, app));
  assert.ok(canManageOffer(pic, app));
  assert.ok(!canManageOffer(other, app));
  assert.ok(!canManageOffer(hm, app));
  assert.ok(!canManageOffer(pic, { assignedRecruiterId: null }));

  const future = new Date(Date.now() + 5 * 864e5);
  assert.deepEqual(actionsFor(pic, { status: 'DRAFT', validUntil: future }, app), { edit: true, send: true, respond: false, cancel: true });
  assert.deepEqual(actionsFor(pic, { status: 'SENT', validUntil: future }, app), { edit: false, send: false, respond: true, cancel: true });
  assert.deepEqual(actionsFor(pic, { status: 'ACCEPTED', validUntil: future }, app), { edit: false, send: false, respond: false, cancel: false });
  assert.deepEqual(actionsFor(hm, { status: 'DRAFT', validUntil: future }, app), { edit: false, send: false, respond: false, cancel: false });
});

test('a sent letter past its validity shows as expired (the valid-until day still counts)', () => {
  const now = new Date(2026, 9, 8, 15);
  assert.equal(displayStatus({ status: 'SENT', validUntil: new Date('2026-10-07T00:00:00Z') }, now), 'EXPIRED');
  assert.equal(displayStatus({ status: 'SENT', validUntil: new Date('2026-10-08T00:00:00Z') }, now), 'SENT');
  assert.equal(displayStatus({ status: 'DRAFT', validUntil: new Date('2026-01-01T00:00:00Z') }, now), 'DRAFT');
});

test('prefill takes salary and start date from the Offering stage data', () => {
  const app = {
    candidate: { fullName: 'Rina Wulandari', email: 'rina@example.com', location: 'Jakarta Selatan' },
    job: { title: 'Store Supervisor', location: 'Plaza Senayan', employmentType: 'Full-time', hiringManager: { name: 'Hendrawan (Retail Division Manager)' } }
  };
  const now = new Date(2026, 9, 8);
  const p = prefillOffer(app, { offerSalary: 9000000, startDate: '2026-10-12' }, { name: 'Siti Rahma (Senior Talent Acquisition)' }, now);
  assert.equal(p.baseSalary, '9000000');
  assert.equal(p.startDate, '2026-10-12');
  assert.equal(p.validUntil, '2026-10-12', 'never valid beyond the start date');
  assert.equal(p.probationMonths, 3);
  assert.equal(p.reportingTo, 'Hendrawan');
  assert.equal(p.signatoryName, 'Siti Rahma');
  assert.equal(sanitizeOffer(p).errors.length, 0, 'prefill is a valid letter');

  const later = prefillOffer({ ...app, job: { ...app.job, employmentType: 'Contract' } }, {}, {}, now, 'en');
  assert.equal(later.startDate, '2026-11-07');
  assert.equal(later.validUntil, '2026-10-15');
  assert.equal(later.contractMonths, 12);
  assert.match(later.benefits, /annual leave/);
});

test('document model: PT on letterhead and in the text, totals with allowances, both languages', () => {
  const { data } = sanitizeOffer(valid);
  const company = { name: 'PT Mugi Rekso Abadi', address: 'Jl. Contoh 1', npwp: '01.234' };
  const doc = buildOfferDocument({ ...data, letterNo: '001/OL-MRA/HR/X/2026' }, company, new Date('2026-10-08'));
  assert.equal(doc.letterhead.name, 'PT Mugi Rekso Abadi');
  assert.match(doc.intro, /PT Mugi Rekso Abadi/);
  assert.equal(doc.title, 'SURAT PENAWARAN KERJA');
  assert.equal(doc.pay[0].value, idr(8500000));
  assert.equal(doc.total.value, idr(9250000));
  assert.ok(doc.terms.find((t) => t.label === 'Status kepegawaian').value.includes('masa percobaan 3 bulan'));
  assert.ok(doc.paragraphs.some((p) => p.includes('15 Oktober 2026')));

  const en = buildOfferDocument({ ...data, language: 'en', allowances: [] }, null);
  assert.equal(en.title, 'OFFER OF EMPLOYMENT');
  assert.equal(en.total, null);
  assert.equal(en.reference.value, '(draft)');
  assert.equal(en.letterhead.name, 'MRA Group');
});
