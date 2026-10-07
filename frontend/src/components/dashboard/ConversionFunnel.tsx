'use client';

import React from 'react';
import { ArrowDown } from 'lucide-react';
import { STAGE_NAME } from './chartTheme';

type Step = { stage: string; current: number; reached: number; conversion: number | null };

const BAR = ['bg-amber-500', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-emerald-500', 'bg-emerald-600'];

/**
 * "Reached" = applications that got to this stage at some point (current position or history),
 * so conversion between steps reflects real progress, not just today's snapshot.
 */
export default function ConversionFunnel({ steps, archived }: { steps: Step[]; archived: { rejected: number; talentPool: number } }) {
  const max = Math.max(1, ...steps.map((s) => s.reached));
  const weakest = steps
    .filter((s) => s.conversion !== null)
    .reduce<Step | null>((w, s) => (!w || (s.conversion ?? 100) < (w.conversion ?? 100) ? s : w), null);

  return (
    <div className="space-y-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.stage}>
          {i > 0 && (
            <div className="flex items-center gap-2 pl-[118px] h-4">
              <ArrowDown className="w-3 h-3 text-slate-300" />
              <span
                className={`text-[10px] font-bold tabular-nums ${
                  weakest && weakest.stage === s.stage ? 'text-amber-700' : 'text-slate-500'
                }`}
                title={`Conversion from ${STAGE_NAME[steps[i - 1].stage]} to ${STAGE_NAME[s.stage]}`}
              >
                {s.conversion ?? '–'}% progressed
                {weakest && weakest.stage === s.stage && ' · weakest conversion'}
              </span>
            </div>
          )}
          <div className="grid grid-cols-[110px_1fr_64px] items-center gap-2 text-xs group" title={`${s.reached} reached this stage · ${s.current} currently here`}>
            <span className="font-semibold text-slate-700 break-words">{STAGE_NAME[s.stage]}</span>
            <div className="h-6 bg-slate-100 rounded-md overflow-hidden relative">
              <div className={`h-full ${BAR[i]} rounded-md transition-all duration-500 group-hover:opacity-85`} style={{ width: `${Math.max(2, (s.reached / max) * 100)}%` }} />
            </div>
            <span className="text-right tabular-nums">
              <b className="text-slate-900">{s.reached}</b>
              <span className="text-slate-400 text-[10px]"> ({s.current} now)</span>
            </span>
          </div>
        </React.Fragment>
      ))}
      <div className="pt-3 mt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-between text-[11px] text-slate-500">
        <span>Archived: {archived.rejected} rejected · {archived.talentPool} talent pool</span>
        <span>Bars show candidates who reached each stage</span>
      </div>
    </div>
  );
}
