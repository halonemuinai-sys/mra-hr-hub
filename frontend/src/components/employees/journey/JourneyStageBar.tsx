'use client';

import React from 'react';
import { CornerUpLeft, Trophy } from 'lucide-react';
import { ALL_STAGES, stageLabel } from '@/components/pipeline/stages';

const dotOf = (status: string) => ALL_STAGES.find((s) => s.key === status)?.dot || 'bg-slate-400';
/** 0.4 → "10 hrs", 5.06 → "5.1 days", 38.1 → "38 days" */
const fmtDays = (d: number) =>
  d < 1
    ? `${Math.max(1, Math.round(d * 24))} hrs`
    : `${d.toLocaleString('en-GB', { maximumFractionDigits: d >= 10 ? 0 : 1 })} days`;

/** Proportional bar: how long the candidate spent in each stage visit, applied → hired */
export default function JourneyStageBar({ stages, slowest }: { stages: any[]; slowest?: { status: string; days: number } | null }) {
  const timed = stages.filter((s) => s.days !== null && s.days !== undefined);
  const total = timed.reduce((n, s) => n + s.days, 0) || 1;
  const hired = stages.find((s) => s.status === 'HIRED');

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {timed.map((s, i) => (
          <div
            key={i}
            className={`${dotOf(s.status)} h-full ${slowest && s.status === slowest.status && s.days === slowest.days ? 'ring-2 ring-inset ring-amber-300' : ''}`}
            style={{ width: `${Math.max(2, (s.days / total) * 100)}%` }}
            title={`${stageLabel(s.status)}: ${fmtDays(s.days)}`}
          />
        ))}
      </div>

      <ol className="flex flex-wrap gap-x-1 gap-y-2 text-[10px]">
        {stages.map((s, i) => {
          const isSlowest = slowest && s.status === slowest.status && s.days === slowest.days;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300">›</span>}
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-semibold ${
                  s.status === 'HIRED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : isSlowest
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600'
                }`}
                title={s.backward ? 'Moved back to this stage' : undefined}
              >
                {s.backward ? (
                  <CornerUpLeft className="w-3 h-3 text-amber-600" />
                ) : s.status === 'HIRED' ? (
                  <Trophy className="w-3 h-3" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${dotOf(s.status)}`} />
                )}
                {stageLabel(s.status)}
                {s.days !== null && s.days !== undefined && (
                  <span className="font-normal text-slate-500 tabular-nums">{fmtDays(s.days)}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {!hired && <p className="text-[10px] text-slate-400">Has not reached Hired yet.</p>}
    </div>
  );
}

export { fmtDays };
