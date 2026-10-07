'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, Pencil, MapPin, Clock, GraduationCap, Wallet, Sparkles, KanbanSquare, Power, Trash2, Users, Loader2, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { getScoreBadge } from '@/lib/utils';
import { internalSalaryLabel } from '@/lib/jobSalary';
import { ACTIVE_STAGES, CLOSED_STAGES } from '@/components/pipeline/stages';
import { STAGE_NAME } from '@/components/dashboard/chartTheme';

interface Props {
  jobId: string;
  onClose: () => void;
  onEdit: (job: any) => void;
  /** Called after toggle/delete so the list refreshes */
  onChanged: (message: string, closeDrawer?: boolean) => void;
  onError: (message: string) => void;
}

const STAGE_LABEL: Record<string, string> = { ...STAGE_NAME, REJECTED: 'Rejected', TALENT_POOL: 'Talent Pool' };

export default function JobDetailDrawer({ jobId, onClose, onEdit, onChanged, onError }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [busy, setBusy] = useState<'toggle' | 'delete' | null>(null);

  const load = () =>
    api.getJobForManagement(jobId)
      .then((res: any) => res.success && setData(res.data))
      .catch((err: any) => onError(err.message));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const job = data?.job;
  const s = data?.summary;

  const toggleActive = async () => {
    setBusy('toggle');
    try {
      await api.updateJob(job.id, { isActive: !job.isActive });
      await load();
      onChanged(job.isActive ? 'Job closed on the career portal.' : 'Job reopened on the career portal.');
    } catch (err: any) {
      onError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete job "${job.title}" permanently?`)) return;
    setBusy('delete');
    try {
      const res = await api.deleteJob(job.id);
      onChanged(res.message, true);
    } catch (err: any) {
      onError(err.message);
      setBusy(null);
    }
  };

  const stages = [...ACTIVE_STAGES, ...CLOSED_STAGES];
  const maxStage = Math.max(1, ...stages.map((st) => s?.byStatus?.[st.key] || 0));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col"
      >
        {!job ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-slate-900 text-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold">{job.department}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${job.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300'}`}>
                      {job.isActive ? 'Live on portal' : 'Closed'}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold leading-snug">{job.title}</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">{[job.company?.name || 'No company (PT) set', job.division].join(' · ')}</p>
                  {job.manpowerRequest && (
                    <a
                      href="/admin/manpower"
                      className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold"
                      title={`Requested by ${job.manpowerRequest.requestedBy?.name || '—'}`}
                    >
                      From {job.manpowerRequest.requestNo} · {job.manpowerRequest.headcount} headcount
                    </a>
                  )}
                </div>
                <button type="button" onClick={onClose} aria-label="Close job details" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300"><MapPin className="w-3.5 h-3.5 text-blue-400" />{job.location}</span>
                <span className="flex items-center gap-1.5 text-slate-300"><Clock className="w-3.5 h-3.5 text-blue-400" />{job.employmentType} · min. {job.minExperience} years</span>
                <span className="flex items-center gap-1.5 text-slate-300"><GraduationCap className="w-3.5 h-3.5 text-blue-400" />Min. {job.minEducation}</span>
                <span className="flex items-center gap-1.5 text-slate-300 col-span-2">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  Hiring Manager: {job.hiringManager ? job.hiringManager.name : <span className="text-amber-300">not assigned (all hiring managers)</span>}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Wallet className="w-3.5 h-3.5 text-blue-400" />
                  {internalSalaryLabel(job)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-4">
              {/* Applicant summary */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Applicants ({s.total})
                  </h3>
                  {s.total > 0 && (
                    <Link href={`/admin/pipeline?jobId=${job.id}`} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <KanbanSquare className="w-3.5 h-3.5" /> View Pipeline
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Active', value: s.active },
                    { label: 'Hired', value: s.hired },
                    { label: 'Average ATS', value: s.avgAts != null ? `${s.avgAts}%` : '—' }
                  ].map((t) => (
                    <div key={t.label} className="rounded-xl border border-slate-200 p-2.5">
                      <p className="text-lg font-black text-slate-900 tabular-nums">{t.value}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{t.label}</p>
                    </div>
                  ))}
                </div>
                {s.total > 0 ? (
                  <div className="space-y-1.5">
                    {stages.map((st) => {
                      const n = s.byStatus[st.key] || 0;
                      if (!n) return null;
                      return (
                        <div key={st.key} className="grid grid-cols-[100px_1fr_24px] items-center gap-2 text-xs">
                          <span className="text-slate-600 truncate">{STAGE_LABEL[st.key]}</span>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${st.dot}`} style={{ width: `${(n / maxStage) * 100}%` }} />
                          </div>
                          <b className="text-right tabular-nums text-slate-900">{n}</b>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No applicants for this job yet.</p>
                )}
              </section>

              {data.topCandidates.length > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Top-scoring candidates</h3>
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {data.topCandidates.map((a: any) => {
                      const badge = getScoreBadge(Math.round(a.atsScore));
                      return (
                        <li key={a.id} className="px-3 py-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{a.candidate.fullName}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {STAGE_LABEL[a.status]}
                              {a.assignedRecruiter ? ` · PIC ${a.assignedRecruiter.name.replace(/\s*\(.*\)\s*$/, '')}` : ' · unassigned'}
                            </p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold tabular-nums ${badge.class}`}>{Math.round(a.atsScore)}%</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {/* ATS criteria */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> ATS criteria
                </h3>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Must-have</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.mustHaveSkills.length ? (
                    job.mustHaveSkills.map((k: string, i: number) => (
                      <span key={`${k}-${i}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[11px] font-semibold">{k}</span>
                    ))
                  ) : (
                    <span className="text-[11px] text-amber-700">No keywords configured for ATS scoring.</span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Nice-to-have</p>
                <div className="flex flex-wrap gap-1">
                  {job.niceToHaveSkills.length ? (
                    job.niceToHaveSkills.map((k: string, i: number) => (
                      <span key={`${k}-${i}`} className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold">{k}</span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</h3>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{job.description || '—'}</p>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Requirements</h3>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{job.requirements || '—'}</p>
              </section>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onEdit(job)} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Edit Job
              </button>
              <button
                type="button"
                onClick={toggleActive}
                disabled={!!busy}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-60"
              >
                {busy === 'toggle' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                {job.isActive ? 'Close' : 'Reopen'}
              </button>
              {s.total === 0 && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={!!busy}
                  className="p-2 rounded-xl border border-slate-300 text-slate-500 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 disabled:opacity-60"
                  title="Delete permanently (only jobs without applicants)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </motion.aside>
    </div>
  );
}
