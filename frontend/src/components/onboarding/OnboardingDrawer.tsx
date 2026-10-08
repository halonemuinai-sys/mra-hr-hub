'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck2, Check, ListChecks, Loader2, MinusCircle, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getInitials } from '@/components/pipeline/stages';
import { daysFromToday, dueLabel, fmtDue, OWNER_META, toDateInput } from './onboardingFormat';

const shortName = (n?: string | null) => String(n || '').replace(/\s*\(.*\)\s*$/, '');

interface Props {
  employeeId: string;
  onClose: () => void;
  /** After any change, so the list refreshes its progress */
  onChanged: () => void;
}

/** One new employee's checklist, grouped by phase */
export default function OnboardingDrawer({ employeeId, onClose, onChanged }: Props) {
  const [v, setV] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', phase: 'FIRST_WEEK', owner: 'HR', dueDate: '' });
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const load = useCallback(() => {
    api.getOnboardingChecklist(employeeId)
      .then((res: any) => setV(res.data))
      .catch((err: any) => setError(err.message));
  }, [employeeId]);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<any>) => {
    setBusy(key);
    setError('');
    try {
      const res = await fn();
      if (res?.data) setV(res.data);
      onChanged();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const emp = v?.employee;
  const p = v?.progress;
  const probationLeft = daysFromToday(emp?.probationEndDate);
  const input = 'px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative w-full max-w-2xl h-full bg-slate-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 pt-5 pb-4 relative">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600" />
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center shrink-0">{getInitials(emp?.fullName)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 flex items-center gap-1.5">
                <ListChecks className="w-3 h-3" /> Onboarding
              </p>
              <h3 className="text-base font-black truncate">{emp?.fullName || 'Loading…'}</h3>
              {emp && (
                <p className="text-[11px] text-slate-300 truncate">
                  {emp.position} · {emp.company?.name || emp.division} · joins {fmtDue(emp.joinDate)}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {p && p.status !== 'NOT_STARTED' && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                <span>
                  <b className="text-white">{p.done}</b> of {p.total} tasks done{p.overdue ? ` · ${p.overdue} overdue` : ''}
                </span>
                <span className="font-black text-white tabular-nums">{p.percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div className={`h-full rounded-full ${p.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${p.percent}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{error}</p>}
          {!v && !error && <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />}

          {v && p.status === 'NOT_STARTED' && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-12 text-center">
              <ListChecks className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800 mt-2">No onboarding checklist yet</p>
              <p className="text-xs text-slate-500 mt-1">Create it from the standard template — due dates follow the join date.</p>
              {v.canManage && (
                <button
                  type="button"
                  disabled={busy === 'start'}
                  onClick={() => run('start', () => api.startOnboarding(employeeId))}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {busy === 'start' && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Start onboarding
                </button>
              )}
            </div>
          )}

          {v && emp.probationEndDate && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Probation ends</p>
                <p className="text-sm font-black text-slate-900">
                  {fmtDue(emp.probationEndDate)}
                  {probationLeft !== null && (
                    <span className={`ml-2 text-[11px] font-bold ${probationLeft <= 14 ? 'text-amber-700' : 'text-slate-500'}`}>
                      {probationLeft >= 0 ? `${probationLeft} days left` : `ended ${-probationLeft} days ago`}
                    </span>
                  )}
                </p>
              </div>
              {v.canManage && (
                <input
                  type="date"
                  defaultValue={toDateInput(emp.probationEndDate)}
                  onBlur={(e) => e.target.value && e.target.value !== toDateInput(emp.probationEndDate) && run('probation', () => api.setProbationEnd(employeeId, e.target.value))}
                  className={input}
                  aria-label="Change probation end date"
                  title="Change the probation end — open probation tasks move with it"
                />
              )}
            </section>
          )}

          {v &&
            p.status !== 'NOT_STARTED' &&
            v.phases.map((ph: any) => {
              const tasks = v.tasks.filter((t: any) => t.phase === ph.key);
              if (!tasks.length) return null;
              const doneCount = tasks.filter((t: any) => t.status === 'DONE').length;
              return (
                <section key={ph.key} className="bg-white rounded-2xl border border-slate-200/80">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{ph.label}</h4>
                    <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                      {doneCount}/{tasks.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {tasks.map((t: any) => {
                      const done = t.status === 'DONE';
                      const skipped = t.status === 'SKIPPED';
                      const n = daysFromToday(t.dueDate);
                      const overdue = !done && !skipped && n !== null && n < 0;
                      const owner = OWNER_META[t.owner] || OWNER_META.HR;
                      return (
                        <li key={t.id} className="px-4 py-2.5">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              disabled={!t.canUpdate || busy === t.id}
                              onClick={() => run(t.id, () => api.updateOnboardingTask(t.id, { status: done ? 'TODO' : 'DONE' }))}
                              aria-label={done ? 'Mark as not done' : 'Mark as done'}
                              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors disabled:cursor-not-allowed ${
                                done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-blue-500 bg-white'
                              } ${!t.canUpdate ? 'opacity-50' : ''}`}
                            >
                              {busy === t.id ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : done ? <Check className="w-3.5 h-3.5" /> : null}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs ${done ? 'text-slate-400 line-through' : skipped ? 'text-slate-400 italic' : 'text-slate-800 font-semibold'}`}>
                                {t.title}
                                {skipped && <span className="not-italic ml-1 text-[10px] font-bold text-slate-400">(skipped)</span>}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded border font-bold ${owner.cls}`}>{owner.label}</span>
                                {v.canManage && !done && !skipped ? (
                                  <input
                                    type="date"
                                    defaultValue={toDateInput(t.dueDate)}
                                    onBlur={(e) => e.target.value !== toDateInput(t.dueDate) && run(t.id, () => api.updateOnboardingTask(t.id, { dueDate: e.target.value || null }))}
                                    className={`px-1 py-0.5 rounded border text-[10px] tabular-nums ${overdue ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-600'}`}
                                    aria-label="Due date"
                                  />
                                ) : (
                                  <span className="text-slate-500 tabular-nums">{fmtDue(t.dueDate)}</span>
                                )}
                                {!done && !skipped && t.dueDate && <span className={`font-bold ${overdue ? 'text-amber-700' : n === 0 ? 'text-blue-700' : 'text-slate-400'}`}>{dueLabel(t.dueDate)}</span>}
                                {done && t.completedBy && (
                                  <span className="text-emerald-700 font-semibold">
                                    Done by {shortName(t.completedBy.name)} · {fmtDue(t.completedAt)}
                                  </span>
                                )}
                              </div>
                              {t.note && noteFor !== t.id && <p className="mt-1 text-[11px] text-slate-600 italic">“{t.note}”</p>}
                              {noteFor === t.id && (
                                <div className="mt-1.5 flex gap-1.5">
                                  <input autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)} className={`${input} flex-1`} placeholder="Add a note…" />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (await run(t.id, () => api.updateOnboardingTask(t.id, { note: noteText }))) setNoteFor(null);
                                    }}
                                    className="px-2.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold"
                                  >
                                    Save
                                  </button>
                                  <button type="button" onClick={() => setNoteFor(null)} className="px-2 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-500">
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                            {t.canUpdate && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNoteFor(t.id);
                                    setNoteText(t.note || '');
                                  }}
                                  className="px-1.5 py-1 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100"
                                >
                                  Note
                                </button>
                                {v.canManage && !done && (
                                  <button
                                    type="button"
                                    onClick={() => run(t.id, () => api.updateOnboardingTask(t.id, { status: skipped ? 'TODO' : 'SKIPPED' }))}
                                    title={skipped ? 'Restore this task' : 'Not needed for this employee'}
                                    className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <MinusCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {v.canManage && !t.templateKey && (
                                  <button
                                    type="button"
                                    onClick={() => run(t.id, () => api.deleteOnboardingTask(t.id))}
                                    title="Remove this custom task"
                                    className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}

          {v && p.status !== 'NOT_STARTED' && v.canManage && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4">
              {!adding ? (
                <button type="button" onClick={() => setAdding(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add a task for this employee
                </button>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await run('add', () => api.addOnboardingTask(employeeId, newTask))) {
                      setAdding(false);
                      setNewTask({ title: '', phase: 'FIRST_WEEK', owner: 'HR', dueDate: '' });
                    }
                  }}
                  className="space-y-2"
                >
                  <input required autoFocus value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className={`${input} w-full`} placeholder="e.g. Parking pass, uniform, sales system training…" />
                  <div className="flex flex-wrap gap-2">
                    <select value={newTask.phase} onChange={(e) => setNewTask({ ...newTask, phase: e.target.value })} className={input} aria-label="Phase">
                      {v.phases.map((ph: any) => (
                        <option key={ph.key} value={ph.key}>
                          {ph.label}
                        </option>
                      ))}
                    </select>
                    <select value={newTask.owner} onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })} className={input} aria-label="Owner team">
                      {v.owners.map((o: any) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className={input} aria-label="Due date" />
                    <div className="ml-auto flex gap-2">
                      <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
                        Cancel
                      </button>
                      <button type="submit" disabled={busy === 'add'} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-50">
                        Add task
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </section>
          )}

          {v && p.status === 'COMPLETED' && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <CalendarCheck2 className="w-4 h-4" /> Onboarding complete — every task is done or skipped.
            </p>
          )}
          {v && !v.canManage && p.status !== 'NOT_STARTED' && (
            <p className="text-[11px] text-slate-500">As line manager you can tick the Manager tasks. Other tasks are handled by HR, IT, GA and Payroll.</p>
          )}
        </div>
      </motion.aside>
    </div>
  );
}
