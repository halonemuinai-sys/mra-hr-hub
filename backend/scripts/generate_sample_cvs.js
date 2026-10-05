/**
 * Generate ATS-friendly sample resumes (.txt + .pdf) for testing the CV parser.
 *
 *   node scripts/generate_sample_cvs.js            # batch 1 → sample_cv_ats/
 *   node scripts/generate_sample_cvs.js --batch 2  # batch 2 → sample_cv_ats/batch_02/ (+ README index)
 *
 * Data: scripts/cv/batchNN.js · Rendering: scripts/cv/cvRenderer.js
 */
const fs = require('fs');
const path = require('path');
const { generateTxt, generatePdf } = require('./cv/cvRenderer');

const BATCHES = {
  1: { data: require('./cv/batch01'), dir: '' },
  2: { data: require('./cv/batch02'), dir: 'batch_02' }
};

const ROOT_DIR = path.join(__dirname, '../../sample_cv_ats');

function writeIndex(samples, outputDir) {
  const rows = samples.map(
    (s) => `| ${s.fileName} | ${s.fullName} | ${s.target || '-'} | ${s.fit || '-'} | ${s.email} |`
  );
  const md = [
    '# Sample CV ATS — Batch 2',
    '',
    'Resumes for the sample job postings. Fit is intentional so ATS scores differ:',
    'STRONG = matches must-have skills & experience · MEDIUM = partial · WEAK = career switcher / under-qualified.',
    '',
    '| File | Name | Target job | Fit | Email |',
    '| :--- | :--- | :--- | :--- | :--- |',
    ...rows,
    ''
  ].join('\n');
  fs.writeFileSync(path.join(outputDir, 'README.md'), md, 'utf-8');
}

async function main() {
  const flag = process.argv.indexOf('--batch');
  const batchNo = flag > -1 ? Number(process.argv[flag + 1]) : 1;
  const batch = BATCHES[batchNo];
  if (!batch) throw new Error(`Unknown batch ${batchNo}. Available: ${Object.keys(BATCHES).join(', ')}`);

  const outputDir = path.join(ROOT_DIR, batch.dir);
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Generating ${batch.data.length} ATS-friendly sample resumes in ${outputDir}...`);

  for (const s of batch.data) {
    fs.writeFileSync(path.join(outputDir, `${s.fileName}.txt`), generateTxt(s), 'utf-8');
    await generatePdf(s, path.join(outputDir, `${s.fileName}.pdf`));
    console.log(`✓ ${s.fileName} (.txt + .pdf)`);
  }

  if (batchNo !== 1) writeIndex(batch.data, outputDir);
  console.log(`\nBatch ${batchNo}: ${batch.data.length} resumes generated.`);
}

main().catch((err) => {
  console.error('Error generating sample resumes:', err.message);
  process.exitCode = 1;
});
