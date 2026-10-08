/**
 * Onboarding checklists of new employees.
 *   GET    /api/onboarding                         → employees + progress + summary          employee.view (HM scope)
 *   GET    /api/onboarding/:employeeId             → checklist                               employee.view (HM scope)
 *   POST   /api/onboarding/:employeeId/start       → create the checklist from the template  employee.manage
 *   POST   /api/onboarding/:employeeId/tasks       → add a custom task                       employee.manage
 *   PATCH  /api/onboarding/:employeeId/probation   → set the probation end (moves its tasks) employee.manage
 *   PATCH  /api/onboarding/tasks/:taskId           → tick / skip / note / due date / assignee (HR & TA; HMs their manager tasks)
 *   DELETE /api/onboarding/tasks/:taskId           → remove a task                           employee.manage
 * Checklists are also created automatically when a hire is registered (employeeController.registerEmployee).
 */
const prisma = require('../api/db');
const { canAccessJob, jobScope } = require('../services/hiringManagerScope');
const { companyFilterValue } = require('./companyController');
const { DEFAULT_TASKS } = require('../config/onboardingTasks');
const {
  PHASES,
  OWNERS,
  buildChecklist,
  progressOf,
  defaultProbationEnd,
  canUpdateTask,
  canManageChecklist,
  sanitizeTaskUpdate,
  sanitizeNewTask,
  plusDays
} = require('../services/onboardingRules');

const DAY = 86400000;
const USER = { select: { id: true, name: true } };
const EMP_SELECT = {
  id: true,
  employeeNo: true,
  fullName: true,
  position: true,
  department: true,
  division: true,
  workLocation: true,
  employmentStatus: true,
  joinDate: true,
  probationEndDate: true,
  managerName: true,
  company: { select: { id: true, code: true, name: true } },
  job: { select: { id: true, title: true, hiringManagerId: true } }
};

const probationEndOf = (e) => e.probationEndDate || (e.employmentStatus === 'PROBATION' ? defaultProbationEnd(e.joinDate) : null);

async function loadEmployee(user, id) {
  const emp = await prisma.employee.findUnique({ where: { id: String(id) }, select: EMP_SELECT });
  if (!emp || !canAccessJob(user, emp.job)) return null;
  return emp;
}

