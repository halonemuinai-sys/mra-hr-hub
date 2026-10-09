/**
 * E-mails to applicants and their audit trail.
 * Each send is logged on the application as EMAIL_SENT / EMAIL_FAILED (skipped sends — demo addresses,
 * mail off — are not logged). Automatic notifications run after the request (later()) so SMTP never slows
 * down or breaks a pipeline action.
 */
const prisma = require('../../api/db');
const cfg = require('../../config/mail');
const { sendMail } = require('./mailer');
const T = require('./templates');

const statusUrl = () => `${cfg.portalUrl}/status`;
const INTERVIEW_STAGES = ['INTERVIEW_HR', 'INTERVIEW_USER'];

/** Run a notification in the background; errors are logged, never thrown */
function later(fn) {
  setImmediate(() => Promise.resolve().then(fn).catch((err) => console.error('✉️  [mail] notification error:', err.message)));
}

async function loadApp(applicationId) {
  return prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      candidate: { select: { fullName: true, email: true } },
      job: { select: { title: true, company: { select: { name: true } } } },
      assignedRecruiter: { select: { email: true } }
    }
  });
}

async function logEmail(applicationId, actorId, result, kind, subject) {
  if (!result || result.status === 'skipped') return;
  await prisma.applicationActivity
    .create({
      data: {
        applicationId,
        actorId: actorId || null,
        action: result.status === 'failed' ? 'EMAIL_FAILED' : 'EMAIL_SENT',
        note: result.status === 'logged' ? `${subject} (log only — not sent)` : subject,
        stageData: { kind, to: result.to, mode: result.status, ...(result.reason ? { reason: String(result.reason).slice(0, 300) } : {}) }
      }
    })
    .catch((err) => console.error('✉️  [mail] could not log e-mail activity:', err.message));
}

/** After a new application from the career portal */
async function notifyApplicationReceived(applicationId) {
  if (!cfg.notifyApplicants) return null;
  const app = await loadApp(applicationId);
  if (!app || !app.candidate.email) return null;
  const msg = T.applicationReceived({ name: app.candidate.fullName, jobTitle: app.job.title, company: app.job.company && app.job.company.name, statusUrl: statusUrl() });
  const result = await sendMail({ to: app.candidate.email, ...msg });
  await logEmail(app.id, null, result, 'APPLICATION_RECEIVED', msg.subject);
  return result;
}

/** Interview invitation (move into Interview HR / User) or reschedule, with an .ics invite */
async function notifyInterview(applicationId, { stage, schedule = {}, reschedule = false, actorId = null }) {
  if (!cfg.notifyApplicants || !INTERVIEW_STAGES.includes(stage) || !schedule.interviewAt) return null;
  const app = await loadApp(applicationId);
  if (!app || !app.candidate.email) return null;
  const details = {
    name: app.candidate.fullName,
    jobTitle: app.job.title,
    stage,
    interviewAt: schedule.interviewAt,
    interviewer: schedule.interviewer || schedule.hiringManager || '',
    mode: schedule.interviewMode || '',
    location: schedule.location || '',
    note: schedule.note || '',
    reschedule,
    statusUrl: statusUrl()
  };
  const msg = T.interviewInvitation(details);
  const ics = T.buildIcs({
    uid: `${app.id}-${stage}`,
    interviewAt: schedule.interviewAt,
    summary: `${stage === 'INTERVIEW_USER' ? 'Interview User' : 'Interview HR'} — ${app.job.title} (MRA Group)`,
    description: [`Posisi: ${app.job.title}`, details.interviewer && `Pewawancara: ${details.interviewer}`, details.note].filter(Boolean).join('\n'),
    location: details.location || (details.mode === 'Online' ? 'Online' : '')
  });
  const result = await sendMail({
    to: app.candidate.email,
    replyTo: app.assignedRecruiter && app.assignedRecruiter.email,
    ...msg,
    attachments: ics ? [{ filename: 'undangan-interview.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }] : undefined
  });
  await logEmail(app.id, actorId, result, reschedule ? 'INTERVIEW_RESCHEDULED' : 'INTERVIEW_INVITATION', msg.subject);
  return result;
}

/** Offer letter PDF to the candidate (called directly by the offer controller, result returned to the user) */
async function sendOfferLetter(letter, pdf, { actorId, replyTo } = {}) {
  const msg = T.offerLetter({
    name: letter.candidateName,
    jobTitle: letter.positionTitle,
    company: letter.company && letter.company.name,
    letterNo: letter.letterNo,
    validUntil: letter.validUntil,
    signatoryName: letter.signatoryName,
    signatoryTitle: letter.signatoryTitle
  });
  const filename = `${String(letter.letterNo).replace(/\//g, '-')}_${String(letter.candidateName).replace(/[^A-Za-z0-9]+/g, '-')}.pdf`;
  const result = await sendMail({ to: letter.candidateEmail, replyTo, ...msg, attachments: [{ filename, content: pdf, contentType: 'application/pdf' }] });
  await logEmail(letter.applicationId, actorId, result, 'OFFER_LETTER', msg.subject);
  return { ...result, subject: msg.subject };
}

module.exports = { later, notifyApplicationReceived, notifyInterview, sendOfferLetter, INTERVIEW_STAGES };
