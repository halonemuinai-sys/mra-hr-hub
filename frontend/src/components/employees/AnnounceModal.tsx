'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Megaphone, X } from 'lucide-react';
import { api } from '@/lib/api';
import { announcementDraft, fmtDate } from './employeeFormat';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';

interface Props {
  employee: any;
  onClose: () => void;
  onSaved: (employee: any, message: string) => void;
}

/** Publish, edit or withdraw an employee's "Welcome Aboard" announcement */
export default function AnnounceModal({ employee, onClose, onSaved }: Props) {
  const announced = !!employee.announcedAt;
  const [message, setMessage] = useState<string>(
    employee.announcementMessage || announcementDraft({ ...employee, joinDate: String(employee.joinDate || '').slice(0, 10) })
  );
  const [busy, setBusy] = useState<'save' | 'withdraw' | null>(null);
  const [error, setError] = useState('');

  const run = async (kind: 'save' | 'withdraw') => {
    setBusy(kind);
    setError('');
    try {
      const res = kind === 'save' ? await api.announceEmployee(employee.id, message) : await api.withdrawAnnouncement(employee.id);
      onSaved(res.data, res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">{announced ? 'New employee announcement' : 'Announce new employee'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {announced ? `Live on the Welcome Aboard board since ${fmtDate(employee.announcedAt)}.` : 'Shown on the Welcome Aboard board and in the bell of every HR HUB user.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={1000}
          autoFocus
          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
        />

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Preview</p>
          <AnnouncementCard item={{ ...employee, announcementMessage: message, announcedAt: employee.announcedAt || new Date().toISOString() }} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {announced && (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => run('withdraw')}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 disabled:opacity-50 flex items-center gap-1"
              >
                {busy === 'withdraw' && <Loader2 className="w-3 h-3 animate-spin" />}
                Withdraw announcement
              </button>
            )}
            {error && <p className="text-[11px] text-amber-700 truncate" role="alert">{error}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              disabled={!message.trim() || !!busy}
              onClick={() => run('save')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {busy === 'save' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {announced ? 'Save changes' : 'Announce now'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
