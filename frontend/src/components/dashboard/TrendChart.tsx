'use client';

import React from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { CHART, axisTick, fmtWeek } from './chartTheme';

type Point = { weekStart: string; applications: number; hired: number; rejected: number; partial?: boolean };

const SERIES = [
  { key: 'applications', label: 'Applications', color: CHART.blue },
  { key: 'hired', label: 'Hired', color: CHART.emerald },
  { key: 'rejected', label: 'Rejected', color: CHART.amber }
] as const;

function TrendTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: Point = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-[11px]">
      <p className="font-bold text-slate-900 mb-1">Week {fmtWeek(p.weekStart)}{p.partial ? ' (in progress)' : ''}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
          <b className="text-slate-900 tabular-nums">{p[s.key]}</b>
        </p>
      ))}
    </div>
  );
}

/** Weekly applications vs outcomes — one y-axis (all counts) */
export default function TrendChart({ data: raw }: { data: Point[] }) {
  const data = raw.map((p, i) => (i === raw.length - 1 ? { ...p, partial: true } : p));
  const totals = SERIES.map((s) => ({ ...s, total: data.reduce((n, p) => n + p[s.key], 0) }));

  return (
    <div className="h-full flex flex-col">
      {/* Legend doubles as a summary (identity is never color-only) */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3">
        {totals.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="w-3 h-[3px] rounded-full" style={{ background: s.color }} />
            {s.label}
            <b className="text-slate-900 tabular-nums">{s.total}</b>
          </span>
        ))}
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="appsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.18} />
                <stop offset="100%" stopColor={CHART.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="weekStart" tickFormatter={fmtWeek} tick={axisTick} tickLine={false} axisLine={{ stroke: CHART.grid }} minTickGap={16} />
            <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: CHART.slate, strokeDasharray: '3 3' }} />
            <Area type="monotone" dataKey="applications" stroke={CHART.blue} strokeWidth={2} fill="url(#appsFill)" isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="hired" stroke={CHART.emerald} strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
            {/* The current week is still filling up — flag it so the drop isn't read as a decline */}
            {data.length > 0 && (
              <ReferenceLine
                x={data[data.length - 1].weekStart}
                stroke={CHART.slate}
                strokeDasharray="2 3"
                label={{ value: 'current week', position: 'insideTopRight', fontSize: 10, fill: CHART.axis }}
              />
            )}
            <Line type="monotone" dataKey="rejected" stroke={CHART.amber} strokeWidth={2} strokeDasharray="4 3" dot={false} isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
