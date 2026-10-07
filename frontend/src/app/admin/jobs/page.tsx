'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useJobRefresh } from '@/components/jobs/useJobRefresh';
import { AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Search, RefreshCw, ArrowUpRight, Users, ScanLine, CircleCheck, X } from 'lucide-react';
import { api } from '@/lib/api';
import JobCard from '@/components/jobs/JobCard';
import JobFormModal from '@/components/jobs/JobFormModal';
import JobDetailDrawer from '@/components/jobs/JobDetailDrawer';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';
import CompanySelect from '@/components/companies/CompanySelect';
import { useCompanies } from '@/components/companies/useCompanies';

type StatusFilter = 'all' | 'active' | 'closed';

export default function JobsManagementPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  // '' = all PTs, 'none' = jobs without a PT, otherwise a company id (deep link: ?companyId=)
  const [companyId, setCompanyId] = useState('');
  const { companies } = useCompanies();
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('companyId');
    if (q) setCompanyId(q);
  }, []);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ job: any | null } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = (tone: ToastState['tone'], message: string) => setToast({ id: Date.now(), tone, message });

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getJobsForManagement();
      if (!res.success || !Array.isArray(res.data)) throw new Error('Invalid jobs response.');
      setJobs(res.data);
      setLoadError('');
    } catch (err: any) {
      setLoadError('Failed to load jobs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useJobRefresh(loadJobs);

  const counts = useMemo(
    () => ({ all: jobs.length, active: jobs.filter((j) => j.isActive).length, closed: jobs.filter((j) => !j.isActive).length }),
    [jobs]
  );

  const visible = jobs.filter((j) => {
    if (status === 'active' && !j.isActive) return false;
    if (status === 'closed' && j.isActive) return false;
    if (companyId === 'none' ? j.companyId : companyId && j.companyId !== companyId) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [j.title, j.department, j.division, j.location, j.company?.name, j.company?.code, ...(j.mustHaveSkills || [])]
      .some((v) => String(v || '').toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[48px] border-blue-400/10" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300"><Briefcase className="h-4 w-4" /> Talent Acquisition / Jobs</p>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Manage your openings.<br /><span className="text-blue-300">Find the right talent.</span></h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">Job Management & ATS Criteria. Define role requirements and keywords to support candidate screening.</p>
          </div>
          <button type="button" onClick={() => setForm({ job: null })} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-blue-500 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300 lg:self-center">
            <Plus className="h-4 w-4" /> Add Job <ArrowUpRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Total jobs', value: counts.all, detail: 'All registered positions', icon: Briefcase, tone: 'bg-blue-50 text-blue-600' },
          { label: 'Open positions', value: counts.active, detail: 'Live on the career portal', icon: CircleCheck, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total applications', value: jobs.reduce((n, j) => n + (j._count?.applications || 0), 0), detail: 'Across all job openings', icon: Users, tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'ATS keywords configured', value: jobs.filter((j) => j.mustHaveSkills?.length).length, detail: 'Jobs with must-have keywords', icon: ScanLine, tone: 'bg-amber-50 text-amber-600' }
        ].map(({ label, value, detail, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-500">{label}</p><span className={`rounded-xl p-2 ${tone}`}><Icon className="h-4 w-4" /></span></div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{loading && !jobs.length ? '—' : value}</p>
            <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between gap-3 pt-2">
        <div><h2 className="text-base font-semibold text-slate-900">Job openings</h2><p className="mt-1 text-xs text-slate-500">Track applicants and manage criteria for each position.</p></div>
        <span aria-live="polite" className="shrink-0 text-xs text-slate-500">{visible.length} positions</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 basis-full sm:basis-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search jobs"
            placeholder="Search title, division, location, or keyword…"
            className="pl-8 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        {companies.length > 0 && (
          <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} allLabel="All companies" withUnassigned className="w-full sm:w-64" />
        )}
        <div className="inline-flex bg-slate-100 rounded-xl p-1" role="group" aria-label="Filter by status">
          {([
            ['all', 'All'],
            ['active', 'Active'],
            ['closed', 'Closed']
          ] as [StatusFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              aria-pressed={status === key}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                status === key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label} <span className="tabular-nums text-slate-400">{counts[key]}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={loadJobs} disabled={loading} aria-label="Refresh jobs" className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid */}
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <span>{loadError} {jobs.length > 0 && 'Showing the last loaded data.'}</span>
          <button type="button" disabled={loading} onClick={loadJobs} className="font-semibold underline disabled:opacity-50">Retry</button>
        </div>
      )}
      {loading && jobs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-80" />
          ))}
        </div>
      ) : loadError && jobs.length === 0 ? null : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"><Search className="h-6 w-6" /></span>
          <h3 className="text-sm font-semibold text-slate-900">{jobs.length ? 'No matching jobs' : 'Create your first job opening'}</h3>
          <p className="mt-2 text-xs text-slate-500">{jobs.length ? 'Try another keyword or change the status filter.' : 'Add a position and ATS criteria to start receiving applications.'}</p>
          <button type="button" onClick={() => jobs.length ? (setSearch(''), setStatus('all')) : setForm({ job: null })} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
            {jobs.length ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}{jobs.length ? 'Clear filters' : 'Add job'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {visible.map((job) => (
            <JobCard key={job.id} job={job} onOpen={() => setDetailId(job.id)} onEdit={() => setForm({ job })} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {detailId && (
          <JobDetailDrawer
            key={detailId}
            jobId={detailId}
            onClose={() => setDetailId(null)}
            onEdit={(job) => setForm({ job })}
            onChanged={(message, closeDrawer) => {
              notify('success', message);
              if (closeDrawer) setDetailId(null);
              loadJobs();
            }}
            onError={(message) => notify('error', message)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {form && (
          <JobFormModal
            job={form.job}
            onClose={() => setForm(null)}
            onSaved={(message) => {
              setForm(null);
              notify('success', message);
              loadJobs();
              // Re-open the drawer fresh so it shows the saved values
              if (detailId) {
                const id = detailId;
                setDetailId(null);
                setTimeout(() => setDetailId(id), 0);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}
      </AnimatePresence>
    </div>
  );
}
