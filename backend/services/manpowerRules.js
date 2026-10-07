/**
 * Manpower request rules — validation, who may do what, numbering and the job prefill.
 * Pure (no DB) so it can be unit-tested; controllers/manpowerController.js applies it.
 */
const { hasPermission } = require('../config/permissions');

const REASONS = ['REPLACEMENT', 'ADDITIONAL', 'NEW_POSITION'];
const PRIORITIES = ['NORMAL', 'URGENT'];
const EMPLOYMENT_TYPES = ['Full-time', 'Contract', 'Internship', 'Part-time'];
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const MAX_HEADCOUNT = 50;

const clean = (v) => (typeof v === 'string' ? v.trim().replace(/[ \t]+/g, ' ') : v == null ? '' : String(v).trim());
// Whole Rupiah: dots / commas are thousand separators ("8.000.000" → 8000000)
const money = (v) => (v === '' || v == null ? null : typeof v === 'number' ? v : Number(String(v).replace(/[^\d-]/g, '') || NaN));

function parseDay(v) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * @param {object} body
 * @param {{ partial?: boolean }} [opts]
 * @returns {{ data: object, errors: string[] }}
 */
function sanitizeManpowerInput(body = {}, { partial = false } = {}) {
  const data = {};
  const errors = [];
  const sent = (k) => Object.prototype.hasOwnProperty.call(body, k);
  const want = (k) => !partial || sent(k);

  [
    ['positionTitle', 'Position', 120],
    ['department', 'Department', 120],
    ['division', 'Division / business unit', 120],
    ['location', 'Location', 120]
  ].forEach(([key, label, max]) => {
    if (!want(key)) return;
    const v = clean(body[key]);
    if (!v) errors.push(`${label} is required.`);
    else if (v.length > max) errors.push(`${label} must be at most ${max} characters.`);
    else data[key] = v;
  });

  if (want('companyId')) {
    const v = clean(body.companyId);
    if (!v) errors.push('Choose the company (PT) that will employ the new hire.');
    else data.companyId = v;
  }
  if (want('employmentType')) {
    const v = clean(body.employmentType) || 'Full-time';
    if (!EMPLOYMENT_TYPES.includes(v)) errors.push('Unknown employment type.');
    else data.employmentType = v;
  }
  if (want('headcount')) {
    const n = parseInt(body.headcount, 10);
    if (!Number.isInteger(n) || n < 1 || n > MAX_HEADCOUNT) errors.push(`Headcount must be between 1 and ${MAX_HEADCOUNT}.`);
    else data.headcount = n;
  }
  if (want('reason')) {
    const v = clean(body.reason).toUpperCase();
    if (!REASONS.includes(v)) errors.push('Choose the reason for the request.');
    else data.reason = v;
  }
  if (want('replacementFor')) {
    const v = clean(body.replacementFor);
    data.replacementFor = v ? v.slice(0, 120) : null;
  }
  // Edits are validated on the merged record (controller), so this full check also covers PATCH
  if (data.reason === 'REPLACEMENT' && !data.replacementFor && !partial) errors.push('Name the employee being replaced.');
  if (data.reason && data.reason !== 'REPLACEMENT') data.replacementFor = null;
  if (want('justification')) {
    const v = clean(body.justification);
    if (v.length < 10) errors.push('Explain why this hire is needed (at least 10 characters).');
    else data.justification = v.slice(0, 3000);
  }
  if (want('priority')) {
    const v = clean(body.priority).toUpperCase() || 'NORMAL';
    if (!PRIORITIES.includes(v)) errors.push('Unknown priority.');
    else data.priority = v;
  }
  if (want('targetStartDate')) {
    const d = parseDay(body.targetStartDate);
    if (d === undefined) errors.push('Target start date is not valid.');
    else data.targetStartDate = d;
  }
  ['salaryMin', 'salaryMax'].forEach((k) => {
    if (!want(k)) return;
    const n = money(body[k]);
    if (n !== null && (!Number.isFinite(n) || n < 0)) errors.push('Salary must be a non-negative number.');
    else data[k] = n;
  });
  if (data.salaryMin != null && data.salaryMax != null && data.salaryMin > data.salaryMax) {
    errors.push('Minimum salary cannot exceed the maximum.');
  }
  if (want('minEducation')) data.minEducation = clean(body.minEducation).slice(0, 40) || null;
  if (want('minExperience')) {
    const v = body.minExperience === '' || body.minExperience == null ? null : parseInt(body.minExperience, 10);
    if (v !== null && (!Number.isInteger(v) || v < 0 || v > 40)) errors.push('Minimum experience must be 0–40 years.');
    else data.minExperience = v;
  }
  if (want('skills')) {
    const list = (Array.isArray(body.skills) ? body.skills : typeof body.skills === 'string' ? body.skills.split(',') : [])
      .map(clean)
      .filter(Boolean)
      .filter((s, i, arr) => arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i)
      .slice(0, 30);
    data.skills = list;
  }

  return { data, errors };
}

