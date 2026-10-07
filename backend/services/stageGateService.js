/**
 * Evaluates a stage move against config/stageRules.js.
 * Pure logic — no DB writes. Used by preview (form rendering) and execution.
 */
const { FUNNEL, STAGE_RULES, directionChecks } = require('../config/stageRules');
const { hasPermission } = require('../config/permissions');

const VALID_STATUSES = [...FUNNEL, 'REJECTED', 'TALENT_POOL'];

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Type-level validation of a single field value; returns an error message or null */
function validateField(field, value) {
  if (isEmpty(value)) return field.required ? `${field.label} is required.` : null;
  switch (field.type) {
    case 'rating': {
      const n = Number(value);
      return Number.isInteger(n) && n >= 1 && n <= 5 ? null : `${field.label} must be 1–5.`;
    }
    case 'currency':
      return Number(value) > 0 ? null : `${field.label} must be a positive amount.`;
    case 'date':
    case 'datetime':
      return Number.isNaN(new Date(value).getTime()) ? `${field.label} is not a valid date.` : null;
    case 'select':
      return field.options.includes(value) ? null : `${field.label} must be one of: ${field.options.join(', ')}.`;
    case 'checkbox':
      return field.required && value !== true ? `${field.label} must be confirmed.` : null;
    default:
      return null;
  }
}

/**
 * @param {object} p
 * @param {object} p.app        JobApplication incl. `job` (salaryMax) — current state
 * @param {string} p.toStatus
 * @param {object} p.data       submitted form values
 * @param {object} p.user       acting user ({ role })
 * @returns {{ fromStatus, toStatus, direct, fields, warnings, blocks, approval, errors, values }}
 */
function evaluateTransition({ app, toStatus, data = {}, user }) {
  if (!VALID_STATUSES.includes(toStatus)) {
    return { fromStatus: app.status, toStatus, direct: false, fields: [], warnings: [], approval: null, errors: [], blocks: ['Invalid stage.'], values: {} };
  }

  const fromStatus = app.status;
  const rule = STAGE_RULES[toStatus] || { fields: [], checks: () => [] };
  const from = FUNNEL.indexOf(fromStatus);
  const to = FUNNEL.indexOf(toStatus);
  const backward = from >= 0 && to >= 0 && to < from;

  // Values: submitted data, falling back to what the application already holds
  const fields = [];
  const values = {};
  const addField = (f) => {
    if (fields.some((x) => x.key === f.key)) return;
    const prefill = f.fromApp ? app[f.fromApp] : undefined;
    values[f.key] = !isEmpty(data[f.key]) ? data[f.key] : prefill ?? null;
    fields.push({ ...f, value: values[f.key] });
  };

  if (!backward) rule.fields.forEach(addField);

  const ctx = { app, fromStatus, toStatus, data: { ...data, ...values }, user };
  const results = [
    // Registered as employee / released from the board: the hire is final
    ...(app.releasedAt ? [{ type: 'block', message: 'This hire has been released from the pipeline and can no longer change stage.' }] : []),
    ...directionChecks({ fromStatus, toStatus, canMoveAny: hasPermission(user, 'pipeline.move.any') }),
    ...(backward ? [] : rule.checks(ctx))
  ];

  const warnings = [];
  const blocks = [];
  let approval = null;
  results.forEach((r) => {
    if (r.type === 'block') blocks.push(r.message);
    if (r.type === 'warn') {
      warnings.push(r.message);
      if (r.requireField) addField(r.requireField);
    }
    if (r.type === 'approval') approval = { permission: r.permission, message: r.message };
  });

  if (fromStatus === toStatus) blocks.push('Candidate is already in this stage.');

  // Requester who already holds the approval permission doesn't need to ask anyone
  if (approval && hasPermission(user, approval.permission)) {
    warnings.push(`${approval.message} You hold this approval right — the move will be applied directly.`);
    approval = null;
  }

  const errors = fields.map((f) => validateField(f, values[f.key])).filter(Boolean);
  const needsInput = fields.some((f) => isEmpty(values[f.key])) || warnings.length > 0;

  return {
    fromStatus,
    toStatus,
    direct: !needsInput && !approval && blocks.length === 0,
    fields,
    warnings,
    blocks,
    approval,
    errors,
    values
  };
}

module.exports = { VALID_STATUSES, evaluateTransition, validateField };
