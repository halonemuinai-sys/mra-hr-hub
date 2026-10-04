'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { REJECT_REASONS } from './stages';

interface Props {
  count: number;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}

export default function RejectReasonModal({ count, onCancel, onConfirm }: Props) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [detail, setDetail] = useState('');

  const toggle = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const note = [reasons.join(', '), detail.trim()].filter(Boolean).join(' — ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4"
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Mark {count > 1 ? `${count} candidates` : 'candidate'} as rejected
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The reason is saved to the recruiter notes for audit and reporting.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {REJECT_REASONS.map((r) => {
            const active = reasons.includes(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggle(r)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                  active
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Additional notes (optional)…"
          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            Confirm Rejection
          </button>
        </div>
      </motion.div>
    </div>
  );
}
