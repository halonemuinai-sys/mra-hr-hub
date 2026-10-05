/**
 * Seed sample job postings so Kelola Lowongan ATS and the career portal
 * have a realistic catalogue (tops the list up to 25 jobs in total).
 *
 * All sample jobs use a `sample-` slug prefix.
 *   node scripts/seedJobSamples.js          # (re)create sample jobs
 *   node scripts/seedJobSamples.js --clean  # remove sample jobs only
 *
 * Note: removing a job cascades to its applications.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../api/db');

const PREFIX = 'sample-';
const TARGET_TOTAL = 25;

const RETAIL = 'MRA Retail (BVLGARI / Mogems)';
const LUXURY_WATCH = 'MRA Retail (OMEGA / Chronologie)';
const FNB = 'Food & Beverage Franchises';
const MEDIA = 'MRA Media (Harper’s Bazaar / Cosmopolitan)';
const RADIO = 'National Broadcast Radio';
const CORP = 'MRA Corporate / Shared Service';
const HOLDING = 'GLC MRA Holding';

// [title, department, division, location, type, minExp, minEdu, salaryMin, salaryMax (juta), mustHave, niceToHave, isActive]
const JOBS = [
  ['Boutique Sales Advisor (BVLGARI)', 'Retail Operations', RETAIL, 'Plaza Indonesia, Jakarta', 'Full-time', 2, 'D3 / S1', 7, 11,
    ['Clienteling', 'Luxury Retail', 'Sales Strategy', 'Customer Service'], ['Mandarin', 'Jewelry Knowledge'], true],
  ['Visual Merchandiser (Luxury Fashion)', 'Retail Marketing', RETAIL, 'Plaza Indonesia, Jakarta', 'Full-time', 3, 'S1', 9, 13,
    ['Visual Merchandising', 'Store Layout', 'Brand Guidelines'], ['Adobe Illustrator', 'Window Display'], true],
  ['Watch Specialist & After-Sales (OMEGA)', 'Retail Operations', LUXURY_WATCH, 'Senayan City, Jakarta Selatan', 'Full-time', 2, 'D3 / S1', 8, 12,
    ['Watch Servicing', 'Customer Service', 'POS System'], ['Swiss Watch Certification'], true],
  ['Retail Area Manager (Bali)', 'Retail Operations', RETAIL, 'Bali', 'Full-time', 6, 'S1', 20, 28,
    ['Store Operations', 'P&L Management', 'Team Leadership', 'Inventory Management'], ['Tourism Retail'], true],
  ['Stock Controller (Retail Warehouse)', 'Supply Chain', RETAIL, 'Tangerang', 'Contract', 2, 'D3 / S1', 6, 9,
    ['Inventory Management', 'Stock Opname', 'Excel'], ['SAP', 'WMS'], true],

  ['Outlet Supervisor (Häagen-Dazs)', 'Food & Beverage Operations', FNB, 'Jakarta & Tangerang', 'Full-time', 2, 'D3 / S1', 7, 10,
    ['F&B Management', 'Store Operations', 'HACCP'], ['Food Costing'], true],
  ['Barista Lead (Jamba Juice)', 'Food & Beverage Operations', FNB, 'Surabaya', 'Full-time', 1, 'SMA/SMK', 5, 7,
    ['Beverage Preparation', 'Customer Service', 'Food Safety'], ['Latte Art'], true],
  ['F&B Area Manager (East Java)', 'Food & Beverage Operations', FNB, 'Surabaya', 'Full-time', 5, 'S1', 16, 22,
    ['F&B Management', 'P&L Management', 'Team Leadership', 'Food Costing'], ['Franchise Operations'], true],
  ['Food Safety & Quality Officer', 'Quality Assurance', FNB, 'Tangerang', 'Full-time', 3, 'S1', 9, 13,
    ['HACCP', 'Food Safety', 'SOP'], ['ISO 22000', 'Halal Certification'], true],

  ['Social Media Specialist (Cosmopolitan)', 'Editorial & Media Publishing', MEDIA, 'Jakarta Selatan', 'Full-time', 2, 'S1', 8, 12,
    ['Social Media Strategy', 'Copywriting', 'Content Planning'], ['TikTok Ads', 'Canva'], true],
  ['Video Producer (Digital Media)', 'Editorial & Media Publishing', MEDIA, 'Jakarta Selatan', 'Full-time', 3, 'S1', 10, 15,
    ['Video Editing', 'Premiere Pro', 'Storyboarding'], ['After Effects', 'Drone Operation'], true],
  ['Radio Announcer (Hard Rock FM)', 'Radio Broadcasting & Audio Creative', RADIO, 'Jakarta Selatan (Onsite)', 'Full-time', 2, 'S1', 7, 11,
    ['Radio Broadcasting', 'Public Speaking', 'Scriptwriting'], ['Music Curation', 'Podcasting'], true],
  ['Media Sales Executive (Advertising)', 'Media Sales', MEDIA, 'Jakarta Selatan', 'Full-time', 2, 'S1', 8, 14,
    ['B2B Sales', 'Negotiation', 'Media Planning'], ['Agency Network'], true],
  ['Editorial Intern (Harper’s Bazaar)', 'Editorial & Media Publishing', MEDIA, 'Jakarta Selatan', 'Internship', 0, 'S1', 3, 4,
    ['Copywriting', 'Research'], ['Fashion Journalism'], false],

  ['Backend Engineer (Node.js)', 'Technology & Digital', CORP, 'Jakarta Selatan (Hybrid)', 'Full-time', 3, 'S1', 15, 22,
    ['Node.js', 'PostgreSQL', 'REST API', 'Prisma'], ['Docker', 'Redis'], true],
  ['IT Support Specialist', 'Technology & Digital', CORP, 'Jakarta Selatan', 'Full-time', 1, 'D3 / S1', 6, 9,
    ['Hardware Troubleshooting', 'Networking', 'Windows Administration'], ['Microsoft 365 Admin'], true],
  ['Finance & Tax Officer', 'Finance & Accounting', HOLDING, 'Jakarta Selatan', 'Full-time', 3, 'S1', 10, 14,
    ['Tax Compliance', 'Accounting', 'Excel'], ['Brevet A/B', 'SAP'], true],
  ['HR Business Partner', 'Human Resources', HOLDING, 'Jakarta Selatan', 'Full-time', 5, 'S1', 15, 21,
    ['Employee Relations', 'Talent Management', 'Labor Law'], ['HRIS', 'Organizational Development'], true],
  ['Data Analyst (Business Intelligence)', 'Technology & Digital', CORP, 'Jakarta Selatan (Hybrid)', 'Contract', 2, 'S1', 11, 16,
    ['SQL', 'Power BI', 'Data Modeling'], ['Python', 'Looker Studio'], false]
];

const slugify = (s) =>
  PREFIX + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function describe(title, division, location, type) {
  return `MRA Group membuka posisi ${title} untuk ${division}, berlokasi di ${location} (${type}). ` +
    'Anda akan bergabung dengan tim yang dinamis, berkolaborasi lintas fungsi, dan berkontribusi langsung pada pertumbuhan unit bisnis.';
}

function requirementsText(minExp, minEdu, mustHave) {
  return [
    `Pendidikan minimal ${minEdu}.`,
    minExp ? `Pengalaman minimal ${minExp} tahun di bidang terkait.` : 'Terbuka untuk fresh graduate.',
    `Menguasai: ${mustHave.join(', ')}.`,
    'Komunikatif, teliti, dan mampu bekerja dalam target.'
  ].join('\n');
}

async function main() {
  const removed = await prisma.jobPosting.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  console.log(`🧹 Removed ${removed.count} sample jobs.`);
  if (process.argv.includes('--clean')) return;

  const existing = await prisma.jobPosting.count();
  const toCreate = JOBS.slice(0, Math.max(0, TARGET_TOTAL - existing));

  for (const [title, department, division, location, employmentType, minExperience, minEducation, sMin, sMax, mustHave, niceToHave, isActive] of toCreate) {
    await prisma.jobPosting.create({
      data: {
        title,
        slug: slugify(title),
        department,
        division,
        location,
        employmentType,
        minExperience,
        minEducation,
        salaryMin: sMin * 1000000,
        salaryMax: sMax * 1000000,
        description: describe(title, division, location, employmentType),
        requirements: requirementsText(minExperience, minEducation, mustHave),
        mustHaveSkills: mustHave,
        niceToHaveSkills: niceToHave,
        isActive
      }
    });
  }

  const total = await prisma.jobPosting.count();
  const active = await prisma.jobPosting.count({ where: { isActive: true } });
  console.log(`✅ ${toCreate.length} sample jobs created → ${total} jobs total (${active} active, ${total - active} closed).`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