const isApprover = (user) => hasPermission(user, 'manpower.approve');

/** TA team and approvers see every request; Hiring Managers only their own */
const seesAll = (user) => isApprover(user) || hasPermission(user, 'jobs.manage') || hasPermission(user, 'pipeline.claim');

const canView = (user, req) => seesAll(user) || req.requestedById === user.id;

/** Approvers decide pending requests — not their own, except the Super Admin */
const canDecide = (user, req) =>
  isApprover(user) && req.status === 'PENDING' && (req.requestedById !== user.id || user.role === 'SUPERADMIN');

const canEdit = (user, req) => req.status === 'PENDING' && (req.requestedById === user.id || isApprover(user));

const canCancel = (user, req) =>
  (req.status === 'PENDING' || (req.status === 'APPROVED' && !req.jobId)) && (req.requestedById === user.id || isApprover(user));

const canConvert = (user, req) => hasPermission(user, 'jobs.manage') && req.status === 'APPROVED' && !req.jobId;

function actionsFor(user, req) {
  return { decide: canDecide(user, req), edit: canEdit(user, req), cancel: canCancel(user, req), openJob: canConvert(user, req) };
}

/** MPR-2026-0001, -0002, … per year */
function nextRequestNo(existingNos, year = new Date().getFullYear()) {
  const prefix = `MPR-${year}-`;
  const max = existingNos
    .filter((n) => n && n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter(Number.isFinite)
    .reduce((a, b) => Math.max(a, b), 0);
  return prefix + String(max + 1).padStart(4, '0');
}

/** Values for the job form when an approved request is opened as a job posting */
function jobPrefill(req) {
  const salary = (v) => (v == null ? '' : String(Number(v)));
  return {
    title: req.positionTitle,
    department: req.department,
    division: req.division,
    location: req.location,
    employmentType: req.employmentType,
    minExperience: req.minExperience ?? 2,
    minEducation: req.minEducation || 'S1',
    salaryMin: salary(req.salaryMin),
    salaryMax: salary(req.salaryMax),
    // Budgets are internal: keep them confidential on the portal unless TA decides otherwise
    salaryVisibility: req.salaryMin != null || req.salaryMax != null ? 'CONFIDENTIAL' : 'UNSPECIFIED',
    mustHaveSkills: req.skills || [],
    companyId: req.companyId || '',
    hiringManagerId: req.requestedBy && req.requestedBy.role === 'HIRING_MANAGER' ? req.requestedBy.id : '',
    description: '',
    requirements: req.justification || ''
  };
}

module.exports = {
  REASONS,
  PRIORITIES,
  EMPLOYMENT_TYPES,
  STATUSES,
  sanitizeManpowerInput,
  seesAll,
  canView,
  canDecide,
  canEdit,
  canCancel,
  canConvert,
  actionsFor,
  nextRequestNo,
  jobPrefill
};
