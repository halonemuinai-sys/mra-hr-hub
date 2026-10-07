'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle2, CircleDot, ClipboardList, KanbanSquare, Loader2, Pencil, Undo2, X, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { shortName } from '@/components/pipeline/ownership';
import { fmtDate } from '@/components/employees/employeeFormat';
import { budgetLabel, progressOf, reasonLabel } from './manpowerFormat';

interface Props {
  requestId: string;
  onClose: () => void;
  onEdit: (request: any) => void;
  onOpenJob: (request: any) => void;
  /** After approve / reject / withdraw */
  onChanged: (message: string) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="text-xs font-semibold text-slate-800 mt-0.5 break-words">{children}</dd>
    </div>
  );
}

/** Request details, timeline and the actions the viewer may take */
export default function ManpowerDetailDrawer({ requestId, onClose, onEdit, onOpenJob, onChanged }: Props) {
  const [r, setR] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api.getManpowerRequest(requestId)
      .then((res: any) => setR(res.data))
      .catch((err: any) => setError(err.message));
  }, [requestId]);

  const run = async (kind: 'APPROVE' | 'REJECT' | 'CANCEL') => {
    if (kind === 'REJECT' && !note.trim()) return setError('Add a note explaining the rejection.');
    setBusy(kind);
    setError('');
    try {
      const res = kind === 'CANCEL' ? await api.cancelManpowerRequest(requestId, note) : await api.decideManpowerRequest(requestId, kind, note);
      onChanged(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const p = r ? progressOf(r) : null;
  const hired = r?.fulfillment?.hired || 0;

  const timeline = r
    ? [
        { done: true, title: `Submitted by ${shortName(r.requestedBy?.name) || '—'}`, at: r.createdAt, Icon: CircleDot },
        r.decidedAt && {
          done: true,
          title: `${r.status === 'REJECTED' ? 'Rejected' : 'Approved'} by ${shortName(r.decidedBy?.name) || '—'}`,
          at: r.decidedAt,
          note: r.decisionNote,
          Icon: r.status === 'REJECTED' ? XCircle : CheckCircle2
        },
        r.status === 'CANCELLED' && { done: true, title: 'Withdrawn', at: r.updatedAt, note: r.decisionNote, Icon: Undo2 },
        r.jobId && { done: true, title: `Opened as job posting: ${r.job?.title}`, at: r.convertedAt, Icon: Briefcase },
        r.jobId && { done: hired >= r.headcount, title: `${hired} of ${r.headcount} hired`, Icon: CheckCircle2 }
      ].filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative w-full max-w-xl h-full bg-slate-50 shadow-2xl flex flex-col"
      >
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono font-bold text-slate-500">{r?.requestNo || '…'}</p>
            <h3 className="text-sm font-bold text-slate-900 truncate">{r ? `${r.positionTitle} × ${r.headcount}` : 'Loading…'}</h3>
            {r && (
              <p className="text-[11px] text-slate-500 truncate">
                {r.company?.name || 'No company'} · {r.department}
              </p>
            )}
          </div>
          {p && <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold ${p.cls}`}>{p.label}</span>}
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!r && !error && <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />}
          {r && (
            <>
              {r.priority === 'URGENT' && (
                <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Marked urgent by the requester.</p>
              )}

              <section className="bg-white rounded-2xl border border-slate-200/80 p-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Row label="Division">{r.division}</Row>
                  <Row label="Location">{r.location}</Row>
                  <Row label="Employment type">{r.employmentType}</Row>
                  <Row label="Target start">{r.targetStartDate ? fmtDate(r.targetStartDate, true) : '—'}</Row>
                  <Row label="Reason">
                    {reasonLabel(r.reason)}
                    {r.replacementFor ? ` — replacing ${r.replacementFor}` : ''}
                  </Row>
                  <Row label="Salary budget / month">{budgetLabel(r.salaryMin, r.salaryMax)}</Row>
                  <Row label="Min. education">{r.minEducation || '—'}</Row>
                  <Row label="Min. experience">{r.minExperience == null ? '—' : `${r.minExperience} yrs`}</Row>
                </dl>
                {r.skills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.skills.map((s: string) => (
                      <span key={s} className="px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Justification</p>
                  <p className="text-xs text-slate-700 mt-1 whitespace-pre-line">{r.justification}</p>
                </div>
              </section>

              {r.jobId && (
                <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900">Recruitment progress</p>
                    <Link href={`/admin/pipeline?jobId=${r.jobId}`} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <KanbanSquare className="w-3.5 h-3.5" /> View in pipeline
                    </Link>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (hired / r.headcount) * 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    <b className="text-slate-800">{hired}</b> of {r.headcount} hired · {r.fulfillment?.active || 0} candidates in process · {r.fulfillment?.applicants || 0} applicants
                  </p>
                </section>
              )}

              <section className="bg-white rounded-2xl border border-slate-200/80 p-4">
                <p className="text-xs font-bold text-slate-900 mb-3">Timeline</p>
                <ol className="relative border-l-2 border-slate-100 ml-2 space-y-3">
                  {timeline.map((t: any, i: number) => (
                    <li key={i} className="pl-5 relative">
                      <span className={`absolute -left-[11px] top-0 w-5 h-5 rounded-md flex items-center justify-center ${t.done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <t.Icon className="w-3 h-3" />
                      </span>
                      <p className="text-xs text-slate-800">{t.title}</p>
                      {t.at && <p className="text-[10px] text-slate-400">{fmtDate(t.at)}</p>}
                      {t.note && <p className="text-[11px] text-slate-600 italic mt-0.5">“{t.note}”</p>}
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </div>

        {r && (r.actions.decide || r.actions.edit || r.actions.cancel || r.actions.openJob) && (
          <div className="bg-white border-t border-slate-200 px-6 py-3 space-y-2">
            {(r.actions.decide || r.actions.cancel) && (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={r.actions.decide ? 'Note for the requester (required to reject)…' : 'Reason for withdrawing (optional)…'}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
              />
            )}
            {error && (
              <p className="text-[11px] text-amber-700" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {r.actions.cancel && (
                <button type="button" disabled={!!busy} onClick={() => run('CANCEL')} className="mr-auto text-[11px] font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50">
                  {busy === 'CANCEL' ? 'Withdrawing…' : 'Withdraw request'}
                </button>
              )}
              {r.actions.edit && (
                <button
                  type="button"
                  onClick={() => onEdit(r)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {r.actions.decide && (
                <>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => run('REJECT')}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {busy === 'REJECT' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => run('APPROVE')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {busy === 'APPROVE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                  </button>
                </>
              )}
              {r.actions.openJob && (
                <button
                  type="button"
                  onClick={() => onOpenJob(r)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" /> Open job posting
                </button>
              )}
            </div>
          </div>
        )}
      </motion.aside>
    </div>
  );
}
