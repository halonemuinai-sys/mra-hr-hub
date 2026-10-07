'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
import { formatHours } from '@/components/team/teamFormat';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

const PERIODS = [7, 30, 90];
const MemberDetailDrawer = dynamic(() => import('@/components/team/MemberDetailDrawer'), {
  loading: () => <div role="status" className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-lg">Loading recruiter details...</div>
});

export default function TeamPerformancePage() {
  const user = useCurrentUser();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.team;
  const v = (x: any) => (loading && !data ? '…' : x ?? '—');

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Talent Acquisition Team Performance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track recruiter workload, response time, and outcomes. Select a recruiter for details and history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/activity"
            className="px-3 py-2 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-blue-600" /> Activity log
          </Link>
          <div className="inline-flex bg-white border border-slate-200/80 rounded-xl p-1 shadow-xs" role="group" aria-label="Period">
            {PERIODS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${days === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {d} days
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              load();
              setRebalanceKey((k) => k + 1);
            }}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-xs font-semibold">Failed to load team performance: {error}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiTile label="Active TA members" value={v(t?.members)} hint={`Average ${v(t?.avgLoad)} candidates per member`} icon={Users} />
        <KpiTile label="Unassigned queue" value={v(t?.unassignedCandidates)} hint={`${v(t?.unassignedWaitingLong)} waiting >2 days`} icon={Inbox} tone="amber" />
        <KpiTile label="Team SLA" value={t?.slaRate != null ? `${t.slaRate}%` : v(null)} hint={`${v(t?.staleCandidates)} stalled ≥${data?.staleDays ?? 7} days`} icon={ShieldCheck} tone={t?.slaRate != null && t.slaRate < 80 ? 'amber' : 'emerald'} />
        <KpiTile label={`Stage moves (${days}d)`} value={v(t?.moves)} delta={t?.deltas?.moves ?? null} hint={`${v(t?.advanceRate)}% moved forward`} icon={ArrowRightLeft} />
        <KpiTile label={`Hired (${days}d)`} value={v(t?.hired)} delta={t?.deltas?.hired ?? null} hint={t?.hireRate != null ? `Hire rate ${t.hireRate}%` : `${v(t?.offerings)} offering`} icon={CheckCircle2} tone="emerald" />
        <KpiTile label="Claim time" value={loading && !data ? '…' : formatHours(t?.avgClaimHours)} hint="Average application to claim time" icon={Timer} />
      </div>

      {data && <TeamHighlights members={data.members} onSelect={setSelected} />}

      {/* Workload + rebalance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <DashboardCard title="Recruiter Workload" subtitle="Active candidates by stage against individual capacity" icon={BarChart3} className="xl:col-span-2">
          {data ? <WorkloadChart members={data.members} capacity={data.capacity} /> : <div className="h-52 rounded-xl bg-slate-100 animate-pulse" />}
        </DashboardCard>
        <DashboardCard title="Workload Balancing" subtitle="Reassign stalled candidates and older queue items to available recruiters" icon={Scale}>
          <RebalancePanel
            key={rebalanceKey}
            canAssign={can(user, 'pipeline.assign')}
            onApplied={(m) => {
              notify('success', m);
              load();
            }}
            onError={notifyError}
          />
        </DashboardCard>
      </div>

      {/* Leaderboard */}
      <DashboardCard title="Recruiter Leaderboard" subtitle="Select a column to sort or a recruiter to view details" icon={Trophy}>
        {data ? (
          <Leaderboard members={data.members} days={days} capacity={data.capacity} onSelect={setSelected} />
        ) : (
          <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
        )}
      </DashboardCard>

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
        Period metrics use activity logs (claims, assignments, stage moves, approvals). Capacity = {data?.capacity ?? 15} active candidates per recruiter.
        SLA = percentage of active candidates who moved within the last {data?.staleDays ?? 7} days. Percentage changes appear only when the previous period has enough data.
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
