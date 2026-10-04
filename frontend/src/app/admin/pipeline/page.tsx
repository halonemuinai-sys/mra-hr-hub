'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  KanbanSquare,
  Search,
  RefreshCw,
  Briefcase,
  MapPin,
  Star,
  Clock,
  Archive,
  GripVertical,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { getScoreBadge } from '@/lib/utils';
import CandidateDetailDrawer from '@/components/candidates/CandidateDetailDrawer';

type Stage = {
  key: string;
  label: string;
  accent: string; // top border + dot color
  dot: string;
};

// Active hiring funnel (Zero Purple: amber → blue → emerald)
const ACTIVE_STAGES: Stage[] = [
  { key: 'APPLIED', label: 'Baru Masuk', accent: 'border-t-amber-500', dot: 'bg-amber-500' },
  { key: 'ATS_SCREENED', label: 'Lolos ATS', accent: 'border-t-blue-400', dot: 'bg-blue-400' },
  { key: 'SHORTLISTED', label: 'Shortlisted HR', accent: 'border-t-blue-500', dot: 'bg-blue-500' },
  { key: 'INTERVIEW_HR', label: 'Interview HR', accent: 'border-t-blue-600', dot: 'bg-blue-600' },
  { key: 'INTERVIEW_USER', label: 'Interview User', accent: 'border-t-blue-700', dot: 'bg-blue-700' },
  { key: 'OFFERING', label: 'Offering', accent: 'border-t-emerald-500', dot: 'bg-emerald-500' },
  { key: 'HIRED', label: 'Diterima', accent: 'border-t-emerald-600', dot: 'bg-emerald-600' }
];

const CLOSED_STAGES: Stage[] = [
  { key: 'TALENT_POOL', label: 'Talent Pool', accent: 'border-t-slate-400', dot: 'bg-slate-400' },
  { key: 'REJECTED', label: 'Tidak Lolos', accent: 'border-t-slate-600', dot: 'bg-slate-600' }
];

const ALL_STAGES = [...ACTIVE_STAGES, ...CLOSED_STAGES];

