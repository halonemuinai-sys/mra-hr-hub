'use client';

import React from 'react';
import Link from 'next/link';
import { AlertOctagon, AlertTriangle, Info, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Reminder } from './useReminders';

const STYLE = {
  critical: { Icon: AlertOctagon, chip: 'bg-amber-600 text-white', ring: 'border-amber-200 bg-amber-50/60', label: 'Mendesak' },
  warning: { Icon: AlertTriangle, chip: 'bg-amber-100 text-amber-800', ring: 'border-amber-100 bg-white', label: 'Perlu perhatian' },
  info: { Icon: Info, chip: 'bg-blue-50 text-blue-700', ring: 'border-slate-200 bg-white', label: 'Info' }
} as const;

interface Props {
  items: Reminder[];
  loading: boolean;
  isUnseen?: (r: Reminder) => boolean;
  onNavigate?: () => void;
  compact?: boolean;
}

/** Shared list for the header bell and the dashboard Action Center */
export default function ReminderList({ items, loading, isUnseen, onNavigate, compact }: Props) {
  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
        <p className="text-xs font-bold text-slate-800 mt-2">Semua beres</p>
        <p className="text-[11px] text-slate-500">Tidak ada tindakan yang menunggu Anda.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((r) => {
        const s = STYLE[r.severity];
        const unseen = isUnseen?.(r);
        return (
          <li key={r.id}>
            <Link
              href={r.href}
              onClick={onNavigate}
              className={`group flex items-start gap-3 p-3 rounded-xl border transition-colors hover:border-blue-300 hover:bg-blue-50/40 ${s.ring}`}
            >
              <span className={`relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.chip}`}>
                <s.Icon className="w-4 h-4" />
                {unseen && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 leading-snug">{r.title}</span>
                </span>
                {!compact && <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{r.detail}</span>}
                <span className="block text-[10px] font-semibold text-slate-400 mt-1">{s.label}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0 mt-2" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
