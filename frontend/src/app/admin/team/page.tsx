'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw, AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/permissions';
import { getInitials } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import StageMixBar, { StageMixLegend } from '@/components/team/StageMixBar';
import ActivityFeed from '@/components/team/ActivityFeed';
import MemberDetailDrawer from '@/components/team/MemberDetailDrawer';
import { formatHours, formatRelative } from '@/components/team/teamFormat';

const PERIODS = [7, 30, 90];

type SortKey = 'activeCount' | 'moves' | 'hired' | 'staleCount' | 'avgClaimHours';

export default function TeamPerformancePage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortKey>('activeCount');
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [perf, act] = await Promise.all([api.getTeamPerformance(days), api.getTeamActivity({ limit: 25 })]);
      if (perf.success) setData(perf.data);
      if (act.success) setFeed(act.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const team = data?.team;
  const metric = (m: any, key: SortKey) =>
    key === 'moves' || key === 'hired' || key === 'avgClaimHours' ? m.period[key] : m[key];
  const members = (data?.members || [])
    .filter((m: any) => showInactive || m.isActive)
    .sort((a: any, b: any) => {
      const x = metric(a, sort);
      const y = metric(b, sort);
      // Claim speed: faster (lower) first, unknown last
      if (sort === 'avgClaimHours') return (x ?? Infinity) - (y ?? Infinity);
      return (y ?? 0) - (x ?? 0);
    });
  const inactiveCount = (data?.members || []).filter((m: any) => !m.isActive).length;
  const val = (v: any) => (loading && !data ? '…' : v ?? 0);

  const tiles = [
    { label: 'Anggota TA aktif', value: val(team?.members), hint: 'Pemegang kandidat (PIC)' },
    { label: 'Kandidat dipegang', value: val(team?.activeCandidates), hint: `${team?.unassignedCandidates ?? 0} belum diambil` },
    { label: 'Tertahan ≥7 hari', value: val(team?.staleCandidates), hint: 'Perlu ditindaklanjuti', warn: (team?.staleCandidates || 0) > 0 },
    { label: `Diterima (${days}h)`, value: val(team?.hired), hint: `${team?.moves ?? 0} perpindahan tahap` },
    { label: 'Kecepatan ambil', value: loading && !data ? '…' : formatHours(team?.avgClaimHours), hint: 'Rata-rata lamar → diambil' }
  ];

  const headers: { key: SortKey | null; label: string; align?: string }[] = [
    { key: null, label: 'Recruiter' },
    { key: 'activeCount', label: 'Dipegang', align: 'text-center' },
    { key: null, label: 'Distribusi tahap' },
    { key: 'staleCount', label: 'Tertahan', align: 'text-center' },
    { key: 'moves', label: `Pindah (${days}h)`, align: 'text-center' },
    { key: 'hired', label: `Diterima (${days}h)`, align: 'text-center' },
    { key: 'avgClaimHours', label: 'Kecepatan ambil', align: 'text-center' },
    { key: null, label: 'Aktif terakhir' }
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header + period filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Kinerja Tim Talent Acquisition
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Beban kerja saat ini dan hasil kerja tiap recruiter. Klik baris untuk detail & riwayat aktivitas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white border border-slate-200/80 rounded-xl p-1 shadow-xs">
            {PERIODS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  days === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d} hari
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl"
            title="Muat ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-xs font-semibold">
          Gagal memuat data kinerja: {error}
        </div>
      )}

      {/* Team stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.label}</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums mt-1 flex items-center gap-1.5">
              {t.warn && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {t.value}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Leaderboard */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Per Recruiter</h3>
            <div className="flex items-center gap-3">
              <StageMixLegend />
              {inactiveCount > 0 && (
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                  />
                  Tampilkan nonaktif ({inactiveCount})
                </label>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  {headers.map((h) => (
                    <th key={h.label} className={`px-3 py-2.5 font-bold whitespace-nowrap ${h.align || 'text-left'}`}>
                      {h.key ? (
                        <button
                          type="button"
                          onClick={() => setSort(h.key!)}
                          className={`uppercase tracking-wider ${sort === h.key ? 'text-blue-600' : 'hover:text-slate-800'}`}
                        >
                          {h.label}
                          {sort === h.key && ' ↓'}
                        </button>
                      ) : (
                        h.label
                      )}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr>
                    <td colSpan={headers.length + 1} className="px-4 py-8 text-center text-slate-400">
                      Memuat data tim…
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length + 1} className="px-4 py-8 text-center text-slate-400">
                      Belum ada anggota TA.
                    </td>
                  </tr>
                ) : (
                  members.map((m: any) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelected(m)}
                      className={`border-t border-slate-100 cursor-pointer hover:bg-blue-50/40 ${m.isActive ? '' : 'opacity-60'}`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                            {getInitials(shortName(m.name))}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{shortName(m.name)}</p>
                            <p className="text-[10px] text-slate-500">
                              {ROLE_LABELS[m.role] || m.role}
                              {!m.isActive && ' • Nonaktif'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-black text-slate-900 tabular-nums">{m.activeCount}</td>
                      <td className="px-3 py-3 min-w-[140px]">
                        <StageMixBar byStage={m.byStage} total={m.activeCount} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        {m.staleCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {m.staleCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-700 tabular-nums">{m.period.moves}</td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-700 tabular-nums">{m.period.hired}</td>
                      <td className="px-3 py-3 text-center text-slate-700 whitespace-nowrap">{formatHours(m.period.avgClaimHours)}</td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{formatRelative(m.lastActiveAt)}</td>
                      <td className="pr-3">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team activity feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Aktivitas Tim Terbaru</h3>
          <div className="max-h-[520px] overflow-y-auto pr-1">
            <ActivityFeed items={feed} loading={loading} />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
        Metrik periode dihitung dari log aktivitas (ambil, tugaskan, pindah tahap) yang mulai tercatat sejak fitur PIC
        diaktifkan. &quot;Kecepatan ambil&quot; = rata-rata waktu dari pelamar masuk hingga diambil recruiter.
      </p>

      <AnimatePresence>
        {selected && <MemberDetailDrawer member={selected} days={days} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
