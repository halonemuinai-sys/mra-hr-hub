'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { STAGE_COLORS, firstName } from './teamTheme';
import { CHART, axisTick } from '@/components/dashboard/chartTheme';

function WorkloadTooltip({ active, payload, capacity }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-[11px] min-w-[180px]">
      <p className="font-bold text-slate-900">{row.fullName}</p>
      <p className="text-slate-500 mb-1">
        {row.total} aktif · {Math.round((row.total / capacity) * 100)}% kapasitas
      </p>
      {STAGE_COLORS.filter((s) => row[s.key]).map((s) => (
        <p key={s.key} className="flex justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
          <b className="text-slate-900 tabular-nums">{row[s.key]}</b>
        </p>
      ))}
    </div>
  );
}

/** Active candidates per recruiter, stacked by stage, against the per-person capacity line */
export default function WorkloadChart({ members, capacity }: { members: any[]; capacity: number }) {
  const data = members
    .filter((m) => m.isActive)
    .map((m) => ({ name: firstName(m.name), fullName: m.name, total: m.activeCount, ...m.byStage }))
    .sort((a, b) => b.total - a.total);
  const max = Math.max(capacity + 2, ...data.map((d) => d.total + 1));

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
        {STAGE_COLORS.map((s) => (
          <span key={s.key} className="flex items-center gap-1 text-[10px] text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[10px] text-slate-600">
          <span className="w-3 border-t-2 border-dashed border-amber-600" />
          Kapasitas {capacity}
        </span>
      </div>
      <div className="flex-1" style={{ minHeight: Math.max(160, data.length * 44 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 4 }} barCategoryGap="28%">
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, max]} allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ ...axisTick, fontSize: 11, fill: CHART.ink }} tickLine={false} axisLine={false} width={64} />
            <Tooltip content={<WorkloadTooltip capacity={capacity} />} cursor={{ fill: '#f1f5f9' }} />
            {STAGE_COLORS.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="load"
                fill={s.color}
                stroke="#fff"
                strokeWidth={1}
                isAnimationActive={false}
                radius={i === STAGE_COLORS.length - 1 ? [0, 4, 4, 0] : 0}
              />
            ))}
            <ReferenceLine
              x={capacity}
              stroke={CHART.amber}
              strokeDasharray="4 3"
              strokeWidth={2}
              label={{ value: 'kapasitas', position: 'top', fontSize: 10, fill: CHART.amber }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
