'use client';

import React from 'react';
import { ACTIVE_STAGES } from '@/components/pipeline/stages';

/** Stacked bar of a recruiter's active holdings by funnel stage (hover a segment for detail) */
export default function StageMixBar({ byStage, total }: { byStage: Record<string, number>; total: number }) {
  if (!total) return <div className="h-2 rounded-full bg-slate-100" title="No active candidates" />;

  return (
    <div className="flex h-2 gap-[2px] rounded-full overflow-hidden bg-slate-100" role="img" aria-label="Stage distribution">
      {ACTIVE_STAGES.map((s) => {
        const n = byStage[s.key] || 0;
        if (!n) return null;
        return (
          <div
            key={s.key}
            className={`${s.dot} h-full first:rounded-l-full last:rounded-r-full hover:opacity-80`}
            style={{ width: `${(n / total) * 100}%` }}
            title={`${s.label}: ${n} candidates`}
          />
        );
      })}
    </div>
  );
}

export function StageMixLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
      {ACTIVE_STAGES.map((s) => (
        <span key={s.key} className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-sm ${s.dot}`} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
