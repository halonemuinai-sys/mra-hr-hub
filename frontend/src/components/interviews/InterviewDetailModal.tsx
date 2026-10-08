'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarClock, CalendarPlus, Check, Copy, Download, KanbanSquare, MapPin, MessageCircle, UserRound, Video, X } from 'lucide-react';
import { stageLabel } from '@/components/pipeline/stages';
import {
  candidateInvite,
  downloadIcs,
  fmtDateTime,
  fmtTime,
  googleCalendarUrl,
  InterviewEvent,
  STAGE_META,
  STATUS_META,
  whatsappUrl
} from './interviewFormat';

const shortName = (n?: string | null) => String(n || '').replace(/\s*\(.*\)\s*$/, '');

interface Props {
  event: InterviewEvent;
  onClose: () => void;
  onReschedule: (e: InterviewEvent) => void;
}

export default function InterviewDetailModal({ event: e, onClose, onReschedule }: Props) {
  const [copied, setCopied] = useState(false);
  const st = STATUS_META[e.status];
  const stage = STAGE_META[e.stage];
  const open = e.status === 'UPCOMING' || e.status === 'AWAITING_OUTCOME';
  const wa = whatsappUrl(e);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(candidateInvite(e));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const action = 'px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onKeyDown={(ev) => ev.key === 'Escape' && onClose()}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className={`px-6 py-4 ${e.status === 'UPCOMING' ? stage.solid : 'bg-slate-900 text-white'} border-0`}>
          <div className="flex items-start gap-3">
            <CalendarClock className="w-5 h-5 mt-0.5 shrink-0 opacity-90" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">{stage.label}</p>
              <h3 className="text-base font-black truncate">{e.candidate.fullName}</h3>
              <p className="text-xs opacity-90 truncate">
                {e.job.title}
                {e.job.company ? ` · ${e.job.company.name}` : ''}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/15">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${st.cls}`}>{st.label}</span>
            {e.outcome && <span className="text-[11px] text-slate-500">→ moved to {stageLabel(e.outcome)}</span>}
            {e.rescheduled ? <span className="text-[11px] text-slate-500">· rescheduled {e.rescheduled}×</span> : null}
          </div>

          {e.conflict && (
            <p className="flex items-start gap-2 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {e.interviewer} has another interview in the same hour. Reschedule one of them.
            </p>
          )}
          {e.status === 'AWAITING_OUTCOME' && (
            <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              This interview has passed — move the candidate on (or back) in the pipeline, or reschedule if it did not take place.
            </p>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">When</dt>
              <dd className="font-bold text-slate-900 mt-0.5">
                {fmtDateTime(e.start)} – {fmtTime(e.end)} WIB
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Interviewer</dt>
              <dd className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <UserRound className="w-3.5 h-3.5 text-slate-400" /> {e.interviewer || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mode</dt>
              <dd className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                {e.mode === 'Online' ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
                {e.mode || '—'}
                {e.location ? ` · ${e.location}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">TA PIC</dt>
              <dd className="font-semibold text-slate-800 mt-0.5">{shortName(e.pic?.name) || 'Unassigned'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Candidate contact</dt>
              <dd className="font-semibold text-slate-800 mt-0.5 break-all">{[e.candidate.phone, e.candidate.email].filter(Boolean).join(' · ') || '—'}</dd>
            </div>
            {e.note && (
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Note</dt>
                <dd className="text-slate-700 mt-0.5">{e.note}</dd>
              </div>
            )}
          </dl>

          {open && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Invite</p>
              <div className="flex flex-wrap gap-2">
                <a href={googleCalendarUrl(e)} target="_blank" rel="noreferrer" className={action}>
                  <CalendarPlus className="w-3.5 h-3.5 text-blue-600" /> Google Calendar
                </a>
                <button type="button" onClick={() => downloadIcs(e)} className={action} title="Outlook / Apple Calendar">
                  <Download className="w-3.5 h-3.5 text-blue-600" /> .ics file
                </button>
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className={action}>
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp candidate
                  </a>
                )}
                <button type="button" onClick={copy} className={action}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                  {copied ? 'Copied' : 'Copy invite text'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <Link href={`/admin/pipeline?jobId=${e.job.id}`} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <KanbanSquare className="w-3.5 h-3.5" /> Open in pipeline
          </Link>
          {e.current && e.actions.schedule && (
            <button
              type="button"
              onClick={() => onReschedule(e)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <CalendarClock className="w-3.5 h-3.5" /> Reschedule
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
