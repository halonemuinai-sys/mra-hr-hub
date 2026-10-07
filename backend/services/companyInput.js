/**
 * Validates the Company (PT) form. Pure — unit-tested.
 */

const clean = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : v == null ? '' : String(v).trim());

/**
 * @param {object} body
 * @param {{ partial?: boolean }} [opts]
 * @returns {{ data: object, errors: string[] }}
 */
function sanitizeCompanyInput(body = {}, { partial = false } = {}) {
  const data = {};
  const errors = [];
  const sent = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || sent('name')) {
    const name = clean(body.name);
    if (!name) errors.push('Company name is required.');
    else if (name.length > 150) errors.push('Company name is too long.');
    else data.name = name;
  }
  if (!partial || sent('code')) {
    const code = clean(body.code).toUpperCase();
    if (!code) errors.push('Short code is required.');
    else if (!/^[A-Z0-9][A-Z0-9-]{1,11}$/.test(code)) errors.push('Short code: 2–12 letters, digits or dashes.');
    else data.code = code;
  }
  if (!partial || sent('npwp')) {
    const npwp = clean(body.npwp).replace(/[\s.-]/g, '');
    if (npwp && !/^(\d{15}|\d{16})$/.test(npwp)) errors.push('Company NPWP must be 15 or 16 digits.');
    else data.npwp = npwp || null;
  }
  ['address', 'talentaBranch'].forEach((k) => {
    if (!partial || sent(k)) data[k] = clean(body[k]).slice(0, k === 'address' ? 500 : 120) || null;
  });
  if (sent('isActive')) data.isActive = !!body.isActive;

  return { data, errors };
}

module.exports = { sanitizeCompanyInput };
