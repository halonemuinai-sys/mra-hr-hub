'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList, CartesianGrid } from 'recharts';
import { CHART, axisTick, SCORE_BAND } from './chartTheme';

type Bucket = { label: string; band: keyof typeof SCORE_BAND; count: number };

export default function ScoreHistogram({ data }: { data: Bucket[] }) {
  const total = data.reduce((n, b) => n + b.count, 0) || 1;
  const byBand = (band: Bucket['band']) => data.filter((b) => b.band === band).reduce((n, b) => n + b.count, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
        {(Object.keys(SCORE_BAND) as Bucket['band'][]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SCORE_BAND[k].color }} />
            {SCORE_BAND[k].label}
            <b className="text-slate-900 tabular-nums">{Math.round((byBand(k) / total) * 100)}%</b>
          </span>
        ))}
      </div>
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: -22 }} barCategoryGap="18%">
            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={0} />
            <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ fontSize: 11, borderRadius: 10 }}
              formatter={(v: number, _n, p: any) => [`${v} applications (${Math.round((v / total) * 100)}%)`, SCORE_BAND[p.payload.band as Bucket['band']].label]}
              labelFormatter={(l) => `ATS score ${l}`}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((b) => (
                <Cell key={b.label} fill={SCORE_BAND[b.band].color} />
              ))}
              <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: CHART.ink, fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
