'use client';

import React from 'react';
import { ACTIVE_STAGES } from './stages';

/** Thin bar showing how active candidates spread across the funnel stages */
export default function FunnelStrip({ grouped, activeCount }: { grouped: Record<string, any[]>; activeCount: number }) {
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-slate-200/70">
      {ACTIVE_STAGES.map((s) => {
        const n = grouped[s.key]?.length || 0;
        if (!n || !activeCount) return null;
        return <div key={s.key} className={`${s.dot} h-full`} style={{ width: `${(n / activeCount) * 100}%` }} title={`${s.label}: ${n}`} />;
      })}
    </div>
  );
}
