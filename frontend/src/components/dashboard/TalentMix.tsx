'use client';

import React from 'react';
import { UploadCloud, FileSpreadsheet, PenLine } from 'lucide-react';

const FAMILIES = [
  { key: 'IT_DIGITAL', label: 'IT & Digital' },
  { key: 'RETAIL_OPS', label: 'Retail & Store Ops' },
  { key: 'CORPORATE_SERVICES', label: 'Corporate Services' },
  { key: 'CREATIVE_MEDIA', label: 'Creative & Media' }
];

const SOURCES = [
  { key: 'ATS_RESUME_UPLOAD', label: 'Resume Upload', icon: UploadCloud, color: 'bg-blue-600' },
  { key: 'EXCEL_TEMPLATE', label: 'Excel Template', icon: FileSpreadsheet, color: 'bg-emerald-600' },
  { key: 'MANUAL_INPUT', label: 'Manual Entry', icon: PenLine, color: 'bg-amber-600' }
];

export default function TalentMix({ jobFamily, intakeSource }: { jobFamily: Record<string, number>; intakeSource: Record<string, number> }) {
  const famMax = Math.max(1, ...FAMILIES.map((f) => jobFamily[f.key] || 0));
  const srcTotal = Math.max(1, SOURCES.reduce((n, s) => n + (intakeSource[s.key] || 0), 0));

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        {FAMILIES.map((f) => {
          const n = jobFamily[f.key] || 0;
          return (
            <div key={f.key} className="grid grid-cols-[120px_1fr_28px] items-center gap-2 text-xs">
              <span className="text-slate-700 font-semibold truncate">{f.label}</span>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(n / famMax) * 100}%` }} />
              </div>
              <b className="text-right tabular-nums text-slate-900">{n}</b>
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Application sources</p>
        {/* Part-to-whole: one stacked bar with 2px surface gaps, labelled below */}
        <div className="flex h-3 rounded-full overflow-hidden gap-[2px] bg-white">
          {SOURCES.map((s) => {
            const n = intakeSource[s.key] || 0;
            return n ? <div key={s.key} className={`${s.color} h-full`} style={{ width: `${(n / srcTotal) * 100}%` }} title={`${s.label}: ${n}`} /> : null;
          })}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SOURCES.map((s) => {
            const n = intakeSource[s.key] || 0;
            return (
              <div key={s.key} className="text-[11px]">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className={`w-2 h-2 rounded-sm ${s.color}`} />
                  {s.label}
                </span>
                <b className="text-slate-900 tabular-nums">{n}</b>
                <span className="text-slate-400"> · {Math.round((n / srcTotal) * 100)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
