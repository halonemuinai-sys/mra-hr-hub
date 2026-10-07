const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolvePeriod } = require('../../controllers/reportController');

test('default period is the current calendar month up to now', () => {
  const p = resolvePeriod({});
  const now = new Date();
  assert.equal(p.from.getDate(), 1);
  assert.equal(p.from.getMonth(), now.getMonth());
  assert.ok(p.to <= new Date());
});

test('explicit dates are inclusive local days', () => {
  const p = resolvePeriod({ from: '2026-09-01', to: '2026-09-30' });
  assert.equal(p.from.getHours(), 0);
  assert.equal(p.to.getDate(), 30);
  assert.equal(p.to.getHours(), 23);
});

test('invalid, reversed or over-a-year periods are rejected', () => {
  assert.equal(resolvePeriod({ from: 'nope' }), null);
  assert.equal(resolvePeriod({ from: '2026-12-01', to: '2026-01-01' }), null);
  assert.equal(resolvePeriod({ from: '2024-01-01', to: '2026-01-01' }), null);
});
