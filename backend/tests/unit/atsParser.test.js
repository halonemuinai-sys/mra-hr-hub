const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parseResume } = require('../../services/atsParserService');
const batch02 = require('../../scripts/cv/batch02');

const CV_DIR = path.join(__dirname, '../../../sample_cv_ats/batch_02');
const candidateOf = (out) => out.data || out.candidate || out;

test('every batch-2 sample PDF parses with the right email, repeatedly (pooled-buffer regression)', async () => {
  // Small PDFs used to fail at random because pdf.js read Node's shared buffer pool
  for (let round = 0; round < 3; round++) {
    for (const s of batch02) {
      const file = path.join(CV_DIR, `${s.fileName}.pdf`);
      const c = candidateOf(await parseResume(fs.readFileSync(file), 'application/pdf', `${s.fileName}.pdf`));
      assert.equal(c.email, s.email, `${s.fileName} round ${round}`);
      assert.ok(!String(c.fullName).startsWith('%PDF'), `${s.fileName} returned raw PDF bytes`);
    }
  }
});

test('plain-text resumes parse too', async () => {
  const s = batch02[0];
  const c = candidateOf(await parseResume(fs.readFileSync(path.join(CV_DIR, `${s.fileName}.txt`)), 'text/plain', `${s.fileName}.txt`));
  assert.equal(c.email, s.email);
  assert.ok(c.skills.some((k) => /node\.js/i.test(k.skillName)));
});

test('education years are not counted as work experience', async () => {
  // Andre: 2022–Sekarang + 2020–2022 at work, 2016–2020 at university
  const s = batch02.find((x) => x.fileName.startsWith('06_'));
  const c = candidateOf(await parseResume(fs.readFileSync(path.join(CV_DIR, `${s.fileName}.pdf`)), 'application/pdf', 'x.pdf'));
  const expected = new Date().getFullYear() - 2022 + 2;
  assert.equal(c.totalExperienceYrs, expected);
});
