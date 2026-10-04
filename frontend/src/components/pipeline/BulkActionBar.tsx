'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, XCircle, Archive, ArrowRightLeft } from 'lucide-react';
import { ALL_STAGES } from './stages';

interface Props {
  count: number;
  onMove: (status: string) => void;
  onClear: () => void;
}

export default function BulkActionBar({ count, onMove, onClear }: Props) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-2xl"
    >
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold mr-auto">
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-lg bg-blue-600 mr-2 tabular-nums">
            {count}
          </span>
          kandidat dipilih
        </span>

        <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl pl-2.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          <select
            value=""
            onChange={(e) => e.target.value && onMove(e.target.value)}
            className="bg-transparent text-xs font-semibold py-1.5 pr-2 focus:outline-none cursor-pointer"
            aria-label="Pindahkan kandidat terpilih"
          >
            <option value="" className="text-slate-900">Pindah ke…</option>
            {ALL_STAGES.map((s) => (
              <option key={s.key} value={s.key} className="text-slate-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onMove('TALENT_POOL')}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
        >
          <Archive className="w-3.5 h-3.5 text-slate-400" />
          Talent Pool
        </button>
        <button
          type="button"
          onClick={() => onMove('REJECTED')}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5 text-amber-400" />
          Tolak
        </button>
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title="Batalkan pilihan (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
