'use client';

import React from 'react';

type Row = { id: string | null; code: string; name: string; openJobs: number; applications: number; active: number; hired: number };

/** Recap per PT; click a row to filter the whole dashboard to that company */
export default function CompanyBreakdown({ rows, onSelect }: { rows: Row[]; onSelect: (id: string) => void }) {
  if (!rows.length) return <p className="text-xs text-slate-400 py-6 text-center">No jobs or applications yet.</p>;
  const max = Math.max(...rows.map((r) => r.applications), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <th className="py-2 pr-3 font-bold">Company (PT)</th>
            <th className="py-2 px-3 font-bold text-right">Open jobs</th>
            <th className="py-2 px-3 font-bold w-[35%]">Applications</th>
            <th className="py-2 px-3 font-bold text-right">Active</th>
            <th className="py-2 pl-3 font-bold text-right">Hired</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={r.id || 'none'}
              onClick={() => onSelect(r.id || 'none')}
              className="cursor-pointer hover:bg-slate-50"
              title="Filter the dashboard to this company"
            >
              <td className="py-2.5 pr-3">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      r.id ? 'bg-slate-900 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {r.id ? r.code : 'NO PT'}
                  </span>
                  <span className="truncate font-semibold text-slate-800">{r.name}</span>
                </span>
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">{r.openJobs}</td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${(r.applications / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums font-bold text-slate-800">{r.applications}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">{r.active}</td>
              <td className="py-2.5 pl-3 text-right tabular-nums font-bold text-emerald-700">{r.hired}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
