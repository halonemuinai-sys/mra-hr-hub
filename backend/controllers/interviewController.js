/**
 * Interview calendar.
 *   GET  /api/interviews?from=YYYY-MM-DD&to=YYYY-MM-DD&companyId=&jobId=&stage=&interviewer=&mine=1
 *        → { events, unscheduled, summary }                                         pipeline.view (HM scope)
 *   POST /api/interviews/:applicationId/schedule  { interviewAt, interviewer, interviewMode, location, note }
 *        → schedule / reschedule the current interview (INTERVIEW_SCHEDULED activity) — PIC or TA Lead
 * Events are derived from the activity log by services/interviewService.js.
 */
const prisma = require('../api/db');
const { hasPermission } = require('../config/permissions');
const { applicationScope, canAccessJob } = require('../services/hiringManagerScope');
const { companyFilterValue } = require('./companyController');
const { INTERVIEW_STAGES, buildInterviews, summarize, sanitizeSchedule } = require('../services/interviewService');
const { later, notifyInterview } = require('../services/mail/applicantMail');

const DAY = 86400000;
const LOOKBACK_DAYS = 180;
const shortName = (n) => String(n || '').replace(/\s*\(.*\)\s*$/, '');
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

const APP_SELECT = {
  id: true,
  status: true,
  assignedRecruiterId: true,
  candidate: { select: { id: true, fullName: true, headline: true, email: true, phone: true } },
  job: { select: { id: true, title: true, hiringManagerId: true, company: { select: { id: true, code: true, name: true } } } },
  assignedRecruiter: { select: { id: true, name: true } },
  activities: {
    where: { action: { in: ['STAGE_CHANGE', 'INTERVIEW_SCHEDULED'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, action: true, toStatus: true, stageData: true, createdAt: true, actor: { select: { id: true, name: true } } }
  }
};

/** Local calendar day "YYYY-MM-DD" → Date at local midnight */
function day(v, fallback) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : fallback;
}

/** May this user (re)schedule this application's interview? PIC or TA Lead */
const canSchedule = (user, app) => hasPermission(user, 'pipeline.move.any') || (!!app.assignedRecruiterId && app.assignedRecruiterId === user.id);

async function listInterviews(req, res) {
  try {
    const user = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = day(req.query.from, new Date(today.getTime() - 7 * DAY));
    const to = new Date(day(req.query.to, new Date(today.getTime() + 35 * DAY)).getTime() + DAY); // inclusive
    if (to - from > 400 * DAY) return res.status(400).json({ success: false, message: 'Pick a range of at most 400 days.' });

    const jobWhere = {};
    const pt = companyFilterValue(req.query.companyId);
    if (pt !== undefined) jobWhere.companyId = pt;
    if (req.query.jobId) jobWhere.id = String(req.query.jobId);
    const scope = applicationScope(user);
    const where = {
      ...scope,
      ...(Object.keys(jobWhere).length ? { job: { ...(scope.job || {}), ...jobWhere } } : {}),
      OR: [
        { status: { in: INTERVIEW_STAGES } },
        { activities: { some: { action: 'STAGE_CHANGE', toStatus: { in: INTERVIEW_STAGES }, createdAt: { gte: new Date(from.getTime() - LOOKBACK_DAYS * DAY) } } } }
      ]
    };
    const apps = await prisma.jobApplication.findMany({ where, select: APP_SELECT });
    const { events, unscheduled } = buildInterviews(apps, new Date());

    // Filters on the derived events
    const me = norm(shortName(user.name));
    const keep = (e) =>
      (!INTERVIEW_STAGES.includes(req.query.stage) || e.stage === req.query.stage) &&
      (!req.query.interviewer || norm(e.interviewer) === norm(req.query.interviewer)) &&
      (req.query.mine !== '1' || (e.pic && e.pic.id === user.id) || (me && norm(e.interviewer).includes(me)));
    const inWindow = events.filter((e) => keep(e) && new Date(e.start) >= from && new Date(e.start) < to);
    const openList = unscheduled.filter(keep);
    const actions = (e) => ({ schedule: e.current && canSchedule(user, { assignedRecruiterId: e.pic && e.pic.id }) });

    return res.json({
      success: true,
      data: {
        from: from.toISOString(),
        to: to.toISOString(),
        events: inWindow.map((e) => ({ ...e, actions: actions(e) })),
        unscheduled: openList.map((e) => ({ ...e, actions: actions(e) })),
        // KPIs over everything visible (not just the window), so "today" / "awaiting" stay correct
        summary: summarize(events.filter(keep), openList),
        interviewers: [...new Set(events.map((e) => e.interviewer).filter(Boolean))].sort((a, b) => a.localeCompare(b))
      }
    });
  } catch (error) {
    console.error('Error listing interviews:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function scheduleInterview(req, res) {
  try {
    const app = await prisma.jobApplication.findUnique({ where: { id: String(req.params.applicationId) }, select: APP_SELECT });
    if (!app || !canAccessJob(req.user, app.job)) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (!INTERVIEW_STAGES.includes(app.status)) {
      return res.status(409).json({ success: false, message: 'Only candidates in Interview HR or Interview User can be scheduled.' });
    }
    if (!canSchedule(req.user, app)) {
      return res.status(403).json({ success: false, message: 'Only the candidate’s PIC or a TA Lead can schedule this interview.' });
    }
    const { data, errors } = sanitizeSchedule(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    const hadSchedule = buildInterviews([app]).events.some((e) => e.current);
    await prisma.applicationActivity.create({
      data: {
        applicationId: app.id,
        actorId: req.user.id,
        action: 'INTERVIEW_SCHEDULED',
        fromStatus: app.status,
        toStatus: app.status,
        note: data.note,
        stageData: data
      }
    });
    const fresh = await prisma.jobApplication.findUnique({ where: { id: app.id }, select: APP_SELECT });
    const event = buildInterviews([fresh]).events.find((e) => e.current);
    // E-mail the candidate the (new) schedule; mode / location fall back to the merged schedule of this visit
    later(() =>
      notifyInterview(app.id, {
        stage: app.status,
        schedule: { ...data, interviewMode: data.interviewMode || (event && event.mode), location: data.location || (event && event.location) },
        reschedule: hadSchedule,
        actorId: req.user.id
      })
    );
    return res.json({
      success: true,
      message: `${hadSchedule ? 'Interview rescheduled' : 'Interview scheduled'} for ${app.candidate.fullName}.`,
      data: event ? { ...event, actions: { schedule: true } } : null
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listInterviews, scheduleInterview };
