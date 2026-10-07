'use client';

import React from 'react';
import { KanbanSquare, ShieldCheck } from 'lucide-react';

interface Props {
  approvalsCount: number;
  onOpenApprovals: () => void;
  stats: { active: number; stale: number; offering: number; hired: number };
  /** Show placeholders until the first load */
  loading: boolean;
}

/** Page title, Approvals button and the four headline counters */
export default function PipelineHeader({ approvalsCount, onOpenApprovals, stats, loading }: Props) {
  const tiles = [
    { label: 'Active', value: stats.active, cls: 'text-slate-900' },
    { label: 'Stalled', value: stats.stale, cls: 'text-amber-600' },
    { label: 'Offering', value: stats.offering, cls: 'text-emerald-600' },
    { label: 'Hired', value: stats.hired, cls: 'text-emerald-700' }
  ];

  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <KanbanSquare className="w-6 h-6 text-blue-600" />
          Applicant Pipeline
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Claim candidates from the queue, then drag cards to change stage • click an avatar to multi-select (Shift for a range)
        </p>
      </div>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={onOpenApprovals}
          className={`relative px-4 rounded-xl border shadow-xs text-xs font-bold flex items-center gap-2 transition-colors ${
            approvalsCount ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Approvals
          {approvalsCount > 0 && (
            <span className="min-w-5 h-5 px-1 rounded-md bg-white text-blue-700 text-[11px] flex items-center justify-center tabular-nums">
              {approvalsCount}
            </span>
          )}
        </button>
        <div className="grid grid-cols-4 gap-2 text-center">
          {tiles.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-xs">
              <p className={`text-lg font-black tabular-nums ${s.cls}`}>{loading ? '…' : s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
