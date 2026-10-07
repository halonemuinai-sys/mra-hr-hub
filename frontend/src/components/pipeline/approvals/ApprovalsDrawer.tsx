'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck, Check, XCircle, Loader2, ArrowRight, Undo2 } from 'lucide-react';
import { stageLabel } from '../stages';
import { shortName } from '../ownership';
import { formatRelative } from '@/components/team/teamFormat';

interface Props {
  data: { toDecide: any[]; myRequests: any[] } | null;
  loading: boolean;
  onClose: () => void;
  onDecide: (requestId: string, decision: 'APPROVE' | 'REJECT', note: string) => Promise<void>;
  onCancel: (requestId: string) => Promise<void>;
}

const FIELD_LABELS: Record<string, string> = {
  offerSalary: 'Offer',
  startDate: 'Start date',
  hmFeedback: 'HM feedback',
  joinDate: 'Join date',
  offerSigned: 'Offer signed',
  interviewAt: 'Interview',
  interviewer: 'Interviewer',
  hiringManager: 'Hiring manager',
  recommendation: 'Recommendation',
  rating: 'Rating'
};

function formatValue(key: string, v: any) {
  if (key === 'offerSalary') return `IDR ${Number(v).toLocaleString('id-ID')}`;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function RequestSummary({ r }: { r: any }) {
  const data = r.stageData || {};
  const budget = r.application?.job?.salaryMax;
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{r.application?.candidate?.fullName}</p>
          <p className="text-[11px] text-slate-500 truncate">{r.application?.job?.title}</p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{stageLabel(r.fromStatus)}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white">{stageLabel(r.toStatus)}</span>
        </span>
      </div>
      <p className="mt-2 text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5">{r.approvalReason}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className={k === 'hmFeedback' ? 'col-span-2' : ''}>
            <dt className="text-slate-400">{FIELD_LABELS[k] || k}</dt>
            <dd className="font-semibold text-slate-800 break-words">{formatValue(k, v)}</dd>
          </div>
        ))}
        {budget && r.toStatus === 'OFFERING' && (
          <div>
            <dt className="text-slate-400">Job budget (max)</dt>
            <dd className="font-semibold text-slate-800">IDR {Number(budget).toLocaleString('id-ID')}</dd>
          </div>
        )}
      </dl>
      <p className="mt-2 text-[10px] text-slate-400">
        Requested by {shortName(r.requestedBy?.name) || '—'} • {formatRelative(r.createdAt)}
      </p>
    </>
  );
}

function DecideCard({ r, onDecide }: { r: any; onDecide: Props['onDecide'] }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'APPROVE' | 'REJECT' | null>(null);

  const act = async (decision: 'APPROVE' | 'REJECT') => {
    setBusy(decision);
    try {
      await onDecide(r.id, decision, note);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <RequestSummary r={r} />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Decision note (required to reject)…"
        className="mt-2 w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={!!busy || !note.trim()}
          onClick={() => act('REJECT')}
          title={!note.trim() ? 'Add a note to reject' : undefined}
          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {busy === 'REJECT' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 text-amber-600" />}
          Reject
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => act('APPROVE')}
          className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {busy === 'APPROVE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Approve
        </button>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200'
};

export default function ApprovalsDrawer({ data, loading, onClose, onDecide, onCancel }: Props) {
  const toDecide = data?.toDecide || [];
  const mine = data?.myRequests || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Stage Approvals
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading && !data ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Waiting for your decision ({toDecide.length})
                </h3>
                {toDecide.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Nothing to approve right now.</p>
                ) : (
                  <div className="space-y-3">
                    {toDecide.map((r) => (
                      <DecideCard key={r.id} r={r} onDecide={onDecide} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">My requests</h3>
                {mine.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">You haven&apos;t requested any approvals.</p>
                ) : (
                  <div className="space-y-3">
                    {mine.map((r) => (
                      <div key={r.id} className="rounded-xl border border-slate-200 p-3">
                        <RequestSummary r={r} />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${STATUS_STYLE[r.status] || STATUS_STYLE.CANCELLED}`}>
                            {r.status}
                            {r.decidedBy && r.status !== 'PENDING' ? ` by ${shortName(r.decidedBy.name)}` : ''}
                          </span>
                          {r.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => onCancel(r.id)}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                            >
                              <Undo2 className="w-3 h-3" />
                              Withdraw
                            </button>
                          )}
                        </div>
                        {r.decisionNote && <p className="mt-1.5 text-[11px] text-slate-600 italic">“{r.decisionNote}”</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </motion.aside>
    </div>
  );
}
