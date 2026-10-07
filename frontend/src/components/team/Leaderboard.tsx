'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, Download, ArrowDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ROLE_LABELS } from '@/lib/permissions';
import { getInitials } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import { CHART } from '@/components/dashboard/chartTheme';
import { formatHours, formatRelative } from './teamFormat';
import { loadTone, toCsv, downloadCsv } from './teamTheme';

type SortKey = 'activeCount' | 'staleCount' | 'moves' | 'advanceRate' | 'hired' | 'avgClaimHours' | 'slaRate';

const metric = (m: any, key: SortKey) =>
  ['moves', 'advanceRate', 'hired', 'avgClaimHours'].includes(key) ? m.period[key] : m[key];

interface Props {
  members: any[];
  days: number;
  capacity: number;
  onSelect: (m: any) => void;
}

export default function Leaderboard({ members, days, capacity, onSelect }: Props) {
  const [sort, setSort] = useState<SortKey>('moves');
  const [showInactive, setShowInactive] = useState(false);

  const rows = members
    .filter((m) => showInactive || m.isActive)
    .sort((a, b) => {
      const x = metric(a, sort);
      const y = metric(b, sort);
      // Lower is better for claim speed and stalled count; unknown values last
      if (sort === 'avgClaimHours' || sort === 'staleCount') return (x ?? Infinity) - (y ?? Infinity);
      return (y ?? -1) - (x ?? -1);
    });
  const inactive = members.filter((m) => !m.isActive).length;

  const exportCsv = () => {
    const header = ['Recruiter', 'Role', 'Aktif', `Utilisasi (kap. ${capacity})`, 'Tertahan', 'SLA %', `Pindah tahap (${days}h)`, 'Maju tahap %', 'Interview', 'Offering', 'Diterima', 'Ditolak', 'Kecepatan ambil (jam)', 'Terakhir aktif'];
    const body = rows.map((m) => [
      shortName(m.name), m.role, m.activeCount, m.utilization, m.staleCount, m.slaRate,
      m.period.moves, m.period.advanceRate, m.period.interviews, m.period.offerings, m.period.hired, m.period.rejected,
      m.period.avgClaimHours, m.lastActiveAt ? new Date(m.lastActiveAt).toISOString() : ''
    ]);
    downloadCsv(`kinerja-tim-ta-${days}hari.csv`, toCsv([header, ...body]));
  };

  const Th = ({ k, children, className = '' }: { k?: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={`px-3 py-2.5 font-bold whitespace-nowrap ${className}`}>
      {k ? (
        <button type="button" onClick={() => setSort(k)} className={`uppercase tracking-wider inline-flex items-center gap-0.5 ${sort === k ? 'text-blue-600' : 'hover:text-slate-800'}`}>
          {children}
          {sort === k && <ArrowDown className="w-3 h-3" />}
        </button>
      ) : (
        children
      )}
    </th>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-3 mb-3">
        {inactive > 0 && (
          <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600" />
            Tampilkan nonaktif ({inactive})
          </label>
        )}
        <button type="button" onClick={exportCsv} className="px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Ekspor CSV
        </button>
      </div>

      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-xs min-w-[920px]">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 text-left">
              <th className="pl-5 pr-2 py-2.5 font-bold w-8">#</th>
              <Th>Recruiter</Th>
              <Th k="activeCount">Beban kerja</Th>
              <Th k="slaRate" className="text-center">SLA</Th>
              <Th k="moves">Aktivitas ({days}h)</Th>
              <Th k="advanceRate" className="text-center">Maju tahap</Th>
              <Th k="hired" className="text-center">Hired</Th>
              <Th k="avgClaimHours" className="text-center">Kecepatan ambil</Th>
              <Th>Terakhir aktif</Th>
              <th className="pr-5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => {
              const tone = loadTone(m.utilization);
              const spark = m.series.map((s: any) => ({ v: s.moves }));
              return (
                <tr key={m.id} onClick={() => onSelect(m)} className={`border-t border-slate-100 cursor-pointer hover:bg-blue-50/40 ${m.isActive ? '' : 'opacity-60'}`}>
                  <td className="pl-5 pr-2 py-3 font-black text-slate-400 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        {getInitials(shortName(m.name))}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{shortName(m.name)}</p>
                        <p className="text-[10px] text-slate-500">{ROLE_LABELS[m.role] || m.role}{!m.isActive && ' · nonaktif'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 min-w-[170px]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span><b className="text-slate-900 tabular-nums">{m.activeCount}</b><span className="text-slate-400"> / {capacity}</span></span>
                      <span className={`font-semibold ${tone.text}`}>{m.utilization ?? 0}% · {tone.label}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, m.utilization || 0)}%` }} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {m.slaRate == null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span className="inline-flex flex-col items-center">
                        <b className={`tabular-nums ${m.slaRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>{m.slaRate}%</b>
                        {m.staleCount > 0 && (
                          <span className="text-[10px] text-amber-700 flex items-center gap-0.5" title={`${m.staleCount} tertahan ≥7 hari · ${m.criticalCount} ≥14 hari`}>
                            <AlertTriangle className="w-3 h-3" />
                            {m.staleCount} tertahan
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <b className="tabular-nums text-slate-900 w-6 text-right">{m.period.moves}</b>
                      <div className="w-24 h-7" aria-hidden title="Perpindahan tahap per periode">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={spark} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                            <Area type="monotone" dataKey="v" stroke={CHART.blue} strokeWidth={1.5} fill="#dbeafe" dot={false} isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums text-slate-700">{m.period.advanceRate != null ? `${m.period.advanceRate}%` : '—'}</td>
                  <td className="px-3 py-3 text-center">
                    <b className="tabular-nums text-emerald-700">{m.period.hired}</b>
                    {m.period.offerings > 0 && <span className="block text-[10px] text-slate-500">{m.period.offerings} offering</span>}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-700 whitespace-nowrap">{formatHours(m.period.avgClaimHours)}</td>
                  <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{formatRelative(m.lastActiveAt)}</td>
                  <td className="pr-5"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
