'use client';

import React from 'react';
import { getScoreBadge } from '@/lib/utils';

type Job = {
  id: string;
  title: string;
  division: string;
  isActive: boolean;
  applicants: number;
  active: number;
  inInterview: number;
  hired: number;
  avgAts: number | null;
};

export default function TopJobsTable({ jobs }: { jobs: Job[] }) {
  const max = Math.max(1, ...jobs.map((j) => j.applicants));
  if (!jobs.length) return <p className="text-xs text-slate-400 py-6 text-center">Belum ada lamaran.</p>;

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-slate-500 text-left">
            <th className="px-1 pb-2 font-bold">Lowongan</th>
            <th className="px-1 pb-2 font-bold w-[34%]">Pelamar</th>
            <th className="px-1 pb-2 font-bold text-center">Interview</th>
            <th className="px-1 pb-2 font-bold text-center">Hired</th>
            <th className="px-1 pb-2 font-bold text-right">Avg ATS</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => {
            const badge = j.avgAts !== null ? getScoreBadge(j.avgAts) : null;
            return (
              <tr key={j.id} className="border-t border-slate-100">
                <td className="px-1 py-2.5 max-w-[220px]">
                  <p className="font-bold text-slate-900 truncate" title={j.title}>{j.title}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {j.division}
                    {!j.isActive && ' · ditutup'}
                  </p>
                </td>
                <td className="px-1 py-2.5">
                  <div className="flex items-center gap-2" title={`${j.applicants} pelamar · ${j.active} masih aktif`}>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-600" style={{ width: `${(j.active / max) * 100}%` }} />
                      <div className="h-full bg-blue-200" style={{ width: `${((j.applicants - j.active) / max) * 100}%` }} />
                    </div>
                    <b className="tabular-nums text-slate-900 w-6 text-right">{j.applicants}</b>
                  </div>
                </td>
                <td className="px-1 py-2.5 text-center tabular-nums text-slate-700">{j.inInterview}</td>
                <td className="px-1 py-2.5 text-center tabular-nums font-bold text-emerald-700">{j.hired}</td>
                <td className="px-1 py-2.5 text-right">
                  {badge ? (
                    <span className={`inline-flex px-1.5 py-0.5 rounded-md border text-[10px] font-bold tabular-nums ${badge.class}`}>{j.avgAts}%</span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-slate-500 flex items-center gap-3">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />Masih aktif</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-200" />Selesai / arsip</span>
      </p>
    </div>
  );
}
