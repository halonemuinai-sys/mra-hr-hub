const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createResetToken, readResetToken, matchesUser, validateNewPassword, createLimiter, maskEmail } = require('../../services/passwordReset');

const SECRET = 'x'.repeat(40);
const user = { id: 'u1', password: '$2a$10$hashOne', isActive: true };

test('reset token is valid once: changing the password invalidates it', () => {
  const token = createResetToken(user, SECRET);
  const read = readResetToken(token, SECRET);
  assert.equal(read.ok, true);
  assert.equal(read.userId, 'u1');
  assert.deepEqual(matchesUser(read, user), { ok: true });
  assert.match(matchesUser(read, { ...user, password: '$2a$10$hashTwo' }).reason, /already used/);
  assert.equal(matchesUser(read, { ...user, isActive: false }).ok, false);
  assert.equal(matchesUser(read, null).ok, false);
});

test('reset token: wrong secret, login tokens and expired tokens are refused', () => {
  assert.equal(readResetToken(createResetToken(user, SECRET), 'y'.repeat(40)).ok, false);
  const loginToken = jwt.sign({ id: 'u1' }, SECRET, { expiresIn: '7d' });
  assert.equal(readResetToken(loginToken, SECRET).ok, false, 'a normal login JWT has no reset audience');
  const expired = jwt.sign({ sub: 'u1', ph: 'x' }, SECRET, { audience: 'hrhub-password-reset', expiresIn: -10 });
  assert.match(readResetToken(expired, SECRET).reason, /expired/);
  assert.equal(readResetToken('', SECRET).ok, false);
});

test('new password rules', () => {
  assert.match(validateNewPassword('short1'), /at least 8/);
  assert.match(validateNewPassword('onlyletters'), /letter and one number/);
  assert.match(validateNewPassword('12345678'), /letter and one number/);
  assert.match(validateNewPassword('budi1234@mra.id', 'BUDI1234@mra.id'), /e-mail/);
  assert.equal(validateNewPassword('Rekrut2026'), null);
});

test('rate limiter allows n hits per window per key', () => {
  const allow = createLimiter(3, 1000);
  assert.deepEqual([allow('a', 0), allow('a', 1), allow('a', 2), allow('a', 3)], [true, true, true, false]);
  assert.equal(allow('b', 3), true, 'keys are independent');
  assert.equal(allow('a', 1500), true, 'window slides');
});

test('masked e-mail', () => {
  assert.equal(maskEmail('budi@mragroup.co.id'), 'b***@mragroup.co.id');
  assert.equal(maskEmail('a@x.id'), 'a*@x.id');
});
