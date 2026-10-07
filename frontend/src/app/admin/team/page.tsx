'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Activity,
  RefreshCw,
  Users,
  Inbox,
  ShieldCheck,
  ArrowRightLeft,
  CheckCircle2,
  Timer,
  BarChart3,
  Scale,
  History,
  Trophy,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { can, useCurrentUser } from '@/lib/permissions';
import KpiTile from '@/components/dashboard/KpiTile';
import DashboardCard from '@/components/dashboard/DashboardCard';
import WorkloadChart from '@/components/team/WorkloadChart';
import Leaderboard from '@/components/team/Leaderboard';
import RebalancePanel from '@/components/team/RebalancePanel';
import TeamHighlights from '@/components/team/TeamHighlights';
import ActivityFeed from '@/components/team/ActivityFeed';
import MemberDetailDrawer from '@/components/team/MemberDetailDrawer';
import { formatHours } from '@/components/team/teamFormat';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

const PERIODS = [7, 30, 90];
const FEED_FILTERS = [
  { key: '', label: 'Semua' },
  { key: 'moves', label: 'Pindah tahap' },
  { key: 'ownership', label: 'Ambil / tugaskan' },
  { key: 'approvals', label: 'Approval' }
];

export default function TeamPerformancePage() {
  const user = useCurrentUser();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [feedFilter, setFeedFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [rebalanceKey, setRebalanceKey] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = useCallback((tone: ToastState['tone'], message: string) => setToast({ id: Date.now(), tone, message }), []);
  const notifyError = useCallback((m: string) => notify('error', m), [notify]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getTeamPerformance(days);
      if (res.success) setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const res = await api.getTeamActivity({ limit: 30, ...(feedFilter ? { action: feedFilter } : {}) });
      if (res.success) setFeed(res.data || []);
    } catch {
      // feed is secondary
    } finally {
      setFeedLoading(false);
    }
  }, [feedFilter]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const t = data?.team;
  const v = (x: any) => (loading && !data ? '…' : x ?? '—');

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Kinerja Tim Talent Acquisition
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Beban kerja, kecepatan, dan hasil tiap recruiter. Klik nama recruiter untuk detail & riwayat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white border border-slate-200/80 rounded-xl p-1 shadow-xs" role="group" aria-label="Periode">
            {PERIODS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${days === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {d} hari
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              load();
              loadFeed();
              setRebalanceKey((k) => k + 1);
            }}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl"
            title="Muat ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-xs font-semibold">Gagal memuat data kinerja: {error}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiTile label="Anggota TA aktif" value={v(t?.members)} hint={`Rata-rata ${v(t?.avgLoad)} kandidat/orang`} icon={Users} />
        <KpiTile label="Antrean belum diambil" value={v(t?.unassignedCandidates)} hint={`${v(t?.unassignedWaitingLong)} menunggu >2 hari`} icon={Inbox} tone="amber" />
        <KpiTile label="SLA tim" value={t?.slaRate != null ? `${t.slaRate}%` : v(null)} hint={`${v(t?.staleCandidates)} tertahan ≥${data?.staleDays ?? 7} hari`} icon={ShieldCheck} tone={t?.slaRate != null && t.slaRate < 80 ? 'amber' : 'emerald'} />
        <KpiTile label={`Pindah tahap (${days}h)`} value={v(t?.moves)} delta={t?.deltas?.moves ?? null} hint={`${v(t?.advanceRate)}% maju ke depan`} icon={ArrowRightLeft} />
        <KpiTile label={`Diterima (${days}h)`} value={v(t?.hired)} delta={t?.deltas?.hired ?? null} hint={t?.hireRate != null ? `Hire rate ${t.hireRate}%` : `${v(t?.offerings)} offering`} icon={CheckCircle2} tone="emerald" />
        <KpiTile label="Kecepatan ambil" value={loading && !data ? '…' : formatHours(t?.avgClaimHours)} hint="Rata-rata lamar → diambil" icon={Timer} />
      </div>

      {data && <TeamHighlights members={data.members} onSelect={setSelected} />}

      {/* Workload + rebalance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <DashboardCard title="Beban Kerja per Recruiter" subtitle="Kandidat aktif per tahap terhadap kapasitas per orang" icon={BarChart3} className="xl:col-span-2">
          {data ? <WorkloadChart members={data.members} capacity={data.capacity} /> : <div className="h-52 rounded-xl bg-slate-100 animate-pulse" />}
        </DashboardCard>
        <DashboardCard title="Saran Penyeimbangan" subtitle="Kandidat tertahan & antrean lama → recruiter paling longgar" icon={Scale}>
          <RebalancePanel
            key={rebalanceKey}
            canAssign={can(user, 'pipeline.assign')}
            onApplied={(m) => {
              notify('success', m);
              load();
              loadFeed();
            }}
            onError={notifyError}
          />
        </DashboardCard>
      </div>

      {/* Leaderboard */}
      <DashboardCard title="Papan Kinerja Recruiter" subtitle="Klik judul kolom untuk mengurutkan · klik baris untuk detail" icon={Trophy}>
        {data ? (
          <Leaderboard members={data.members} days={days} capacity={data.capacity} onSelect={setSelected} />
        ) : (
          <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
        )}
      </DashboardCard>

      {/* Activity feed */}
      <DashboardCard
        title="Aktivitas Tim Terbaru"
        icon={History}
        action={
          <div className="inline-flex bg-slate-100 rounded-lg p-0.5" role="group" aria-label="Filter aktivitas">
            {FEED_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFeedFilter(f.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${feedFilter === f.key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <ActivityFeed items={feed} loading={feedLoading} />
        </div>
      </DashboardCard>

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
        Metrik periode berasal dari log aktivitas (ambil, tugaskan, pindah tahap, approval). Kapasitas = {data?.capacity ?? 15} kandidat aktif per recruiter.
        SLA = persentase kandidat aktif yang bergerak dalam {data?.staleDays ?? 7} hari terakhir. Perubahan % hanya tampil bila periode sebelumnya punya cukup data.
      </p>

      <AnimatePresence>
        {selected && data && (
          <MemberDetailDrawer
            member={selected}
            team={data.team}
            members={data.members}
            days={days}
            bucket={data.bucket}
            capacity={data.capacity}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}
      </AnimatePresence>
    </div>
  );
}
