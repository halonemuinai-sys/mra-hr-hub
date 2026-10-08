/**
 * Onboarding checklist rules — building the checklist, progress, permissions, input. Pure (no DB), unit-tested.
 */
const { hasPermission } = require('../config/permissions');
const { PHASES, OWNERS, DEFAULT_TASKS } = require('../config/onboardingTasks');

const DAY = 86400000;
const STATUSES = ['TODO', 'DONE', 'SKIPPED'];
const PROBATION_MONTHS = 3;

/** Date-only (UTC midnight) n days from d */
const plusDays = (d, n) => {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate() + n));
};

/** Join date + 3 months (same day of month, clamped to the month's end) */
function defaultProbationEnd(joinDate) {
  const j = new Date(joinDate);
  const y = j.getUTCFullYear();
  const m = j.getUTCMonth() + PROBATION_MONTHS;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(j.getUTCDate(), last)));
}

/**
 * Tasks for a new employee from the template.
 * @param {{ joinDate: Date, employmentStatus: string, probationEndDate?: Date }} employee
 * @returns {object[]} rows for OnboardingTask (without employeeId)
 */
function buildChecklist(employee, template = DEFAULT_TASKS) {
  const probationEnd = employee.probationEndDate || (employee.employmentStatus === 'PROBATION' ? defaultProbationEnd(employee.joinDate) : null);
  return template
    .filter((t) => !t.only || t.only.includes(employee.employmentStatus))
    .filter((t) => !t.fromProbationEnd || probationEnd)
    .map((t, i) => ({
      templateKey: t.key,
      title: t.title,
      phase: t.phase,
      owner: t.owner,
      dueDate: plusDays(t.fromProbationEnd ? probationEnd : employee.joinDate, t.offset),
      status: 'TODO',
      sortOrder: (i + 1) * 10
    }));
}

const isOpen = (t) => t.status === 'TODO';
const isOverdue = (t, now = new Date()) => isOpen(t) && t.dueDate && new Date(t.dueDate).getTime() < plusDays(now, 0).getTime();

/** Progress of one checklist */
function progressOf(tasks, now = new Date()) {
  const counted = tasks.filter((t) => t.status !== 'SKIPPED');
  const done = counted.filter((t) => t.status === 'DONE').length;
  const open = tasks.filter(isOpen).sort((a, b) => new Date(a.dueDate || 8.64e15) - new Date(b.dueDate || 8.64e15));
  const overdue = tasks.filter((t) => isOverdue(t, now)).length;
  const status = !tasks.length ? 'NOT_STARTED' : open.length ? 'IN_PROGRESS' : 'COMPLETED';
  return {
    status,
    total: counted.length,
    done,
    percent: counted.length ? Math.round((done / counted.length) * 100) : 0,
    overdue,
    nextTask: open[0] ? { id: open[0].id, title: open[0].title, dueDate: open[0].dueDate, owner: open[0].owner, overdue: isOverdue(open[0], now) } : null
  };
}

/**
 * Who may tick / edit a task: HR & TA (employee.manage) any task;
 * Hiring Managers the line-manager tasks of employees they can see.
 */
function canUpdateTask(user, task) {
  if (hasPermission(user, 'employee.manage')) return true;
  return user.role === 'HIRING_MANAGER' && task.owner === 'MANAGER';
}

const canManageChecklist = (user) => hasPermission(user, 'employee.manage');

function parseDay(v) {
  if (v === '' || v === null) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
  if (!m) return undefined;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

/** PATCH a task: status / note / dueDate / assigneeId */
function sanitizeTaskUpdate(body = {}) {
  const data = {};
  const errors = [];
  if (body.status !== undefined) {
    const s = String(body.status).toUpperCase();
    if (!STATUSES.includes(s)) errors.push('Status must be TODO, DONE or SKIPPED.');
    else data.status = s;
  }
  if (body.note !== undefined) data.note = String(body.note || '').trim().slice(0, 1000) || null;
  if (body.dueDate !== undefined) {
    const d = parseDay(body.dueDate);
    if (d === undefined) errors.push('Due date is not valid.');
    else data.dueDate = d;
  }
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId ? String(body.assigneeId) : null;
  if (body.title !== undefined) {
    const t = String(body.title || '').trim();
    if (!t) errors.push('Task title is required.');
    else data.title = t.slice(0, 200);
  }
  return { data, errors };
}

/** New custom task */
function sanitizeNewTask(body = {}) {
  const { data, errors } = sanitizeTaskUpdate({ title: body.title ?? '', dueDate: body.dueDate ?? null, note: body.note, assigneeId: body.assigneeId });
  const phase = String(body.phase || 'FIRST_WEEK').toUpperCase();
  const owner = String(body.owner || 'HR').toUpperCase();
  if (!PHASES.some((p) => p.key === phase)) errors.push('Unknown phase.');
  if (!OWNERS.some((o) => o.key === owner)) errors.push('Unknown owner team.');
  return { data: { ...data, phase, owner, status: 'TODO' }, errors };
}

module.exports = {
  PHASES,
  OWNERS,
  STATUSES,
  defaultProbationEnd,
  buildChecklist,
  progressOf,
  isOverdue,
  canUpdateTask,
  canManageChecklist,
  sanitizeTaskUpdate,
  sanitizeNewTask,
  plusDays
};
