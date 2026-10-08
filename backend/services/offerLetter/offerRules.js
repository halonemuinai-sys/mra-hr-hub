/**
 * Offer letter rules — validation, numbering, who may write, display status, prefill. Pure (no DB), unit-tested.
 */
const { hasPermission } = require('../../config/permissions');

const STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'CANCELLED'];
const EMPLOYMENT_TYPES = ['Full-time', 'Contract', 'Internship', 'Part-time'];
const LANGUAGES = ['id', 'en'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const DEFAULT_BENEFITS = {
  id: ['BPJS Ketenagakerjaan dan BPJS Kesehatan sesuai ketentuan yang berlaku', 'Tunjangan Hari Raya (THR) sesuai peraturan perundang-undangan', 'Cuti tahunan 12 hari kerja setelah masa kerja 12 bulan'],
  en: ['BPJS Ketenagakerjaan and BPJS Kesehatan as required by law', 'Religious holiday allowance (THR) as required by law', '12 working days of annual leave after 12 months of service']
};

const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().replace(/[ \t]+/g, ' ').slice(0, max) : v == null ? '' : String(v).trim().slice(0, max));
// Whole Rupiah: dots / commas are thousand separators
const money = (v) => (v === '' || v == null ? null : typeof v === 'number' ? v : Number(String(v).replace(/[^\d-]/g, '') || NaN));

