'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { STAGE_NAME } from './chartTheme';

type Row = { stage: string; count: number; avgDays: number | null; stale: number };

const STALE_DAYS = 7;

/** Average days candidates have sat in each stage — bars past the 7-day line are bottlenecks */
export default function StageAgingChart({ rows }: { rows: Row[] }) {
  const max = Math.max(STALE_DAYS * 1.5, ...rows.map((r) => r.avgDays || 0));
  const thresholdPct = (STALE_DAYS / max) * 100;

  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const over = (r.avgDays || 0) >= STALE_DAYS;
        return (
          <div
            key={r.stage}
            className="grid grid-cols-[110px_1fr_92px] items-center gap-2 text-xs"
            title={`${r.count} kandidat · rata-rata ${r.avgDays ?? 0} hari · ${r.stale} tertahan ≥${STALE_DAYS} hari`}
          >
            <span className="font-semibold text-slate-700 truncate">{STAGE_NAME[r.stage]}</span>
            <div className="relative h-4 bg-slate-100 rounded">
              <div
                className={`h-full rounded ${over ? 'bg-amber-600' : 'bg-blue-600'}`}
                style={{ width: `${r.count ? Math.max(2, ((r.avgDays || 0) / max) * 100) : 0}%` }}
              />
              {/* 7-day threshold */}
              <div className="absolute -top-1 -bottom-1 border-l-2 border-dashed border-slate-400" style={{ left: `${thresholdPct}%` }} />
            </div>
            <span className="text-right tabular-nums text-[11px]">
              <b className={over ? 'text-amber-700' : 'text-slate-900'}>{r.count ? `${r.avgDays} hari` : '—'}</b>
              {r.stale > 0 && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-amber-700 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  {r.stale}
                </span>
              )}
            </span>
          </div>
        );
      })}
      <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />Normal</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-600" />Rata-rata ≥{STALE_DAYS} hari</span>
        <span className="flex items-center gap-1"><span className="w-3 border-t-2 border-dashed border-slate-400" />Batas {STALE_DAYS} hari</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-700" />Jumlah tertahan</span>
      </div>
    </div>
  );
}