function daysSince(dateStr?: string) {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

function getInitials(name?: string) {
  if (!name) return 'HR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PipelinePage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobId, setJobId] = useState('');
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (jobId) params.jobId = jobId;
      if (search.trim()) params.search = search.trim();
      const res = await api.getPipeline(params);
      if (res.success) setApplications(res.data || []);
    } catch (err) {
      console.error('Error fetching pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getJobs({ activeOnly: false })
      .then((res: any) => res.success && setJobs(res.data || []))
      .catch(() => {});
  }, []);

  // Debounce search & job filter
  useEffect(() => {
    const t = setTimeout(loadPipeline, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, search]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    ALL_STAGES.forEach((s) => (map[s.key] = []));
    applications.forEach((a) => {
      (map[a.status] || (map[a.status] = [])).push(a);
    });
    return map;
  }, [applications]);

  const activeCount = ACTIVE_STAGES.reduce((n, s) => n + grouped[s.key].length, 0);
  const closedCount = CLOSED_STAGES.reduce((n, s) => n + grouped[s.key].length, 0);

  const moveApplication = async (appId: string, newStatus: string) => {
    const current = applications.find((a) => a.id === appId);
    if (!current || current.status === newStatus) return;

    const previous = applications;
    // Optimistic update, rollback on failure
    setApplications((list) =>
      list.map((a) => (a.id === appId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a))
    );
    setMovingId(appId);
    try {
      await api.updateApplicationStatus(appId, { status: newStatus });
    } catch (err: any) {
      setApplications(previous);
      alert('Gagal memindahkan kandidat: ' + err.message);
    } finally {
      setMovingId(null);
    }
  };

  const openDetail = async (app: any) => {
    setOpeningId(app.id);
    try {
      const res = await api.getCandidateById(app.candidate.id);
      if (res.success && res.data) {
        // Make the drawer act on the application clicked on the board
        const fullApp = res.data.applications?.find((a: any) => a.id === app.id) || app;
        setSelectedCandidate({ ...res.data, latestApplication: fullApp, atsScore: fullApp.atsScore });
      }
    } catch (err: any) {
      alert('Gagal membuka profil kandidat: ' + err.message);
    } finally {
      setOpeningId(null);
    }
  };

  const visibleStages = showClosed ? ALL_STAGES : ACTIVE_STAGES;

  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-blue-600" />
            Pipeline Pelamar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Seret kartu kandidat antar kolom untuk memindahkan tahapan seleksi. Klik kartu untuk membuka profil lengkap.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / email / headline..."
              className="pl-8 pr-3 py-2 w-full sm:w-60 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:w-56"
          >
            <option value="">Semua Lowongan</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowClosed((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
              showClosed
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Arsip ({closedCount})
          </button>
          <button
            type="button"
            onClick={loadPipeline}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Funnel summary strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-900">{activeCount} kandidat dalam proses aktif</span>
          <span className="text-slate-500">{closedCount} di arsip (talent pool / tidak lolos)</span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
          {ACTIVE_STAGES.map((s) => {
            const n = grouped[s.key].length;
            if (!n || !activeCount) return null;
            return (
              <div
                key={s.key}
                className={`${s.dot} h-full`}
                style={{ width: `${(n / activeCount) * 100}%` }}
                title={`${s.label}: ${n}`}
              />
            );
          })}
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {visibleStages.map((stage) => {
          const items = grouped[stage.key] || [];
          const isTarget = dropTarget === stage.key;
          return (
            <div
              key={stage.key}
              onDragOver={(e) => {
                e.preventDefault();
                if (dropTarget !== stage.key) setDropTarget(stage.key);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain') || dragId;
                setDropTarget(null);
                setDragId(null);
                if (id) moveApplication(id, stage.key);
              }}
              className={`w-64 shrink-0 flex flex-col rounded-2xl border border-t-4 ${stage.accent} transition-colors ${
                isTarget ? 'bg-blue-50 border-blue-300' : 'bg-slate-100/70 border-slate-200'
              }`}
            >
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  {stage.label}
                </span>
                <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-md px-1.5 py-0.5">
                  {items.length}
                </span>
              </div>

              <div className="px-2 pb-2 space-y-2 min-h-[120px] max-h-[calc(100vh-330px)] overflow-y-auto">
                {loading && applications.length === 0 ? (
                  <div className="h-20 rounded-xl bg-white/60 animate-pulse" />
                ) : items.length === 0 ? (
                  <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400">
                    Belum ada kandidat
                  </div>
                ) : (
                  items.map((app) => (
                    <PipelineCard
                      key={app.id}
                      app={app}
                      dragging={dragId === app.id}
                      busy={movingId === app.id || openingId === app.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', app.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragId(app.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropTarget(null);
                      }}
                      onOpen={() => openDetail(app)}
                      onMove={(status) => moveApplication(app.id, status)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCandidate && (
        <CandidateDetailDrawer
          key={selectedCandidate.latestApplication?.id || selectedCandidate.id}
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onUpdated={() => {
            setSelectedCandidate(null);
            loadPipeline();
          }}
        />
      )}
    </div>
  );
}

function PipelineCard({
  app,
  dragging,
  busy,
  onDragStart,
  onDragEnd,
  onOpen,
  onMove
}: {
  app: any;
  dragging: boolean;
  busy: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onMove: (status: string) => void;
}) {
  const score = Math.round(app.atsScore || 0);
  const badge = getScoreBadge(score);
  const days = daysSince(app.updatedAt || app.appliedAt);
  const c = app.candidate || {};

  return (
    <div
      draggable={!busy}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`group relative bg-white rounded-xl border border-slate-200 p-3 shadow-xs cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all ${
        dragging ? 'opacity-40 rotate-1' : ''
      }`}
    >
      {busy && (
        <div className="absolute inset-0 rounded-xl bg-white/70 flex items-center justify-center z-10">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        </div>
      )}

      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
          {getInitials(c.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 truncate" title={c.fullName}>
            {c.fullName}
          </p>
          <p className="text-[11px] text-slate-500 truncate" title={c.headline}>
            {c.headline || c.email}
          </p>
        </div>
        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
        <Briefcase className="w-3 h-3 text-blue-600 shrink-0" />
        <span className="truncate">{app.job?.title || '-'}</span>
      </div>
      {c.location && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{c.location}</span>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${badge.class}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          ATS {score}%
        </span>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {app.scorecardRating ? (
            <span className="flex items-center gap-0.5 font-bold text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {app.scorecardRating}
            </span>
          ) : null}
          <span className="flex items-center gap-0.5" title="Hari di tahap ini">
            <Clock className="w-3 h-3" />
            {days}h
          </span>
        </div>
      </div>

      {/* Keyboard / touch fallback for moving without drag */}
      <select
        value={app.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onMove(e.target.value)}
        aria-label="Pindahkan tahapan"
        className="mt-2.5 w-full px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        {ALL_STAGES.map((s) => (
          <option key={s.key} value={s.key}>
            Pindah ke: {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