async function listOnboarding(req, res) {
  try {
    const now = new Date();
    const where = {};
    const scope = jobScope(req.user);
    if (scope) where.job = scope;
    const pt = companyFilterValue(req.query.companyId);
    if (pt !== undefined) where.companyId = pt;
    const q = String(req.query.search || '').trim();
    if (q) where.OR = ['fullName', 'employeeNo', 'position', 'department'].map((f) => ({ [f]: { contains: q, mode: 'insensitive' } }));

    const rows = await prisma.employee.findMany({
      where,
      orderBy: { joinDate: 'desc' },
      select: { ...EMP_SELECT, onboardingTasks: { select: { id: true, title: true, owner: true, status: true, dueDate: true } } }
    });

    const today = plusDays(now, 0);
    const list = rows.map(({ onboardingTasks, ...e }) => {
      const probationEnd = probationEndOf(e);
      return {
        ...e,
        probationEndDate: probationEnd,
        probationDaysLeft: probationEnd ? Math.round((new Date(probationEnd) - today) / DAY) : null,
        progress: progressOf(onboardingTasks, now)
      };
    });

    const summary = {
      inProgress: list.filter((e) => e.progress.status === 'IN_PROGRESS').length,
      notStarted: list.filter((e) => e.progress.status === 'NOT_STARTED').length,
      completed: list.filter((e) => e.progress.status === 'COMPLETED').length,
      overdueTasks: list.reduce((n, e) => n + e.progress.overdue, 0),
      startingThisWeek: list.filter((e) => {
        const d = (new Date(e.joinDate) - today) / DAY;
        return d >= 0 && d <= 7;
      }).length,
      probationEnding: list.filter((e) => e.probationDaysLeft !== null && e.probationDaysLeft >= 0 && e.probationDaysLeft <= 30).length
    };

    const status = String(req.query.status || '');
    const filter = String(req.query.filter || '');
    const filtered = list.filter(
      (e) =>
        (!['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status) || e.progress.status === status) &&
        (filter !== 'overdue' || e.progress.overdue > 0) &&
        (filter !== 'probation' || (e.probationDaysLeft !== null && e.probationDaysLeft >= 0 && e.probationDaysLeft <= 30))
    );
    return res.json({ success: true, data: filtered, summary, canManage: canManageChecklist(req.user) });
  } catch (error) {
    console.error('Error listing onboarding:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function checklistView(user, emp) {
  const tasks = await prisma.onboardingTask.findMany({
    where: { employeeId: emp.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { assignee: USER, completedBy: USER }
  });
  return {
    employee: { ...emp, probationEndDate: probationEndOf(emp) },
    tasks: tasks.map((t) => ({ ...t, canUpdate: canUpdateTask(user, t) })),
    progress: progressOf(tasks),
    phases: PHASES,
    owners: OWNERS,
    canManage: canManageChecklist(user)
  };
}

async function getChecklist(req, res) {
  try {
    const emp = await loadEmployee(req.user, req.params.employeeId);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    return res.json({ success: true, data: await checklistView(req.user, emp) });
  } catch (error) {
    console.error('Error loading onboarding checklist:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function startChecklist(req, res) {
  try {
    const emp = await loadEmployee(req.user, req.params.employeeId);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const existing = await prisma.onboardingTask.count({ where: { employeeId: emp.id } });
    if (existing) return res.status(409).json({ success: false, message: 'This employee already has an onboarding checklist.' });

    const probationEndDate = probationEndOf(emp);
    await prisma.$transaction([
      ...(probationEndDate && !emp.probationEndDate ? [prisma.employee.update({ where: { id: emp.id }, data: { probationEndDate } })] : []),
      prisma.onboardingTask.createMany({
        data: buildChecklist({ ...emp, probationEndDate }, DEFAULT_TASKS).map((t) => ({ ...t, employeeId: emp.id }))
      })
    ]);
    const fresh = await loadEmployee(req.user, emp.id);
    return res.status(201).json({ success: true, message: `Onboarding started for ${emp.fullName}.`, data: await checklistView(req.user, fresh) });
  } catch (error) {
    console.error('Error starting onboarding:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function addTask(req, res) {
  try {
    const emp = await loadEmployee(req.user, req.params.employeeId);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const { data, errors } = sanitizeNewTask(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
    const last = await prisma.onboardingTask.findFirst({ where: { employeeId: emp.id }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    await prisma.onboardingTask.create({ data: { ...data, employeeId: emp.id, sortOrder: (last ? last.sortOrder : 0) + 10 } });
    return res.status(201).json({ success: true, message: 'Task added.', data: await checklistView(req.user, emp) });
  } catch (error) {
    console.error('Error adding onboarding task:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function loadTask(user, id) {
  const task = await prisma.onboardingTask.findUnique({ where: { id: String(id) }, include: { employee: { select: EMP_SELECT } } });
  if (!task || !canAccessJob(user, task.employee.job)) return null;
  return task;
}

async function updateTask(req, res) {
  try {
    const task = await loadTask(req.user, req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (!canUpdateTask(req.user, task)) return res.status(403).json({ success: false, message: 'You can only update line-manager tasks.' });
    const { data, errors } = sanitizeTaskUpdate(req.body);
    // Hiring Managers may tick and comment, not re-plan or re-assign
    if (!canManageChecklist(req.user)) ['dueDate', 'assigneeId', 'title'].forEach((k) => delete data[k]);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
    if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'Nothing to update.' });
    if (data.status === 'DONE' && task.status !== 'DONE') Object.assign(data, { completedAt: new Date(), completedById: req.user.id });
    if (data.status && data.status !== 'DONE') Object.assign(data, { completedAt: null, completedById: null });

    await prisma.onboardingTask.update({ where: { id: task.id }, data });
    return res.json({ success: true, message: 'Task updated.', data: await checklistView(req.user, task.employee) });
  } catch (error) {
    console.error('Error updating onboarding task:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await loadTask(req.user, req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    await prisma.onboardingTask.delete({ where: { id: task.id } });
    return res.json({ success: true, message: 'Task removed.', data: await checklistView(req.user, task.employee) });
  } catch (error) {
    console.error('Error deleting onboarding task:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function setProbationEnd(req, res) {
  try {
    const emp = await loadEmployee(req.user, req.params.employeeId);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String((req.body && req.body.probationEndDate) || ''));
    if (!m) return res.status(400).json({ success: false, message: 'Probation end date is required (YYYY-MM-DD).' });
    const end = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (end <= new Date(emp.joinDate)) return res.status(400).json({ success: false, message: 'Probation must end after the join date.' });

    // Move the open probation tasks along with the new end date
    const templ = Object.fromEntries(DEFAULT_TASKS.filter((t) => t.fromProbationEnd).map((t) => [t.key, t.offset]));
    const open = await prisma.onboardingTask.findMany({ where: { employeeId: emp.id, status: 'TODO', templateKey: { in: Object.keys(templ) } }, select: { id: true, templateKey: true } });
    await prisma.$transaction([
      prisma.employee.update({ where: { id: emp.id }, data: { probationEndDate: end } }),
      ...open.map((t) => prisma.onboardingTask.update({ where: { id: t.id }, data: { dueDate: plusDays(end, templ[t.templateKey]) } }))
    ]);
    const fresh = await loadEmployee(req.user, emp.id);
    return res.json({ success: true, message: 'Probation end date updated.', data: await checklistView(req.user, fresh) });
  } catch (error) {
    console.error('Error setting probation end:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listOnboarding, getChecklist, startChecklist, addTask, updateTask, deleteTask, setProbationEnd };
