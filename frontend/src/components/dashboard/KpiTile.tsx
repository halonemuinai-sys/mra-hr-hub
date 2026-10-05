'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { CHART } from './chartTheme';

interface Props {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  /** % change vs previous period; null = no baseline */
  delta?: number | null;
  /** true when a rising number is bad (e.g. stalled candidates) */
  invertDelta?: boolean;
  spark?: { label: string; value: number }[];
  tone?: 'blue' | 'emerald' | 'amber';
}

const TONE = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100'
};

export default function KpiTile({ label, value, hint, icon: Icon, delta, invertDelta, spark, tone = 'blue' }: Props) {
  const good = delta == null || delta === 0 ? null : invertDelta ? delta < 0 : delta > 0;
  const DeltaIcon = delta == null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-2 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{label}</p>
        <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${TONE[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{value}</p>
        {delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              good === null ? 'bg-slate-100 text-slate-500' : good ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
            title="Dibanding 30 hari sebelumnya"
          >
            <DeltaIcon className="w-3 h-3" />
            {delta == null ? 'n/a' : `${Math.abs(delta)}%`}
          </span>
        )}
      </div>
      {spark && spark.length > 1 ? (
        <div className="h-9 -mx-1" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <Tooltip
                cursor={false}
                contentStyle={{ fontSize: 11, borderRadius: 8, padding: '4px 8px' }}
                formatter={(v: number) => [v, 'Lamaran']}
                labelFormatter={(_, p) => (p && p[0] ? `Minggu ${p[0].payload.label}` : '')}
              />
              <Area type="monotone" dataKey="value" stroke={CHART.blue} strokeWidth={2} fill={CHART.blueSoft} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        hint && <p className="text-[11px] text-slate-500">{hint}</p>
      )}
      {spark && hint && <p className="text-[11px] text-slate-500 -mt-1">{hint}</p>}
    </div>
  );
}
