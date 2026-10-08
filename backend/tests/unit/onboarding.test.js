const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildChecklist, progressOf, defaultProbationEnd, canUpdateTask, sanitizeTaskUpdate, sanitizeNewTask } = require('../../services/onboardingRules');

const join = new Date('2026-10-12T00:00:00Z');
const iso = (d) => new Date(d).toISOString().slice(0, 10);

test('probation ends three months after joining (clamped to month end)', () => {
  assert.equal(iso(defaultProbationEnd(join)), '2027-01-12');
  assert.equal(iso(defaultProbationEnd(new Date('2026-11-30T00:00:00Z'))), '2027-02-28');
});

test('checklist due dates follow the join date; probation tasks only for probation hires', () => {
  const probation = buildChecklist({ joinDate: join, employmentStatus: 'PROBATION' });
  const byKey = Object.fromEntries(probation.map((t) => [t.templateKey, t]));
  assert.equal(iso(byKey.contract.dueDate), '2026-10-07');
  assert.equal(iso(byKey.sign.dueDate), '2026-10-12');
  assert.equal(iso(byKey.bpjs.dueDate), '2026-10-19');
  assert.equal(iso(byKey.probationReview.dueDate), '2027-01-05');
  assert.ok(probation.every((t) => t.status === 'TODO'));

  const permanent = buildChecklist({ joinDate: join, employmentStatus: 'PERMANENT' });
  assert.equal(permanent.some((t) => t.phase === 'PROBATION'), false);
  assert.equal(permanent.length, probation.length - 2);
});

test('progress counts done, skips skipped tasks and finds the next / overdue task', () => {
  const now = new Date('2026-10-14T08:00:00Z');
  const tasks = [
    { id: 'a', title: 'A', owner: 'HR', status: 'DONE', dueDate: '2026-10-10' },
    { id: 'b', title: 'B', owner: 'IT', status: 'TODO', dueDate: '2026-10-11' },
    { id: 'c', title: 'C', owner: 'GA', status: 'SKIPPED', dueDate: '2026-10-11' },
    { id: 'd', title: 'D', owner: 'MANAGER', status: 'TODO', dueDate: '2026-10-20' }
  ];
  const p = progressOf(tasks, now);
  assert.deepEqual([p.status, p.total, p.done, p.percent, p.overdue], ['IN_PROGRESS', 3, 1, 33, 1]);
  assert.equal(p.nextTask.id, 'b');
  assert.equal(p.nextTask.overdue, true);
  assert.equal(progressOf([], now).status, 'NOT_STARTED');
  assert.equal(progressOf([{ ...tasks[0] }], now).status, 'COMPLETED');
});

test('permissions and input', () => {
  assert.equal(canUpdateTask({ role: 'RECRUITER' }, { owner: 'IT' }), true);
  assert.equal(canUpdateTask({ role: 'HIRING_MANAGER' }, { owner: 'MANAGER' }), true);
  assert.equal(canUpdateTask({ role: 'HIRING_MANAGER' }, { owner: 'HR' }), false);
  assert.deepEqual(sanitizeTaskUpdate({ status: 'done', dueDate: '2026-10-20' }).data, { status: 'DONE', dueDate: new Date('2026-10-20T00:00:00Z') });
  assert.equal(sanitizeTaskUpdate({ status: 'maybe' }).errors.length, 1);
  assert.equal(sanitizeNewTask({ title: '', owner: 'CEO' }).errors.length, 2);
  assert.equal(sanitizeNewTask({ title: 'Parking pass', owner: 'ga', phase: 'day_one' }).data.owner, 'GA');
});
