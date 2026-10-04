/**
 * Seed 50 sample candidates + applications spread across the pipeline,
 * with TA ownership (PIC), stale cards and an activity log, so the
 * Pipeline and Kinerja Tim TA pages have realistic data.
 *
 * All sample candidates use the @sample.hrhub.test email domain.
 *   node scripts/seedPipelineSamples.js          # (re)create samples
 *   node scripts/seedPipelineSamples.js --clean  # remove samples only
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../api/db');

const SAMPLE_DOMAIN = '@sample.hrhub.test';
const TOTAL = 50;
const DAY = 86400000;
const HOUR = 3600000;

// Deterministic PRNG so every run produces the same dataset
let seed = 20261004;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => min + rand() * (max - min);
const int = (min, max) => Math.floor(between(min, max + 1));

const FIRST = ['Andi', 'Bayu', 'Citra', 'Dimas', 'Eka', 'Fajar', 'Gita', 'Hana', 'Indra', 'Joko', 'Kirana', 'Lestari',
  'Made', 'Nadia', 'Oka', 'Putri', 'Rangga', 'Sari', 'Teguh', 'Utami', 'Vina', 'Wahyu', 'Yoga', 'Zahra', 'Arief',
  'Bunga', 'Dewanto', 'Fitri', 'Galih', 'Intan', 'Kevin', 'Laras', 'Mega', 'Nanda', 'Rizal', 'Salsa', 'Tasya', 'Yudha'];
const LAST = ['Pratama', 'Saputra', 'Wijaya', 'Kusuma', 'Lestari', 'Hidayat', 'Nugroho', 'Santoso', 'Permata',
  'Halim', 'Siregar', 'Gunawan', 'Wibowo', 'Anggraini', 'Firmansyah', 'Purnomo', 'Sitompul', 'Rahmawati'];
const CITIES = ['Jakarta Selatan', 'Jakarta Pusat', 'Tangerang Selatan', 'Bekasi', 'Depok', 'Bandung', 'Surabaya', 'Bali'];
const COMPANIES = ['PT Sinar Retailindo', 'PT Nusantara Digital', 'PT Kreasi Media', 'PT Rasa Prima', 'PT Andalan Legal',
  'PT Mitra Luxury', 'PT Gema Siaran', 'PT Teknologi Kita'];
const UNIVERSITIES = ['Universitas Indonesia', 'Institut Teknologi Bandung', 'Universitas Gadjah Mada',
  'Universitas Bina Nusantara', 'Universitas Trisakti', 'Universitas Padjadjaran', 'Universitas Airlangga'];
const REJECT_NOTES = ['Skill teknis belum sesuai', 'Ekspektasi gaji di atas budget', 'Pengalaman kurang relevan',
  'Kandidat mengundurkan diri'];

// Job title keyword → profile
const JOB_PROFILES = [
  { match: /Frontend/i, family: 'IT_DIGITAL', headline: 'Frontend Engineer', major: 'Teknik Informatika' },
  { match: /Store Operations/i, family: 'RETAIL_OPS', headline: 'Retail Store Supervisor', major: 'Manajemen' },
  { match: /Legal/i, family: 'CORPORATE_SERVICES', headline: 'Legal Officer', major: 'Ilmu Hukum' },
  { match: /Restaurant/i, family: 'RETAIL_OPS', headline: 'F&B Outlet Manager', major: 'Manajemen Perhotelan' },
  { match: /Radio/i, family: 'CREATIVE_MEDIA', headline: 'Radio Producer', major: 'Ilmu Komunikasi' },
  { match: /Fashion|Editor/i, family: 'CREATIVE_MEDIA', headline: 'Fashion Content Editor', major: 'Jurnalistik' }
];

// Funnel-shaped distribution (sums to 50)
const STAGE_PLAN = [
  ['APPLIED', 12], ['ATS_SCREENED', 9], ['SHORTLISTED', 7], ['INTERVIEW_HR', 6], ['INTERVIEW_USER', 4],
  ['OFFERING', 3], ['HIRED', 2], ['REJECTED', 4], ['TALENT_POOL', 3]
];
const FUNNEL = ['APPLIED', 'ATS_SCREENED', 'SHORTLISTED', 'INTERVIEW_HR', 'INTERVIEW_USER', 'OFFERING', 'HIRED'];

async function clean() {
  const r = await prisma.candidate.deleteMany({ where: { email: { endsWith: SAMPLE_DOMAIN } } });
  console.log(`🧹 Removed ${r.count} sample candidates (applications & activity cascade).`);
}

async function main() {
  await clean();
  if (process.argv.includes('--clean')) return;

  const jobs = await prisma.jobPosting.findMany({ where: { isActive: true } });
  const recruiters = await prisma.user.findMany({ where: { role: 'RECRUITER', isActive: true } });
  if (!jobs.length || !recruiters.length) throw new Error('Butuh minimal 1 lowongan aktif dan 1 recruiter aktif.');

  const stages = STAGE_PLAN.flatMap(([s, n]) => Array(n).fill(s));
  const now = Date.now();
  const usedEmails = new Set();
  const counts = { assigned: 0, unassigned: 0, stale: 0, activities: 0 };

  for (let i = 0; i < TOTAL; i++) {
    const status = stages[i];
    const job = jobs[i % jobs.length];
    const profile = JOB_PROFILES.find((p) => p.match.test(job.title)) || JOB_PROFILES[0];

    let first, last, email;
    do {
      first = pick(FIRST);
      last = pick(LAST);
      email = `${first}.${last}${int(1, 99)}`.toLowerCase() + SAMPLE_DOMAIN;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    // Scores rise with funnel depth; rejected/talent pool are mixed
    const depth = Math.max(0, FUNNEL.indexOf(status));
    const base = status === 'REJECTED' ? between(45, 70) : status === 'TALENT_POOL' ? between(60, 80) : 58 + depth * 5;
    const atsScore = Math.round(Math.min(97, Math.max(42, base + between(-6, 8))));
    const years = Math.round(between(1, 12) * 10) / 10;
    const seniority = years >= 8 ? 'LEAD' : years >= 5 ? 'SENIOR' : years >= 2 ? 'MID' : 'ENTRY';

    const skills = job.mustHaveSkills.length ? job.mustHaveSkills : ['Komunikasi'];
    const matched = skills.filter(() => rand() < atsScore / 100);
    const missing = skills.filter((s) => !matched.includes(s));

    // Timeline: applied 1–45 days ago; ~1 in 4 active cards is stale (≥7 days in stage)
    const appliedAt = now - between(1, 45) * DAY;
    const unassigned = status === 'APPLIED' ? rand() < 0.7 : status === 'ATS_SCREENED' && rand() < 0.2;
    const owner = unassigned ? null : pick(recruiters);
    const assignedAt = owner ? Math.min(now - HOUR, appliedAt + between(2, 60) * HOUR) : null;

    const closed = ['HIRED', 'REJECTED', 'TALENT_POOL'].includes(status);
    const wantStale = !closed && status !== 'APPLIED' && rand() < 0.3;
    const floor = assignedAt || appliedAt;
    let stageChangedAt;
    if (status === 'APPLIED') stageChangedAt = appliedAt;
    else if (wantStale && now - floor > 8 * DAY) stageChangedAt = floor + between(0.3, 0.6) * (now - 7 * DAY - floor);
    else stageChangedAt = Math.max(floor + HOUR, now - between(0.2, 6) * DAY);
    if (!closed && now - stageChangedAt >= 7 * DAY) counts.stale++;

    const candidate = await prisma.candidate.create({
      data: {
        fullName: `${first} ${last}`,
        email,
        phone: `08${int(11, 99)}${int(1000000, 9999999)}`,
        location: pick(CITIES),
        headline: `${seniority === 'LEAD' ? 'Lead ' : seniority === 'SENIOR' ? 'Senior ' : ''}${profile.headline}`,
        currentCompany: pick(COMPANIES),
        totalExperienceYrs: years,
        expectedSalary: Math.round(between(6, 35)) * 1000000,
        availability: pick(['IMMEDIATE', 'ONE_MONTH_NOTICE', 'TWO_MONTH_NOTICE', 'OPEN_OFFERS']),
        intakeSource: pick(['ATS_RESUME_UPLOAD', 'ATS_RESUME_UPLOAD', 'EXCEL_TEMPLATE', 'MANUAL_INPUT']),
        profileSummary: `Data contoh pipeline. ${profile.headline} dengan ${years} tahun pengalaman.`,
        jobFamily: profile.family,
        seniorityLevel: seniority,
        tags: ['#SampleData', ...(atsScore >= 85 ? ['#TopTier'] : [])],
        createdAt: new Date(appliedAt),
        skills: {
          create: skills.slice(0, 4).map((s) => ({
            skillName: s,
            category: 'TECHNICAL',
            proficiency: pick(['INTERMEDIATE', 'ADVANCED', 'EXPERT'])
          }))
        },
        experiences: {
          create: [{
            companyName: pick(COMPANIES),
            roleTitle: profile.headline,
            startDate: new Date(now - years * 365 * DAY),
            isCurrent: true,
            description: 'Pengalaman kerja contoh untuk keperluan demo pipeline.'
          }]
        },
        educations: {
          create: [{
            institution: pick(UNIVERSITIES),
            degree: pick(['S1', 'S1', 'D3', 'S2']),
            major: profile.major,
            graduationYear: new Date().getFullYear() - Math.ceil(years) - 1,
            gpa: Math.round(between(2.9, 3.9) * 100) / 100
          }]
        }
      }
    });

    const rejectNote = status === 'REJECTED' ? pick(REJECT_NOTES) : null;
    const app = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        status,
        atsScore,
        skillsScore: Math.min(100, atsScore + int(-8, 8)),
        expScore: Math.min(100, atsScore + int(-10, 6)),
        eduScore: Math.min(100, atsScore + int(-5, 10)),
        matchedKeywords: matched,
        missingKeywords: missing,
        scorecardRating: depth >= 2 || status === 'HIRED' ? int(3, 5) : null,
        recruiterNotes: rejectNote ? `[Contoh • REJECTED] ${rejectNote}` : null,
        appliedAt: new Date(appliedAt),
        assignedRecruiterId: owner ? owner.id : null,
        assignedAt: assignedAt ? new Date(assignedAt) : null,
        stageChangedAt: new Date(stageChangedAt)
      }
    });
    owner ? counts.assigned++ : counts.unassigned++;

    // Activity log: claim, then step through the funnel up to the current stage
    if (owner) {
      const acts = [{ action: 'CLAIM', at: assignedAt, toRecruiterId: owner.id }];
      const reached = closed && status !== 'HIRED' ? int(0, 3) : depth; // where rejected/pooled ones stopped
      const path = FUNNEL.slice(0, reached + 1);
      if (closed && status !== 'HIRED') path.push(status);
      const steps = path.length - 1;
      for (let s = 1; s <= steps; s++) {
        const at = s === steps ? stageChangedAt : assignedAt + ((stageChangedAt - assignedAt) * s) / (steps + 1);
        acts.push({
          action: 'STAGE_CHANGE',
          at,
          fromStatus: path[s - 1],
          toStatus: path[s],
          note: path[s] === 'REJECTED' ? rejectNote : null
        });
      }
      await prisma.applicationActivity.createMany({
        data: acts.map((a) => ({
          applicationId: app.id,
          actorId: owner.id,
          action: a.action,
          fromStatus: a.fromStatus || null,
          toStatus: a.toStatus || null,
          toRecruiterId: a.toRecruiterId || null,
          note: a.note || null,
          createdAt: new Date(a.at)
        }))
      });
      counts.activities += acts.length;
    }
    process.stdout.write('.');
  }

  // Two pending approvals so the Approvals panel has something to show
  const samples = await prisma.jobApplication.findMany({
    where: { candidate: { email: { endsWith: SAMPLE_DOMAIN } }, assignedRecruiterId: { not: null } },
    include: { job: { select: { salaryMax: true } } }
  });
  const pendingSeeds = [
    { from: 'INTERVIEW_USER', to: 'OFFERING', permission: 'approval.offer' },
    { from: 'OFFERING', to: 'HIRED', permission: 'approval.hire' }
  ];
  for (const p of pendingSeeds) {
    const app = samples.find((a) => a.status === p.from);
    if (!app) continue;
    const budget = app.job.salaryMax ? Number(app.job.salaryMax) : 20000000;
    const stageData =
      p.to === 'OFFERING'
        ? { hmFeedback: 'Strong culture fit, ready to offer.', offerSalary: budget + 5000000, startDate: '2026-11-02' }
        : { offerSigned: true, joinDate: '2026-11-02' };
    const reason =
      p.to === 'OFFERING'
        ? `Offer of Rp ${stageData.offerSalary.toLocaleString('id-ID')} exceeds the job budget (max Rp ${budget.toLocaleString('id-ID')}). A TA Lead must approve it.`
        : 'The Hiring Manager must confirm the hire.';
    await prisma.stageRequest.create({
      data: {
        applicationId: app.id,
        requestedById: app.assignedRecruiterId,
        fromStatus: p.from,
        toStatus: p.to,
        stageData,
        approvalPermission: p.permission,
        approvalReason: reason
      }
    });
    await prisma.applicationActivity.create({
      data: {
        applicationId: app.id,
        actorId: app.assignedRecruiterId,
        action: 'APPROVAL_REQUESTED',
        fromStatus: p.from,
        toStatus: p.to,
        note: reason,
        stageData
      }
    });
  }

  console.log(`\n✅ ${TOTAL} sample candidates created.`);
  console.log(`   PIC: ${counts.assigned} assigned, ${counts.unassigned} unassigned • stale: ${counts.stale} • activity rows: ${counts.activities}`);
  console.log('   Stages:', STAGE_PLAN.map(([s, n]) => `${s}=${n}`).join(', '));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
