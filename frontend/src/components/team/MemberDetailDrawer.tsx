'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/permissions';
import { getInitials, stageLabel } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import { CHART, axisTick } from '@/components/dashboard/chartTheme';
import ActivityFeed from './ActivityFeed';
import { formatHours, formatRelative } from './teamFormat';
import { STAGE_COLORS, loadTone } from './teamTheme';

interface Props {
  member: any;
  team: any;
  members: any[];
  days: number;
  bucket: 'day' | 'week';
  capacity: number;
  onClose: () => void;
}

const fmtBucket = (iso: string, bucket: 'day' | 'week') =>
  new Date(iso).toLocaleDateString('en-GB', bucket === 'day' ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });

export default function MemberDetailDrawer({ member, members, days, bucket, capacity, onClose }: Props) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getTeamActivity({ recruiterId: member.id, limit: 40 })
      .then((res: any) => res.success && setActivity(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [member.id]);

  const p = member.period;
  const tone = loadTone(member.utilization);
  const peers = members.filter((m) => m.isActive && (m.activeCount || m.period.moves));
  const teamAvg = (fn: (m: any) => number | null) => {
    const xs = peers.map(fn).filter((x): x is number => x != null);
    return xs.length ? Math.round((xs.reduce((n, x) => n + x, 0) / xs.length) * 10) / 10 : null;
  };

  const compare = [
    { label: 'Stage moves', me: p.moves, avg: teamAvg((m) => m.period.moves), better: 'high' },
    { label: 'Advancement %', me: p.advanceRate, avg: teamAvg((m) => m.period.advanceRate), better: 'high', suffix: '%' },
    { label: 'Hired', me: p.hired, avg: teamAvg((m) => m.period.hired), better: 'high' },
    { label: 'SLA (not stalled)', me: member.slaRate, avg: teamAvg((m) => m.slaRate), better: 'high', suffix: '%' },
    { label: 'Claim time (hours)', me: p.avgClaimHours, avg: teamAvg((m) => m.period.avgClaimHours), better: 'low' }
  ];
  const maxStage = Math.max(1, ...STAGE_COLORS.map((s) => member.byStage[s.key] || 0));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="bg-slate-900 text-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                {getInitials(shortName(member.name))}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold truncate">{shortName(member.name)}</h2>
                <p className="text-[11px] text-slate-400 truncate">{ROLE_LABELS[member.role] || member.role} · {member.email}</p>
                <p className="text-[11px] text-blue-300 mt-0.5">Last active: {formatRelative(member.lastActiveAt)}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300">Workload: <b className="text-white">{member.activeCount}</b> / {capacity}</span>
              <span className="text-slate-300">{member.utilization ?? 0}% · {tone.label}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, member.utilization || 0)}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Comparison with team average */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{days} days vs. team average</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {compare.map((c) => {
                const ahead =
                  c.me == null || c.avg == null ? null : c.better === 'high' ? c.me >= c.avg : c.me <= c.avg;
                return (
                  <div key={c.label} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="text-slate-600">{c.label}</span>
                    <span className="flex items-center gap-3 tabular-nums">
                      <span className="text-[10px] text-slate-400">team {c.avg ?? '—'}{c.avg != null && c.suffix ? c.suffix : ''}</span>
                      <b className={ahead == null ? 'text-slate-900' : ahead ? 'text-emerald-700' : 'text-amber-700'}>
                        {c.me ?? '—'}{c.me != null && c.suffix ? c.suffix : ''}
                      </b>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Trend */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Stage moves per {bucket === 'day' ? 'day' : 'week'}
            </h3>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={member.series} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="t" tickFormatter={(t) => fmtBucket(t, bucket)} tick={axisTick} tickLine={false} axisLine={{ stroke: CHART.grid }} minTickGap={12} />
                  <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ fontSize: 11, borderRadius: 10 }}
                    labelFormatter={(t) => fmtBucket(String(t), bucket)}
                    formatter={(v: number, n: string) => [v, n === 'moves' ? 'Stage moves' : 'Hired']}
                  />
                  <Bar dataKey="moves" fill={CHART.blue} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="hired" fill={CHART.emerald} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 flex gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />Stage moves ({p.moves})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />Hired ({p.hired})</span>
            </p>
          </section>

          {/* Holdings by stage */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Active candidates by stage ({member.activeCount})</h3>
            <div className="space-y-1.5">
              {STAGE_COLORS.map((s) => {
                const n = member.byStage[s.key] || 0;
                return (
                  <div key={s.key} className="grid grid-cols-[100px_1fr_24px] items-center gap-2 text-xs">
                    <span className="text-slate-600 truncate">{s.label}</span>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(n / maxStage) * 100}%`, background: s.color }} />
                    </div>
                    <b className="text-right tabular-nums text-slate-900">{n}</b>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Average {member.avgDaysInStage ?? '—'} days in the current stage · average ATS {member.avgAtsScore ?? '—'}% · claim time {formatHours(p.avgClaimHours)}
            </p>
          </section>

          {/* Stalled candidates */}
          {member.staleCandidates.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Stalled ≥7 days ({member.staleCount})
                </h3>
                <Link href="/admin/pipeline?filter=stale" className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                  Open Pipeline <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <ul className="divide-y divide-slate-100 border border-amber-200 rounded-xl">
                {member.staleCandidates.map((c: any) => (
                  <li key={c.applicationId} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0">
                      <span className="block font-bold text-slate-900 truncate">{c.candidate}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{stageLabel(c.status)} · {c.job}</span>
                    </span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${c.days >= 14 ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}>
                      {c.days} days
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Activity history</h3>
            <ActivityFeed items={activity} loading={loading} compact />
          </section>
        </div>
      </motion.aside>
    </div>
  );
}
