const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { detectExtension, saveTemp, claimTemp, resolveStored, removeStored } = require('../../services/resumeStorage');

test('file type comes from content, not just the name', () => {
  assert.equal(detectExtension(Buffer.from('%PDF-1.7 ...'), 'cv.pdf'), '.pdf');
  assert.equal(detectExtension(Buffer.from('%PDF-1.7 ...'), 'cv.exe'), '.pdf', 'real PDF with a wrong name is still a PDF');
  assert.equal(detectExtension(Buffer.from('MZ\x90\x00 not a pdf'), 'cv.pdf'), null, 'renamed executable is rejected');
  assert.equal(detectExtension(Buffer.from([0x50, 0x4b, 0x03, 0x04]), 'cv.docx'), '.docx');
  assert.equal(detectExtension(Buffer.from('Andi Wijaya\nandi@example.com'), 'cv.txt'), '.txt');
  assert.equal(detectExtension(Buffer.from([0x41, 0x00, 0x42]), 'cv.txt'), null, 'binary data is not a text CV');
});

test('temp upload → claim → resolve → remove round trip', () => {
  const token = saveTemp(Buffer.from('%PDF-1.4 test'), 'Andi CV.pdf');
  assert.match(token, /^[0-9a-f-]{36}$/);
  const rel = claimTemp(token);
  assert.match(rel, /^resumes\/[0-9a-f-]{36}\.pdf$/);
  assert.equal(claimTemp(token), null, 'a token can be claimed only once');
  const abs = resolveStored(rel);
  assert.ok(abs && fs.readFileSync(abs).toString().startsWith('%PDF'));
  removeStored(rel);
  assert.equal(resolveStored(rel), null);
});

test('invalid tokens and path traversal are refused', () => {
  assert.equal(claimTemp('../../etc/passwd'), null);
  assert.equal(claimTemp('not-a-token'), null);
  assert.equal(claimTemp('00000000-0000-0000-0000-000000000000'), null);
  assert.equal(resolveStored('../.env'), null);
  assert.equal(resolveStored('resumes/../../.env'), null);
  assert.equal(resolveStored(path.resolve('/etc/hosts')), null);
  assert.equal(resolveStored(null), null);
});