function parseDay(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

/**
 * Validates the editable terms of a letter.
 * @returns {{ data: object, errors: string[] }}
 */
function sanitizeOffer(body = {}) {
  const errors = [];
  const data = {
    language: LANGUAGES.includes(body.language) ? body.language : 'id',
    candidateName: clean(body.candidateName, 120),
    candidateEmail: clean(body.candidateEmail, 120) || null,
    candidatePhone: clean(body.candidatePhone, 30) || null,
    candidateAddress: clean(body.candidateAddress, 300) || null,
    positionTitle: clean(body.positionTitle, 120),
    department: clean(body.department, 120) || null,
    workLocation: clean(body.workLocation, 120),
    employmentType: EMPLOYMENT_TYPES.includes(body.employmentType) ? body.employmentType : null,
    workingHours: clean(body.workingHours, 120) || null,
    reportingTo: clean(body.reportingTo, 120) || null,
    signatoryName: clean(body.signatoryName, 120),
    signatoryTitle: clean(body.signatoryTitle, 120),
    benefits: clean(body.benefits, 3000) || null,
    additionalTerms: clean(body.additionalTerms, 3000) || null
  };
  if (!data.candidateName) errors.push('Candidate name is required.');
  if (!data.positionTitle) errors.push('Position is required.');
  if (!data.workLocation) errors.push('Work location is required.');
  if (!data.employmentType) errors.push('Choose the employment type.');
  if (!data.signatoryName || !data.signatoryTitle) errors.push('Signatory name and title are required.');

  const salary = money(body.baseSalary);
  if (salary === null || !Number.isFinite(salary) || salary <= 0) errors.push('Base salary must be a positive amount.');
  else data.baseSalary = salary;

  const allowances = (Array.isArray(body.allowances) ? body.allowances : [])
    .map((a) => ({ label: clean(a && a.label, 80), amount: money(a && a.amount) }))
    .filter((a) => a.label || a.amount);
  allowances.forEach((a) => {
    if (!a.label) errors.push('Every allowance needs a name.');
    if (!Number.isFinite(a.amount) || a.amount < 0) errors.push(`Allowance "${a.label || '?'}" needs a valid amount.`);
  });
  data.allowances = allowances.slice(0, 10);

  const start = parseDay(body.startDate);
  const until = parseDay(body.validUntil);
  if (!start) errors.push('Start date is required.');
  else data.startDate = start;
  if (!until) errors.push('Valid-until date is required.');
  else data.validUntil = until;
  if (start && until && until > start) errors.push('The offer must expire on or before the start date.');

  const int = (v, max) => (v === '' || v == null ? null : Number.isInteger(+v) && +v >= 0 && +v <= max ? +v : NaN);
  data.probationMonths = int(body.probationMonths, 6);
  data.contractMonths = int(body.contractMonths, 60);
  if (Number.isNaN(data.probationMonths)) errors.push('Probation must be 0–6 months (PP 35/2021: max 3 for permanent staff).');
  if (Number.isNaN(data.contractMonths)) errors.push('Contract length must be 0–60 months.');
  if (data.employmentType === 'Contract' && !data.contractMonths) errors.push('Give the contract length in months.');

  return { data, errors };
}

/** "001/OL-MRA/HR/X/2026" — sequence per company per year */
function nextLetterNo(existingNos, companyCode, date = new Date()) {
  const year = date.getFullYear();
  const code = (companyCode || 'MRA').toUpperCase();
  const suffix = `/OL-${code}/HR/`;
  const max = existingNos
    .filter((n) => n && n.includes(suffix) && n.endsWith(`/${year}`))
    .map((n) => parseInt(n.split('/')[0], 10))
    .filter(Number.isFinite)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${String(max + 1).padStart(3, '0')}${suffix}${ROMAN[date.getMonth()]}/${year}`;
}

/** PIC of the candidate or a TA Lead / Super Admin */
const canManageOffer = (user, app) => hasPermission(user, 'pipeline.move.any') || (!!app.assignedRecruiterId && app.assignedRecruiterId === user.id);

/** Sent letters past their validity without an answer show as EXPIRED */
function displayStatus(letter, now = new Date()) {
  if (letter.status !== 'SENT') return letter.status;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(letter.validUntil).getTime() < today ? 'EXPIRED' : 'SENT';
}

function actionsFor(user, letter, app) {
  const manage = canManageOffer(user, app);
  const st = displayStatus(letter);
  return {
    edit: manage && letter.status === 'DRAFT',
    send: manage && letter.status === 'DRAFT',
    respond: manage && (st === 'SENT' || st === 'EXPIRED'),
    cancel: manage && ['DRAFT', 'SENT'].includes(letter.status)
  };
}

const plusDays = (d, n) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + n));
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const shortName = (n) => String(n || '').replace(/\s*\(.*\)\s*$/, '');

/**
 * Starting values for a new letter.
 * @param {object} app    application with candidate, job (+ hiringManager, company)
 * @param {object} offer  stage-gate data of the move to Offering (offerSalary, startDate)
 * @param {object} user   author (becomes the default signatory)
 */
function prefillOffer(app, offer = {}, user = {}, now = new Date(), language = 'id') {
  const job = app.job || {};
  const type = EMPLOYMENT_TYPES.includes(job.employmentType) ? job.employmentType : 'Full-time';
  const start = parseDay(offer.startDate) || plusDays(now, 30);
  const valid = plusDays(now, 7);
  return {
    language,
    candidateName: (app.candidate && app.candidate.fullName) || '',
    candidateEmail: (app.candidate && app.candidate.email) || '',
    candidatePhone: (app.candidate && app.candidate.phone) || '',
    candidateAddress: (app.candidate && app.candidate.location) || '',
    positionTitle: job.title || '',
    department: job.department || '',
    workLocation: job.location || '',
    employmentType: type,
    startDate: day(start),
    validUntil: day(valid < start ? valid : start),
    baseSalary: offer.offerSalary ? String(Number(offer.offerSalary)) : '',
    allowances: [],
    benefits: DEFAULT_BENEFITS[language].join('\n'),
    probationMonths: type === 'Full-time' ? 3 : null,
    contractMonths: type === 'Contract' ? 12 : null,
    workingHours: language === 'id' ? 'Senin–Jumat, 09.00–18.00 WIB' : 'Monday–Friday, 09:00–18:00 WIB',
    reportingTo: (job.hiringManager && shortName(job.hiringManager.name)) || '',
    signatoryName: shortName(user.name),
    signatoryTitle: language === 'id' ? 'Human Resources' : 'Human Resources',
    additionalTerms: ''
  };
}

module.exports = {
  STATUSES,
  EMPLOYMENT_TYPES,
  LANGUAGES,
  DEFAULT_BENEFITS,
  sanitizeOffer,
  nextLetterNo,
  canManageOffer,
  displayStatus,
  actionsFor,
  prefillOffer
};
