const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createMatcher, normalize, FULL, PARTIAL } = require('../../services/keywordMatcher');
const { calculateAtsMatchScore } = require('../../services/profilingService');
const { parseResume } = require('../../services/atsParserService');
const batch02 = require('../../scripts/cv/batch02');

test('normalize unifies "&", case and edge punctuation but keeps tech tokens', () => {
  assert.equal(normalize('F&B Management'), 'f and b management');
  assert.equal(normalize('Node.js, PostgreSQL.'), 'node.js postgresql');
  assert.equal(normalize('CI/CD'), 'ci/cd');
  assert.equal(normalize('C#'), 'c#');
});

test('matcher: whole words only, synonyms, partial cores', () => {
  const m = createMatcher(
    ['PostgreSQL', 'Microsoft Excel', 'React', 'Leadership', 'P&L Analysis'],
    'Mengawasi 9 outlet F&B, food costing 28% dan HACCP compliance. Memimpin manajemen stok. Membangun API Node.js.'
  );
  assert.equal(m('SQL'), 0, 'sql must not match inside postgresql');
  assert.equal(m('PostgreSQL'), FULL);
  assert.equal(m('Excel'), FULL, 'synonym of Microsoft Excel');
  assert.equal(m('Food Costing'), FULL);
  assert.equal(m('HACCP'), FULL);
  assert.equal(m('Inventory Management'), FULL, 'synonym of manajemen stok');
  assert.equal(m('Node.js'), FULL);
  assert.equal(m('React Native'), 0, 'react alone is not react native');
  assert.equal(m('Team Leadership'), PARTIAL);
  assert.equal(m('F&B Management'), PARTIAL);
  assert.equal(m('P&L Management'), PARTIAL);
  assert.equal(m('Kubernetes'), 0);
});

test('no job → neutral defaults', () => {
  const e = calculateAtsMatchScore({ skills: [] }, null);
  assert.equal(e.atsScore, 75);
});

// Fixture: the sample jobs the batch-2 CVs target (subset of scripts/seedJobSamples.js)
const JOBS = {
  'Backend Engineer (Node.js)': { mustHaveSkills: ['Node.js', 'PostgreSQL', 'REST API', 'Prisma'], niceToHaveSkills: ['Docker', 'Redis'], minExperience: 3, minEducation: 'S1' },
  'Boutique Sales Advisor (BVLGARI)': { mustHaveSkills: ['Clienteling', 'Luxury Retail', 'Sales Strategy', 'Customer Service'], niceToHaveSkills: ['Mandarin', 'Jewelry Knowledge'], minExperience: 2, minEducation: 'D3 / S1' },
  'Retail Area Manager (Bali)': { mustHaveSkills: ['Store Operations', 'P&L Management', 'Team Leadership', 'Inventory Management'], niceToHaveSkills: ['Tourism Retail'], minExperience: 6, minEducation: 'S1' },
  'Visual Merchandiser (Luxury Fashion)': { mustHaveSkills: ['Visual Merchandising', 'Store Layout', 'Brand Guidelines'], niceToHaveSkills: ['Adobe Illustrator', 'Window Display'], minExperience: 3, minEducation: 'S1' },
  'F&B Area Manager (East Java)': { mustHaveSkills: ['F&B Management', 'P&L Management', 'Team Leadership', 'Food Costing'], niceToHaveSkills: ['Franchise Operations'], minExperience: 5, minEducation: 'S1' },
  'Barista Lead (Jamba Juice)': { mustHaveSkills: ['Beverage Preparation', 'Customer Service', 'Food Safety'], niceToHaveSkills: ['Latte Art'], minExperience: 1, minEducation: 'SMA/SMK' },
  'Food Safety & Quality Officer': { mustHaveSkills: ['HACCP', 'Food Safety', 'SOP'], niceToHaveSkills: ['ISO 22000', 'Halal Certification'], minExperience: 3, minEducation: 'S1' },
  'Social Media Specialist (Cosmopolitan)': { mustHaveSkills: ['Social Media Strategy', 'Copywriting', 'Content Planning'], niceToHaveSkills: ['TikTok Ads', 'Canva'], minExperience: 2, minEducation: 'S1' },
  'Video Producer (Digital Media)': { mustHaveSkills: ['Video Editing', 'Premiere Pro', 'Storyboarding'], niceToHaveSkills: ['After Effects', 'Drone Operation'], minExperience: 3, minEducation: 'S1' },
  'HR Business Partner': { mustHaveSkills: ['Employee Relations', 'Talent Management', 'Labor Law'], niceToHaveSkills: ['HRIS', 'Organizational Development'], minExperience: 5, minEducation: 'S1' },
  'Finance & Tax Officer': { mustHaveSkills: ['Tax Compliance', 'Accounting', 'Excel'], niceToHaveSkills: ['Brevet A/B', 'SAP'], minExperience: 3, minEducation: 'S1' }
};

test('ATS score separates strong, medium and weak candidates (batch-2 sample CVs)', async () => {
  const byFit = { STRONG: [], MEDIUM: [], WEAK: [] };
  for (const s of batch02) {
    const cv = path.join(__dirname, '../../../sample_cv_ats/batch_02', `${s.fileName}.pdf`);
    const candidate = await parseResume(fs.readFileSync(cv), 'application/pdf', 'cv.pdf');
    const { atsScore } = calculateAtsMatchScore(candidate, JOBS[s.target]);
    byFit[s.fit].push(atsScore);
  }
  const avg = (xs) => xs.reduce((n, x) => n + x, 0) / xs.length;
  assert.ok(avg(byFit.STRONG) > avg(byFit.MEDIUM), `strong ${avg(byFit.STRONG)} > medium ${avg(byFit.MEDIUM)}`);
  assert.ok(avg(byFit.MEDIUM) > avg(byFit.WEAK), `medium ${avg(byFit.MEDIUM)} > weak ${avg(byFit.WEAK)}`);
  assert.ok(Math.min(...byFit.STRONG) >= 80, `every strong candidate ≥ 80 (got ${byFit.STRONG})`);
  assert.ok(Math.max(...byFit.WEAK) < 65, `every weak candidate < 65 (got ${byFit.WEAK})`);
});
