const { test } = require('node:test');
const assert = require('node:assert/strict');
const { phoneKey, nameKey } = require('../../controllers/candidateInsightController');

test('phone numbers compare on their last 9 digits regardless of format', () => {
  assert.equal(phoneKey('+62 812-3456-7890'), phoneKey('0812 3456 7890'));
  assert.equal(phoneKey('6281234567890'), phoneKey('081234567890'));
  assert.equal(phoneKey('12345'), null, 'too short to compare');
  assert.equal(phoneKey(null), null);
});

test('names compare without academic titles, punctuation or case', () => {
  assert.equal(nameKey('Hendra Saputra, S.Tr.Par.'), 'hendra saputra');
  assert.equal(nameKey('  HENDRA   saputra '), 'hendra saputra');
  assert.notEqual(nameKey('Hendra Saputro'), nameKey('Hendra Saputra'));
});
