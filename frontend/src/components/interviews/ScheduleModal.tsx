'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { InterviewEvent, STAGE_META, toLocalInput } from './interviewFormat';

interface Props {
  /** Current interview to (re)schedule — from the calendar or the "Not scheduled yet" list */
  event: InterviewEvent;
  interviewers: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function ScheduleModal({ event: e, interviewers, onClose, onSaved }: Props) {
  const isReschedule = !!e.start;
  const [form, setForm] = useState({
    interviewAt: toLocalInput(e.start),
    interviewer: e.interviewer || '',
    interviewMode: e.mode || 'Online',
    location: e.location || '',
    note: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.scheduleInterview(e.applicationId, form);
      onSaved(res.message);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const input = 'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onSubmit={submit}
        onKeyDown={(ev) => ev.key === 'Escape' && onClose()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">{isReschedule ? 'Reschedule interview' : 'Schedule interview'}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {STAGE_META[e.stage]?.label} · {e.candidate.fullName} · {e.job.title}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-600">
            Date & time <span className="text-amber-600">*</span>
          </span>
          <input type="datetime-local" required value={form.interviewAt} onChange={(ev) => set({ interviewAt: ev.target.value })} className={input} />
          <span className="block text-[10px] text-slate-400">Interviews are blocked for one hour (WIB).</span>
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-600">
            Interviewer <span className="text-amber-600">*</span>
          </span>
          <input required list="interviewer-options" value={form.interviewer} onChange={(ev) => set({ interviewer: ev.target.value })} className={input} placeholder="Name of the interviewer" />
          <datalist id="interviewer-options">
            {interviewers.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-slate-600">Mode</span>
            <select value={form.interviewMode} onChange={(ev) => set({ interviewMode: ev.target.value })} className={input}>
              <option>Online</option>
              <option>Onsite</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-slate-600">{form.interviewMode === 'Online' ? 'Meeting link / app' : 'Location'}</span>
            <input
              value={form.location}
              onChange={(ev) => set({ location: ev.target.value })}
              className={input}
              placeholder={form.interviewMode === 'Online' ? 'e.g. Google Meet link' : 'e.g. Meeting Room 3'}
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-600">{isReschedule ? 'Reason for rescheduling' : 'Note'}</span>
          <input value={form.note} onChange={(ev) => set({ note: ev.target.value })} className={input} placeholder={isReschedule ? 'e.g. interviewer on leave' : 'Optional'} />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-amber-700 min-w-0 truncate" role="alert">
            {error}
          </p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isReschedule ? 'Save new time' : 'Schedule'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
