'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, XCircle, Archive, ArrowRightLeft, Hand, LogOut, UserPlus } from 'lucide-react';
import { ALL_STAGES } from './stages';
import { shortName } from './ownership';

interface Props {
  count: number;
  /** Some selected cards are unassigned and the user can claim them */
  claimableCount: number;
  /** Selected cards the user may release (own, or any for leads) */
  releasableCount: number;
  canMove: boolean;
  recruiters: any[] | null; // non-null only for TA Lead
  onMove: (status: string) => void;
  onClaim: () => void;
  onRelease: () => void;
  onAssign: (recruiterId: string) => void;
  onClear: () => void;
}

const btn = 'px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5';

export default function BulkActionBar({
  count,
  claimableCount,
  releasableCount,
  canMove,
  recruiters,
  onMove,
  onClaim,
  onRelease,
  onAssign,
  onClear
}: Props) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-3xl"
    >
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold mr-auto">
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-lg bg-blue-600 mr-2 tabular-nums">
            {count}
          </span>
          dipilih
        </span>

        {claimableCount > 0 && (
          <button type="button" onClick={onClaim} className={`${btn} !bg-emerald-600 hover:!bg-emerald-700`}>
            <Hand className="w-3.5 h-3.5" />
            Ambil ({claimableCount})
          </button>
        )}

        {recruiters && (
          <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl pl-2.5">
            <UserPlus className="w-3.5 h-3.5 text-slate-400" />
            <select
              value=""
              onChange={(e) => e.target.value && onAssign(e.target.value)}
              className="bg-transparent text-xs font-semibold py-1.5 pr-2 focus:outline-none cursor-pointer max-w-[160px]"
              aria-label="Tugaskan ke recruiter"
            >
              <option value="" className="text-slate-900">Tugaskan ke…</option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id} className="text-slate-900">
                  {shortName(r.name)} ({r.activeCount} aktif)
                </option>
              ))}
            </select>
          </div>
        )}

        {canMove && (
          <>
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
            <button type="button" onClick={() => onMove('TALENT_POOL')} className={btn}>
              <Archive className="w-3.5 h-3.5 text-slate-400" />
              Talent Pool
            </button>
            <button type="button" onClick={() => onMove('REJECTED')} className={btn}>
              <XCircle className="w-3.5 h-3.5 text-amber-400" />
              Tolak
            </button>
          </>
        )}

        {releasableCount > 0 && (
          <button type="button" onClick={onRelease} className={btn} title="Kembalikan ke antrean Belum Diambil">
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            Lepas ({releasableCount})
          </button>
        )}

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
