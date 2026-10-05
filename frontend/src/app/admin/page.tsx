'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Inbox,
  KanbanSquare,
  RefreshCw,
  Users,
  AlertTriangle,
  CheckCircle2,
  Timer,
  TrendingUp,
  Filter,
  Hourglass,
  Award,
  Briefcase,
  Layers
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCurrentUser } from '@/lib/permissions';
import KpiTile from '@/components/dashboard/KpiTile';
import DashboardCard from '@/components/dashboard/DashboardCard';
import TrendChart from '@/components/dashboard/TrendChart';
import ConversionFunnel from '@/components/dashboard/ConversionFunnel';
import ScoreHistogram from '@/components/dashboard/ScoreHistogram';
import StageAgingChart from '@/components/dashboard/StageAgingChart';
import TopJobsTable from '@/components/dashboard/TopJobsTable';
import TalentMix from '@/components/dashboard/TalentMix';
import ActionCenter from '@/components/dashboard/ActionCenter';
import { fmtWeek } from '@/components/dashboard/chartTheme';

const PERIODS = [8, 12, 26];

export default function AdminDashboardPage() {
  const user = useCurrentUser();
  const [weeks, setWeeks] = useState(12);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getDashboard(weeks);
      if (res.success) setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    load();
  }, [load]);

  const k = data?.kpis;
  const v = (x: any) => (loading && !data ? '…' : x ?? '—');
  const spark = (data?.trend || []).map((t: any) => ({ label: fmtWeek(t.weekStart), value: t.applications }));

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Rekrutmen</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kinerja funnel, kualitas pelamar, dan hambatan proses MRA Group
            {data?.generatedAt && ` · diperbarui ${new Date(data.generatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-white border border-slate-200/80 rounded-xl p-1 shadow-xs" role="group" aria-label="Rentang tren">
            {PERIODS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeeks(w)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  weeks === w ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {w} mgg
              </button>
            ))}
          </div>
          <button type="button" onClick={load} className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl" title="Muat ulang">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/pipeline"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <KanbanSquare className="w-3.5 h-3.5" />
            Buka Pipeline
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-xs font-semibold">
          Gagal memuat analitik: {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiTile label="Lamaran 30 hari" value={v(k?.applications30d)} delta={k?.applicationsDelta ?? null} spark={spark} hint={`${v(k?.totalCandidates)} kandidat di database`} icon={Inbox} />
        <KpiTile label="Pipeline aktif" value={v(k?.activePipeline)} hint={`${v(k?.unassigned)} belum diambil · ${v(k?.openJobs)} lowongan buka`} icon={Users} />
        <KpiTile label="Tertahan ≥7 hari" value={v(k?.stale)} hint="Butuh tindak lanjut" icon={AlertTriangle} tone="amber" />
        <KpiTile label="Diterima 30 hari" value={v(k?.hired30d)} delta={k?.hiredDelta ?? null} hint={`Rata-rata ATS ${v(k?.avgAtsScore)}%`} icon={CheckCircle2} tone="emerald" />
        <KpiTile label="Waktu ke Hired" value={k?.avgTimeToHireDays != null ? `${k.avgTimeToHireDays} hari` : v(null)} hint="Rata-rata lamar → diterima" icon={Timer} />
      </div>

      {/* Trend + actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <DashboardCard title="Tren Mingguan" subtitle={`Lamaran masuk vs hasil, ${weeks} minggu terakhir`} icon={TrendingUp} className="xl:col-span-2 min-h-[320px]">
          {data ? <TrendChart data={data.trend} /> : <div className="h-[260px] rounded-xl bg-slate-100 animate-pulse" />}
        </DashboardCard>
        <ActionCenter userId={user?.id} />
      </div>

      {/* Funnel + bottlenecks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <DashboardCard
          title="Konversi Funnel"
          subtitle="Berapa yang mencapai tiap tahap & berapa persen yang lanjut"
          icon={Filter}
          action={<Link href="/admin/pipeline" className="text-[11px] font-bold text-blue-600 hover:text-blue-800">Kelola →</Link>}
        >
          {data ? <ConversionFunnel steps={data.funnel} archived={data.archived} /> : <div className="h-[280px] rounded-xl bg-slate-100 animate-pulse" />}
        </DashboardCard>
        <DashboardCard
          title="Hambatan per Tahap"
          subtitle="Rata-rata lama kandidat di tahap saat ini"
          icon={Hourglass}
          action={<Link href="/admin/pipeline?filter=stale" className="text-[11px] font-bold text-amber-700 hover:text-amber-800">Lihat tertahan →</Link>}
        >
          {data ? <StageAgingChart rows={data.stageAging} /> : <div className="h-[240px] rounded-xl bg-slate-100 animate-pulse" />}
        </DashboardCard>
      </div>

      {/* Quality + jobs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <DashboardCard title="Distribusi Skor ATS" subtitle="Kualitas kecocokan seluruh lamaran" icon={Award} className="min-h-[300px]">
          {data ? <ScoreHistogram data={data.scoreDistribution} /> : <div className="h-[220px] rounded-xl bg-slate-100 animate-pulse" />}
        </DashboardCard>
        <DashboardCard title="Lowongan Teramai" subtitle="6 lowongan dengan pelamar terbanyak" icon={Briefcase} className="xl:col-span-2">
          {data ? <TopJobsTable jobs={data.topJobs} /> : <div className="h-[220px] rounded-xl bg-slate-100 animate-pulse" />}
        </DashboardCard>
      </div>

      <DashboardCard title="Komposisi Talent" subtitle="Kelompok bidang kandidat & saluran masuk" icon={Layers}>
        {data ? <TalentMix jobFamily={data.jobFamily} intakeSource={data.intakeSource} /> : <div className="h-[160px] rounded-xl bg-slate-100 animate-pulse" />}
      </DashboardCard>
    </div>
  );
}
