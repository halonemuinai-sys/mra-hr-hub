/**
 * Demo interview schedules for the sample candidates (@sample.hrhub.test) so the Interview Calendar has data.
 * Touches only sample applications; idempotent (re-running replaces the previous sample schedules).
 *
 *   node scripts/seedInterviewSamples.js          # create / refresh
 *   node scripts/seedInterviewSamples.js --clean  # remove the sample schedules
 *
 * - Candidates now in Interview HR / Interview User get a schedule (INTERVIEW_SCHEDULED activity) spread over
 *   this week and next; two are in the past (awaiting outcome), one pair clashes (same interviewer, same hour)
 *   and two stay unscheduled.
 * - Earlier interview moves of sample candidates that already moved on get a date, so completed interviews show.
 */
const prisma = require('../api/db');

const SAMPLE_DOMAIN = '@sample.hrhub.test';
const TAG = '[sample]';
const HR_INTERVIEWERS = ['Siti Rahma', 'Dewi Lestari', 'Rizky Pratama'];
const SLOTS = [9, 10, 11, 13, 14, 15, 16];
const shortName = (n) => String(n || '').replace(/\s*\(.*\)\s*$/, '');
const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** The n-th working day from today (negative = past), at the given hour */
function workday(offset, hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  let step = offset >= 0 ? 1 : -1;
  let left = Math.abs(offset);
  if (offset === 0 && (d.getDay() === 0 || d.getDay() === 6)) left = 1;
  while (left > 0) {
    d.setDate(d.getDate() + step);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d;
}

async function clean() {
  const sampleApps = { application: { candidate: { email: { endsWith: SAMPLE_DOMAIN } } } };
  const removed = await prisma.applicationActivity.deleteMany({ where: { ...sampleApps, action: 'INTERVIEW_SCHEDULED', note: TAG } });
  const marked = await prisma.applicationActivity.findMany({
    where: { ...sampleApps, action: 'STAGE_CHANGE', stageData: { path: ['sampleInterview'], equals: true } },
    select: { id: true }
  });
  for (const m of marked) await prisma.applicationActivity.update({ where: { id: m.id }, data: { stageData: null } });
  console.log(`🧹 Removed ${removed.count} sample schedules and ${marked.length} sample interview dates.`);
}

async function main() {
  await clean();
  if (process.argv.includes('--clean')) return;

  const apps = await prisma.jobApplication.findMany({
    where: { candidate: { email: { endsWith: SAMPLE_DOMAIN } } },
    orderBy: { appliedAt: 'asc' },
    select: {
      id: true,
      status: true,
      assignedRecruiterId: true,
      assignedRecruiter: { select: { name: true } },
      activities: { where: { action: 'STAGE_CHANGE' }, orderBy: { createdAt: 'asc' }, select: { id: true, toStatus: true, stageData: true, createdAt: true } }
    }
  });

  // 1. Current interviews → schedules
  const current = apps.filter((a) => a.status === 'INTERVIEW_HR' || a.status === 'INTERVIEW_USER');
  const rows = [];
  // Clash pair: the first two candidates (after the two "awaiting" ones) that share a stage → same interviewer, same hour
  const pool = current.slice(2, Math.max(2, current.length - 2));
  const clashStage = ['INTERVIEW_HR', 'INTERVIEW_USER'].find((st) => pool.filter((a) => a.status === st).length >= 2);
  const clashIds = clashStage ? pool.filter((a) => a.status === clashStage).slice(0, 2).map((a) => a.id) : [];
  current.forEach((a, i) => {
    if (i >= current.length - 2) return; // leave two unscheduled
    const hr = a.status === 'INTERVIEW_HR';
    let when;
    if (i < 2) when = workday(-1, 10 + i * 3); // yesterday → awaiting outcome
    else if (clashIds.includes(a.id)) when = workday(1, 10, clashIds.indexOf(a.id) * 30); // clash pair
    else when = workday(Math.floor((i - 2) / 3), SLOTS[i % SLOTS.length]);
    const interviewer = hr
      ? clashIds.includes(a.id)
        ? 'Siti Rahma'
        : shortName(a.assignedRecruiter?.name) || HR_INTERVIEWERS[i % HR_INTERVIEWERS.length]
      : 'Hendrawan';
    const onsite = i % 3 === 0;
    rows.push({
      applicationId: a.id,
      actorId: a.assignedRecruiterId,
      action: 'INTERVIEW_SCHEDULED',
      fromStatus: a.status,
      toStatus: a.status,
      note: TAG,
      stageData: {
        interviewAt: local(when),
        interviewer,
        interviewMode: onsite ? 'Onsite' : 'Online',
        location: onsite ? 'Wisma MRA, Meeting Room 3' : 'Google Meet',
        note: TAG
      }
    });
  });
  if (rows.length) await prisma.applicationActivity.createMany({ data: rows });

  // 2. Past interviews of candidates who moved on → give them a date (completed)
  let history = 0;
  for (const a of apps) {
    for (let i = 0; i < a.activities.length; i++) {
      const m = a.activities[i];
      if (!['INTERVIEW_HR', 'INTERVIEW_USER'].includes(m.toStatus) || m.stageData) continue;
      const next = a.activities[i + 1];
      if (!next) continue; // still in the stage → handled above
      const d = new Date(m.createdAt);
      const gap = new Date(next.createdAt) - d;
      const when = new Date(d.getTime() + Math.max(gap / 2, 3600000));
      when.setHours(Math.min(16, Math.max(9, when.getHours())), 0, 0, 0); // office hours
      await prisma.applicationActivity.update({
        where: { id: m.id },
        data: {
          stageData: {
            interviewAt: local(when),
            ...(m.toStatus === 'INTERVIEW_HR' ? { interviewer: shortName(a.assignedRecruiter?.name) || 'Siti Rahma' } : { hiringManager: 'Hendrawan' }),
            interviewMode: 'Online',
            sampleInterview: true
          }
        }
      });
      history++;
    }
  }
  console.log(`📅 Sample interviews: ${rows.length} scheduled (2 awaiting outcome, 1 clash), ${Math.min(2, current.length)} unscheduled, ${history} past interviews dated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
