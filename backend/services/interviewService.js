/**
 * Interview calendar — turns applications + their activity log into interview events. Pure (no DB).
 *
 * An interview = one visit of an application to INTERVIEW_HR / INTERVIEW_USER. Its schedule comes from the
 * stage-gate form of the move into the stage (stageData.interviewAt / interviewer | hiringManager /
 * interviewMode), overridden by later INTERVIEW_SCHEDULED activities (reschedules) during the same visit.
 *
 * Status per event:
 *   UPCOMING          still in the stage, time in the future
 *   AWAITING_OUTCOME  still in the stage, time has passed (needs a decision)
 *   COMPLETED         left the stage after the interview time (outcome = next stage)
 *   CANCELLED         left the stage before the interview took place
 *   UNSCHEDULED       in the stage without a date (returned separately)
 */

const INTERVIEW_STAGES = ['INTERVIEW_HR', 'INTERVIEW_USER'];
const DURATION_MIN = 60;
const MOVE_ACTIONS = ['STAGE_CHANGE', 'INTERVIEW_SCHEDULED'];

/** "2026-10-10T10:00" (datetime-local, local time) or ISO → Date, or null */
function parseWhen(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

function scheduleFrom(data = {}) {
  return {
    interviewAt: data.interviewAt || null,
    interviewer: data.interviewer || data.hiringManager || null,
    mode: data.interviewMode || data.mode || null,
    location: data.location || null,
    note: data.note || null
  };
}

/**
 * @param {object[]} applications  { id, status, candidate, job, assignedRecruiter, activities: [{ id, action, toStatus, stageData, createdAt, actor }] }
 * @param {Date} [now]
 * @returns {{ events: object[], unscheduled: object[] }}
 */
function buildInterviews(applications, now = new Date()) {
  const events = [];
  const unscheduled = [];

  applications.forEach((app) => {
    const acts = [...(app.activities || [])]
      .filter((a) => MOVE_ACTIONS.includes(a.action))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    acts.forEach((a, i) => {
      if (a.action !== 'STAGE_CHANGE' || !INTERVIEW_STAGES.includes(a.toStatus)) return;
      // The visit lasts until the next stage change
      const rest = acts.slice(i + 1);
      const leave = rest.find((x) => x.action === 'STAGE_CHANGE');
      const within = rest.filter((x) => x.action === 'INTERVIEW_SCHEDULED' && (!leave || new Date(x.createdAt) < new Date(leave.createdAt)));
      const last = within[within.length - 1];
      const sched = { ...scheduleFrom(a.stageData || {}), ...(last ? stripEmpty(scheduleFrom(last.stageData || {})) : {}) };
      const at = parseWhen(sched.interviewAt);
      const current = !leave && app.status === a.toStatus;

      const base = {
        id: last ? last.id : a.id,
        applicationId: app.id,
        stage: a.toStatus,
        candidate: app.candidate,
        job: app.job,
        pic: app.assignedRecruiter || null,
        scheduledBy: (last || a).actor || null,
        scheduledAt: (last || a).createdAt,
        rescheduled: within.length,
        current,
        interviewAt: sched.interviewAt,
        interviewer: sched.interviewer,
        mode: sched.mode,
        location: sched.location,
        note: sched.note
      };

      if (!at) {
        if (current) unscheduled.push({ ...base, status: 'UNSCHEDULED' });
        return;
      }
      let status;
      let outcome = null;
      if (current) status = at > now ? 'UPCOMING' : 'AWAITING_OUTCOME';
      else if (leave) {
        outcome = leave.toStatus;
        status = new Date(leave.createdAt) < at ? 'CANCELLED' : 'COMPLETED';
      } else status = 'COMPLETED';
      events.push({ ...base, status, outcome, start: at.toISOString(), end: new Date(at.getTime() + DURATION_MIN * 60000).toISOString() });
    });
  });

  markConflicts(events);
  events.sort((a, b) => new Date(a.start) - new Date(b.start));
  return { events, unscheduled };
}

function stripEmpty(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== ''));
}

/** Same interviewer, overlapping hour, both still open → conflict */
function markConflicts(events) {
  const open = events.filter((e) => e.status === 'UPCOMING' || e.status === 'AWAITING_OUTCOME');
  open.forEach((e) => (e.conflictWith = []));
  for (let i = 0; i < open.length; i++) {
    for (let j = i + 1; j < open.length; j++) {
      const a = open[i];
      const b = open[j];
      if (!a.interviewer || norm(a.interviewer) !== norm(b.interviewer)) continue;
      if (new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end)) {
        a.conflictWith.push(b.id);
        b.conflictWith.push(a.id);
      }
    }
  }
  events.forEach((e) => (e.conflict = !!(e.conflictWith && e.conflictWith.length)));
}

/** Counts for the KPI strip and the interviewer load list */
function summarize(events, unscheduled, now = new Date()) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const weekStart = new Date(startOfDay);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
  const inRange = (e, a, b) => new Date(e.start) >= a && new Date(e.start) < b && e.status !== 'CANCELLED';

  const load = new Map();
  events
    .filter((e) => inRange(e, weekStart, weekEnd) && e.interviewer)
    .forEach((e) => {
      const key = norm(e.interviewer);
      const row = load.get(key) || { name: e.interviewer, count: 0, conflicts: 0 };
      row.count++;
      if (e.conflict) row.conflicts++;
      load.set(key, row);
    });

  return {
    today: events.filter((e) => inRange(e, startOfDay, endOfDay)).length,
    thisWeek: events.filter((e) => inRange(e, weekStart, weekEnd)).length,
    awaitingOutcome: events.filter((e) => e.status === 'AWAITING_OUTCOME').length,
    conflicts: events.filter((e) => e.conflict).length,
    unscheduled: unscheduled.length,
    interviewersThisWeek: [...load.values()].sort((a, b) => b.count - a.count)
  };
}

/** Validates a schedule / reschedule request */
function sanitizeSchedule(body = {}, now = new Date()) {
  const errors = [];
  const at = parseWhen(body.interviewAt);
  if (!at) errors.push('Interview date & time is required.');
  else if (at < new Date(now.getTime() - 86400000)) errors.push('Interview time cannot be in the past.');
  const interviewer = String(body.interviewer || '').trim().slice(0, 120);
  if (!interviewer) errors.push('Interviewer is required.');
  const mode = String(body.interviewMode || '').trim();
  if (mode && !['Online', 'Onsite'].includes(mode)) errors.push('Mode must be Online or Onsite.');
  return {
    errors,
    data: {
      interviewAt: String(body.interviewAt || '').slice(0, 25),
      interviewer,
      interviewMode: mode || null,
      location: String(body.location || '').trim().slice(0, 200) || null,
      note: String(body.note || '').trim().slice(0, 500) || null
    }
  };
}

module.exports = { INTERVIEW_STAGES, DURATION_MIN, buildInterviews, summarize, sanitizeSchedule, parseWhen };
