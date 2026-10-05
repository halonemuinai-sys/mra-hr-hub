'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Search, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import JobCard from '@/components/jobs/JobCard';
import JobFormModal from '@/components/jobs/JobFormModal';
import JobDetailDrawer from '@/components/jobs/JobDetailDrawer';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

type StatusFilter = 'all' | 'active' | 'closed';

export default function JobsManagementPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ job: any | null } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = (tone: ToastState['tone'], message: string) => setToast({ id: Date.now(), tone, message });

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({ activeOnly: false });
      if (res.success && res.data) setJobs(res.data);
    } catch (err: any) {
      notify('error', 'Gagal memuat lowongan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const counts = useMemo(
    () => ({ all: jobs.length, active: jobs.filter((j) => j.isActive).length, closed: jobs.filter((j) => !j.isActive).length }),
    [jobs]
  );

  const visible = jobs.filter((j) => {
    if (status === 'active' && !j.isActive) return false;
    if (status === 'closed' && j.isActive) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [j.title, j.department, j.division, j.location, ...(j.mustHaveSkills || [])]
      .some((v) => String(v || '').toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Manajemen Lowongan & Kriteria Bobot ATS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik lowongan untuk melihat detail & pelamar. Must-have keywords menjadi acuan utama penilaian otomatis ATS.
          </p>
        </div>
        <button
          onClick={() => setForm({ job: null })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Lowongan Baru
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, divisi, lokasi, atau keyword…"
            className="pl-8 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <div className="inline-flex bg-slate-100 rounded-xl p-1" role="group" aria-label="Filter status">
          {([
            ['all', 'Semua'],
            ['active', 'Aktif'],
            ['closed', 'Ditutup']
          ] as [StatusFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                status === key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label} <span className="tabular-nums text-slate-400">{counts[key]}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={loadJobs} className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50" title="Muat ulang">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid */}
      {loading && jobs.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-56" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-12 text-center text-xs text-slate-500">
          Tidak ada lowongan yang cocok dengan filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
