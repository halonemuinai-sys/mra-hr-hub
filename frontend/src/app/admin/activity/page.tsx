'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, Download, History, Loader2, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import ActivityFeed from '@/components/team/ActivityFeed';
import { describeActivity } from '@/components/team/teamFormat';

const PAGE_SIZE = 50;

const GROUPS = [
  { key: '', count: 'all', label: 'All' },
  { key: 'moves', count: 'moves', label: 'Stage moves' },
  { key: 'ownership', count: 'ownership', label: 'Claims / assignments' },
  { key: 'approvals', count: 'approvals', label: 'Approvals' },
  { key: 'hires', count: 'hires', label: 'Hires & onboarding' }
];

const PERIODS = [
  { key: '1', label: 'Today' },
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: '', label: 'All time' }
];

/** Start of today minus (n - 1) days, local time */
function periodStart(days: string) {
  if (!days) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (Number(days) - 1));
  return d.toISOString();
}

function dayLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const csvCell = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function TeamActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [group, setGroup] = useState('');
  const [period, setPeriod] = useState('7');
  const [recruiterId, setRecruiterId] = useState('');
  const [jobId, setJobId] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    api.getRecruiters()
      .then((res: any) => setRecruiters(res.data || []))
      .catch(() => {});
    api.getJobs({ activeOnly: false })
      .then((res: any) => setJobs(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const p: Record<string, string> = { limit: String(PAGE_SIZE) };
    const from = periodStart(period);
    if (from) p.from = from;
    if (recruiterId) p.recruiterId = recruiterId;
    if (jobId) p.jobId = jobId;
    if (debounced) p.search = debounced;
    if (group) p.action = group;
    return p;
  }, [period, recruiterId, jobId, debounced, group]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.getTeamActivity({ ...params, counts: '1' });
      if (id !== requestId.current) return; // a newer filter won
      setItems(res.data || []);
      setCursor(res.nextCursor || null);
      setCounts(res.counts || null);
    } catch (err: any) {
      if (id === requestId.current) setError(err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await api.getTeamActivity({ ...params, before: cursor });
      setItems((prev) => [...prev, ...(res.data || [])]);
      setCursor(res.nextCursor || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const days = useMemo(() => {
    const map = new Map<string, { label: string; rows: any[] }>();
    items.forEach((a) => {
      const d = new Date(a.createdAt);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, { label: dayLabel(d), rows: [] });
      map.get(key)!.rows.push(a);
    });
    return [...map.values()];
  }, [items]);

  const total = counts ? counts[GROUPS.find((g) => g.key === group)?.count || 'all'] : null;

  const exportCsv = () => {
    const header = ['Time', 'Recruiter', 'Activity', 'Candidate', 'Job', 'Note'];
    const lines = items.map((a) => {
      const { who, text } = describeActivity(a);
      return [new Date(a.createdAt).toLocaleString('en-GB'), who, text, a.application?.candidate?.fullName, a.application?.job?.title, a.note]
        .map(csvCell)
        .join(',');
    });
    const blob = new Blob(['﻿' + [header.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `team-activity_${new Date().toISOString().slice(0, 10)}.csv`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const select =
    'px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30';

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Team Activity Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Every claim, assignment, stage move, approval and onboarding step by the TA team.{' '}
            <Link href="/admin/team" className="font-bold text-blue-600 hover:text-blue-800">
              Team performance →
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportCsv}
            disabled={!items.length}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            title="Export the rows loaded below"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button type="button" onClick={load} className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name…"
              className="pl-8 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period" className={select}>
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <select value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)} aria-label="Recruiter" className={select}>
            <option value="">All team members</option>
            {recruiters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} aria-label="Job" className={`${select} max-w-[220px]`}>
            <option value="">All jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Activity type">
          {GROUPS.map((g) => {
            const active = group === g.key;
            return (
              <button
                key={g.key || 'all'}
                type="button"
                onClick={() => setGroup(g.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                  active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g.label}
                {counts && (
                  <span className={`min-w-5 px-1 rounded tabular-nums text-[10px] ${active ? 'bg-white/20' : 'bg-white text-slate-500'}`}>{counts[g.count] ?? 0}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-xs font-semibold">{error}</div>}

      {/* List grouped by day */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        {loading && !items.length ? (
          <div className="p-5">
            <ActivityFeed items={[]} loading />
          </div>
        ) : !items.length ? (
          <div className="py-14 text-center">
            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800 mt-2">No activity for these filters</p>
            <p className="text-xs text-slate-500 mt-1">Try a longer period or clear the filters.</p>
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            {days.map((d) => (
              <section key={d.label}>
                <h2 className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-y border-slate-100 first:border-t-0 first:rounded-t-2xl px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                  {d.label}
                  <span className="text-slate-400 tabular-nums">{d.rows.length}</span>
                </h2>
                <div className="px-5 py-2">
                  <ActivityFeed items={d.rows} loading={false} clock />
                </div>
              </section>
            ))}
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                Showing <b className="text-slate-800 tabular-nums">{items.length}</b>
                {total !== null && total !== undefined ? (
                  <>
                    {' '}
                    of <b className="text-slate-800 tabular-nums">{total}</b>
                  </>
                ) : null}{' '}
                activities
              </p>
              {cursor && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Load {PAGE_SIZE} more
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
