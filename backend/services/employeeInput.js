/**
 * Validates the "register as employee" form (pure — no DB access, unit-tested).
 */

const EMPLOYMENT_STATUSES = ['PROBATION', 'CONTRACT', 'PERMANENT', 'INTERNSHIP'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// key → [label, required, maxLength]
const TEXT_FIELDS = {
  employeeNo: ['Employee ID', true, 40],
  fullName: ['Full name', true, 120],
  personalEmail: ['Personal email', true, 120],
  workEmail: ['Work email', false, 120],
  phone: ['Mobile number', false, 30],
  position: ['Position', true, 120],
  department: ['Department', true, 120],
  division: ['Division / business unit', true, 120],
  workLocation: ['Work location', true, 120],
  managerName: ['Direct manager', false, 120],
  notes: ['Notes', false, 2000]
};

const clean = (v) => (typeof v === 'string' ? v.trim() : v === null || v === undefined ? '' : String(v).trim());

/** YYYY-MM-DD (or any parseable date) → Date at UTC midnight, or null */
function parseDay(v) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {object} body
 * @param {{ partial?: boolean }} [opts] partial = PATCH (only validate fields that were sent)
 * @returns {{ data: object, errors: string[] }}
 */
function sanitizeEmployeeInput(body = {}, { partial = false } = {}) {
  const data = {};
  const errors = [];
  const sent = (k) => Object.prototype.hasOwnProperty.call(body, k);

  Object.entries(TEXT_FIELDS).forEach(([key, [label, required, max]]) => {
    if (partial && !sent(key)) return;
    const v = clean(body[key]);
    if (!v) {
      if (required) errors.push(`${label} is required.`);
      else data[key] = null;
      return;
    }
    if (v.length > max) errors.push(`${label} must be at most ${max} characters.`);
    data[key] = v;
  });

  if (data.employeeNo) data.employeeNo = data.employeeNo.toUpperCase();
  ['personalEmail', 'workEmail'].forEach((key) => {
    if (data[key]) {
      data[key] = data[key].toLowerCase();
      if (!EMAIL_RE.test(data[key])) errors.push(`${TEXT_FIELDS[key][0]} is not valid.`);
    }
  });

  if (!partial || sent('employmentStatus')) {
    const st = clean(body.employmentStatus).toUpperCase() || 'PROBATION';
    if (!EMPLOYMENT_STATUSES.includes(st)) errors.push('Unknown employment status.');
    else data.employmentStatus = st;
  }

  if (!partial || sent('joinDate')) {
    const d = parseDay(body.joinDate);
    if (!d) errors.push('Join date is required and must be a valid date.');
    else data.joinDate = d;
  }

  return { data, errors };
}

/** Next suggested NIK: MRA-<year>-0001, -0002, ... based on the numbers already used that year */
function suggestEmployeeNo(existingNos, year = new Date().getFullYear()) {
  const prefix = `MRA-${year}-`;
  const max = existingNos
    .filter((n) => n && n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return prefix + String(max + 1).padStart(4, '0');
}

module.exports = { EMPLOYMENT_STATUSES, sanitizeEmployeeInput, suggestEmployeeNo, parseDay };
