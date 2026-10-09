/**
 * Forgot-password tokens — stateless and single-use (no table needed):
 * a JWT with its own audience that carries a fingerprint of the user's current password hash.
 * Once the password changes, the fingerprint no longer matches, so a link works only once.
 * Pure helpers + a tiny in-memory rate limiter, unit-tested.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const AUDIENCE = 'hrhub-password-reset';
const TTL_MINUTES = 30;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

const fingerprint = (passwordHash) => crypto.createHash('sha256').update(String(passwordHash || '')).digest('hex').slice(0, 16);

function createResetToken(user, secret) {
  return jwt.sign({ sub: user.id, ph: fingerprint(user.password) }, secret, { audience: AUDIENCE, expiresIn: `${TTL_MINUTES}m` });
}

/**
 * @returns {{ ok: true, userId: string } | { ok: false, reason: string }}
 * The caller then loads the user and checks it with matchesUser().
 */
function readResetToken(token, secret) {
  try {
    const p = jwt.verify(String(token || ''), secret, { audience: AUDIENCE });
    return { ok: true, userId: p.sub, ph: p.ph };
  } catch (err) {
    return { ok: false, reason: err.name === 'TokenExpiredError' ? 'This reset link has expired. Request a new one.' : 'This reset link is not valid.' };
  }
}

/** Token still belongs to this active user and the password was not changed since it was issued */
function matchesUser(read, user) {
  if (!read.ok) return read;
  if (!user || !user.isActive) return { ok: false, reason: 'This reset link is not valid.' };
  if (read.ph !== fingerprint(user.password)) return { ok: false, reason: 'This reset link was already used. Request a new one if needed.' };
  return { ok: true };
}

function validateNewPassword(password, email = '') {
  const pw = String(password || '');
  if (pw.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  if (pw.length > MAX_PASSWORD) return `Password must be at most ${MAX_PASSWORD} characters.`;
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use at least one letter and one number.';
  if (email && pw.toLowerCase() === String(email).toLowerCase()) return 'The password cannot be your e-mail address.';
  return null;
}

/** Sliding-window limiter: allow(key) → true while fewer than `limit` hits in `windowMs` */
function createLimiter(limit, windowMs) {
  const hits = new Map();
  return function allow(key, now = Date.now()) {
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.delete(hits.keys().next().value);
    return true;
  };
}

/** "b***@mragroup.co.id" */
const maskEmail = (email) => String(email || '').replace(/^(.)([^@]*)(@.*)$/, (m, a, b, c) => `${a}${'*'.repeat(Math.min(Math.max(b.length, 1), 5))}${c}`);

module.exports = { TTL_MINUTES, MIN_PASSWORD, fingerprint, createResetToken, readResetToken, matchesUser, validateNewPassword, createLimiter, maskEmail };
