'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, CalendarClock, ListChecks, Rocket, Search, Timer } from 'lucide-react';
import { api } from '@/lib/api';
import { getInitials } from '@/components/pipeline/stages';
import CompanySelect from '@/components/companies/CompanySelect';
import { useCompanies } from '@/components/companies/useCompanies';
import OnboardingDrawer from '@/components/onboarding/OnboardingDrawer';
import { daysFromToday, dueLabel, fmtDue, OWNER_META, PROGRESS_META } from '@/components/onboarding/onboardingFormat';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

const TABS = [
  { key: '', label: 'All' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'NOT_STARTED', label: 'Not started' },
  { key: 'COMPLETED', label: 'Completed' }
];

export default function OnboardingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const { companies } = useCompanies();

  // Deep links from reminders: ?filter=overdue | probation
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('filter');
    if (f === 'overdue' || f === 'probation') setFilter(f);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (filter) params.filter = filter;
      if (companyId) params.companyId = companyId;
      if (debounced) params.search = debounced;
      const res = await api.getOnboarding(params);
      setRows(res.data || []);
      setSummary(res.summary || null);
    } catch (err: any) {
      setToast({ id: Date.now(), tone: 'error', message: 'Failed to load onboarding: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, [status, filter, companyId, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const tiles = [
    { label: 'In progress', value: summary?.inProgress, icon: Rocket, cls: 'text-blue-600', onClick: () => { setStatus('IN_PROGRESS'); setFilter(''); } },
    { label: 'Overdue tasks', value: summary?.overdueTasks, icon: AlertTriangle, cls: summary?.overdueTasks ? 'text-amber-600' : 'text-emerald-600', onClick: () => { setStatus(''); setFilter('overdue'); } },
    { label: 'Joining this week', value: summary?.startingThisWeek, icon: CalendarClock, cls: 'text-slate-900', onClick: () => { setStatus(''); setFilter(''); } },
    { label: 'Probation ends ≤30 days', value: summary?.probationEnding, icon: Timer, cls: 'text-amber-600', onClick: () => { setStatus(''); setFilter('probation'); } }
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-blue-600" />
          Onboarding
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Checklists for new employees — contract, accounts, equipment, BPJS, orientation and the probation review. Created automatically when a hire is registered.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <button key={t.label} type="button" onClick={t.onClick} className="text-left bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3 hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <t.icon className={`w-4 h-4 ${t.cls}`} />
            </div>
            <div>
              <p className={`text-xl font-black tabular-nums ${t.cls}`}>{loading && !summary ? '…' : t.value ?? 0}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="p-3 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, employee ID, position…"
                className="pl-8 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            {companies.length > 0 && <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} allLabel="All companies" withUnassigned className="w-full sm:w-60" />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.key || 'all'}
                type="button"
                onClick={() => setStatus(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${status === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t.label}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-slate-200" />
            {[
              ['overdue', 'Has overdue tasks'],
              ['probation', 'Probation ending']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(filter === key ? '' : key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
                  filter === key ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && !rows.length ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : !rows.length ? (
          <div className="py-14 text-center">
            <ListChecks className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800 mt-2">No new employees here</p>
            <p className="text-xs text-slate-500 mt-1">Register a Hired candidate under New Employees — the checklist is created automatically.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5 font-bold">Employee</th>
                  <th className="px-4 py-2.5 font-bold">Join date</th>
                  <th className="px-4 py-2.5 font-bold w-[22%]">Progress</th>
                  <th className="px-4 py-2.5 font-bold">Next task</th>
                  <th className="px-4 py-2.5 font-bold">Probation ends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((e) => {
                  const p = e.progress;
                  const pm = PROGRESS_META[p.status];
                  const joinIn = daysFromToday(e.joinDate);
                  return (
                    <tr key={e.id} onClick={() => setOpenId(e.id)} className="cursor-pointer hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{getInitials(e.fullName)}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{e.fullName}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {e.company && <span className="mr-1 px-1 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] font-bold">{e.company.code}</span>}
                              {e.position} · {e.department}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 tabular-nums">{fmtDue(e.joinDate)}</p>
                        {joinIn !== null && joinIn >= 0 && joinIn <= 14 && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                            {joinIn === 0 ? 'Starts today' : `Starts in ${joinIn} day${joinIn === 1 ? '' : 's'}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'NOT_STARTED' ? (
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${pm.cls}`}>{pm.label}</span>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className={`px-1.5 py-0.5 rounded border font-bold ${pm.cls}`}>{pm.label}</span>
                              <span className="tabular-nums text-slate-600 font-semibold">
                                {p.done}/{p.total}
                                {p.overdue ? <span className="ml-1.5 text-amber-700 font-bold">· {p.overdue} overdue</span> : null}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className={`h-full rounded-full ${p.status === 'COMPLETED' ? 'bg-emerald-600' : p.overdue ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${p.percent}%` }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.nextTask ? (
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate max-w-[260px]">{p.nextTask.title}</p>
                            <p className="text-[10px] flex items-center gap-1.5">
                              <span className={`px-1 py-0.5 rounded border font-bold ${(OWNER_META[p.nextTask.owner] || OWNER_META.HR).cls}`}>{(OWNER_META[p.nextTask.owner] || OWNER_META.HR).label}</span>
                              <span className={`font-bold ${p.nextTask.overdue ? 'text-amber-700' : 'text-slate-500'}`}>{dueLabel(p.nextTask.dueDate)}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {e.probationEndDate ? (
                          <>
                            <p className="font-semibold text-slate-800 tabular-nums">{fmtDue(e.probationEndDate)}</p>
                            {e.probationDaysLeft !== null && e.probationDaysLeft >= 0 && (
                              <p className={`text-[10px] font-bold ${e.probationDaysLeft <= 14 ? 'text-amber-700' : 'text-slate-400'}`}>{e.probationDaysLeft} days left</p>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">{e.employmentStatus === 'PERMANENT' ? 'Permanent' : '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>{openId && <OnboardingDrawer key={openId} employeeId={openId} onClose={() => setOpenId(null)} onChanged={load} />}</AnimatePresence>
      <AnimatePresence>{toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}</AnimatePresence>
    </div>
  );
}
