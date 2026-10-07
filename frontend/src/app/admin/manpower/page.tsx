'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ClipboardList, Hourglass, CheckCircle2, Users, Plus, Search, Flame, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { can, useCurrentUser } from '@/lib/permissions';
import { shortName } from '@/components/pipeline/ownership';
import { fmtDate } from '@/components/employees/employeeFormat';
import CompanySelect from '@/components/companies/CompanySelect';
import { useCompanies } from '@/components/companies/useCompanies';
import ManpowerFormModal from '@/components/manpower/ManpowerFormModal';
import ManpowerDetailDrawer from '@/components/manpower/ManpowerDetailDrawer';
import JobFormModal from '@/components/jobs/JobFormModal';
import { budgetLabel, progressOf, reasonLabel } from '@/components/manpower/manpowerFormat';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

const TABS = [
  { key: '', count: 'all', label: 'All' },
  { key: 'PENDING', count: 'PENDING', label: 'Pending approval' },
  { key: 'APPROVED', count: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', count: 'REJECTED', label: 'Rejected' },
  { key: 'CANCELLED', count: 'CANCELLED', label: 'Withdrawn' }
];

export default function ManpowerRequestsPage() {
  const user = useCurrentUser();
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ request: any | null } | null>(null);
  const [jobFrom, setJobFrom] = useState<any | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = (tone: ToastState['tone'], message: string) => setToast({ id: Date.now(), tone, message });
  const { companies } = useCompanies();

  // Deep links from reminders: ?status=PENDING · ?mine=1
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('status')) setStatus(q.get('status') || '');
    if (q.get('mine') === '1') setMine(true);
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
      if (companyId) params.companyId = companyId;
      if (debounced) params.search = debounced;
      if (mine) params.mine = '1';
      const res = await api.getManpowerRequests(params);
      setRows(res.data || []);
      setCounts(res.counts || {});
    } catch (err: any) {
      setToast({ id: Date.now(), tone: 'error', message: 'Failed to load manpower requests: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, [status, companyId, debounced, mine]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    const live = rows.filter((r) => r.status === 'APPROVED');
    const requested = live.reduce((n, r) => n + r.headcount, 0);
    const hired = live.reduce((n, r) => n + Math.min(r.fulfillment?.hired || 0, r.headcount), 0);
    return [
      { label: 'Pending approval', value: counts.PENDING ?? 0, icon: Hourglass, cls: 'text-amber-600' },
      { label: 'Approved — job not opened', value: live.filter((r) => !r.jobId).length, icon: CheckCircle2, cls: 'text-blue-600' },
      { label: 'Approved headcount', value: requested, icon: Users, cls: 'text-slate-900' },
      { label: 'Hired so far', value: requested ? `${hired} / ${requested}` : '0', icon: UserCheck, cls: 'text-emerald-600' }
    ];
  }, [rows, counts]);

  const seesAll = can(user, 'manpower.approve') || can(user, 'jobs.manage') || can(user, 'pipeline.claim');

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Manpower Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hiring Managers request headcount → a TA Lead or the HR Director approves → TA opens it as a job posting and recruits until it is filled.
          </p>
        </div>
        {can(user, 'manpower.request') && (
          <button
            type="button"
            onClick={() => setForm({ request: null })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> New request
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((t) => (
          <div key={t.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <t.icon className={`w-4 h-4 ${t.cls}`} />
            </div>
            <div>
              <p className={`text-xl font-black tabular-nums ${t.cls}`}>{loading && !rows.length ? '…' : t.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.label}</p>
            </div>
          </div>
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
                placeholder="Search request no., position, department…"
                className="pl-8 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            {companies.length > 0 && (
              <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} allLabel="All companies" withUnassigned className="w-full sm:w-60" />
            )}
            {seesAll && (
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mine}
                  onChange={(e) => setMine(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                />
                My requests
              </label>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key || 'all'}
                type="button"
                role="tab"
                aria-selected={status === t.key}
                onClick={() => setStatus(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
                  status === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
                <span
                  className={`min-w-5 px-1 rounded tabular-nums text-[10px] ${
                    status === t.key ? 'bg-white/20' : t.key === 'PENDING' && counts.PENDING ? 'bg-amber-500 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {counts[t.count] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading && !rows.length ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : !rows.length ? (
          <div className="py-14 text-center">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800 mt-2">No manpower requests here</p>
            <p className="text-xs text-slate-500 mt-1">
              {can(user, 'manpower.request') ? 'Use “New request” to ask for headcount.' : 'Requests from Hiring Managers will appear here.'}
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5 font-bold">Request</th>
                  <th className="px-4 py-2.5 font-bold">Position</th>
                  <th className="px-4 py-2.5 font-bold text-right">Headcount</th>
                  <th className="px-4 py-2.5 font-bold">Reason</th>
                  <th className="px-4 py-2.5 font-bold">Budget / month</th>
                  <th className="px-4 py-2.5 font-bold">Requested by</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const p = progressOf(r);
                  const hired = r.fulfillment?.hired || 0;
                  return (
                    <tr key={r.id} onClick={() => setDetailId(r.id)} className="cursor-pointer hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-slate-900">{r.requestNo}</p>
                        <p className="text-[11px] text-slate-500">{fmtDate(r.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          {r.positionTitle}
                          {r.priority === 'URGENT' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold">
                              <Flame className="w-2.5 h-2.5" /> URGENT
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          {r.company && (
                            <span className="px-1 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] font-bold" title={r.company.name}>
                              {r.company.code}
                            </span>
                          )}
                          {r.department} · {r.location}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{r.headcount}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {reasonLabel(r.reason)}
                        {r.replacementFor && <p className="text-[11px] text-slate-400 truncate max-w-[160px]">for {r.replacementFor}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{budgetLabel(r.salaryMin, r.salaryMax)}</td>
                      <td className="px-4 py-3 text-slate-600">{shortName(r.requestedBy?.name) || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-md border text-[10px] font-bold ${p.cls}`}>{p.label}</span>
                        {r.jobId && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, (hired / r.headcount) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500 tabular-nums">
                              {hired}/{r.headcount} hired
                            </span>
                          </div>
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

      <AnimatePresence>
        {detailId && (
          <ManpowerDetailDrawer
            key={detailId}
            requestId={detailId}
            onClose={() => setDetailId(null)}
            onEdit={(r) => {
              setDetailId(null);
              setForm({ request: r });
            }}
            onOpenJob={(r) => {
              setDetailId(null);
              setJobFrom(r);
            }}
            onChanged={(message) => {
              setDetailId(null);
              notify('success', message);
              load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {form && (
          <ManpowerFormModal
            request={form.request}
            onClose={() => setForm(null)}
            onSaved={(_, message) => {
              setForm(null);
              notify('success', message);
              load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {jobFrom && (
          <JobFormModal
            job={null}
            prefill={jobFrom.jobPrefill}
            manpowerRequestId={jobFrom.id}
            onClose={() => setJobFrom(null)}
            onSaved={(message) => {
              notify('success', `${message} Linked to ${jobFrom.requestNo}.`);
              setJobFrom(null);
              load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}</AnimatePresence>
    </div>
  );
}
