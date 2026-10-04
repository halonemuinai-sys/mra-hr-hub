'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { KanbanSquare } from 'lucide-react';
import { api } from '@/lib/api';
import CandidateDetailDrawer from '@/components/candidates/CandidateDetailDrawer';
import PipelineCard from '@/components/pipeline/PipelineCard';
import PipelineColumn from '@/components/pipeline/PipelineColumn';
import PipelineToolbar, { PipelineFilters, EMPTY_FILTERS } from '@/components/pipeline/PipelineToolbar';
import BulkActionBar from '@/components/pipeline/BulkActionBar';
import RejectReasonModal from '@/components/pipeline/RejectReasonModal';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';
import {
  ACTIVE_STAGES,
  CLOSED_STAGES,
  ALL_STAGES,
  SortKey,
  isStale,
  sortApplications,
  stageLabel
} from '@/components/pipeline/stages';

const PREFS_KEY = 'hr_hub_pipeline_prefs';

function readPrefs(): { sort?: SortKey; showClosed?: boolean } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function PipelinePage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<PipelineFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('score');
  const [showClosed, setShowClosed] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClicked = useRef<string | null>(null);
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const [pendingReject, setPendingReject] = useState<string[] | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // ---- Preferences (per viewer) ----
  useEffect(() => {
    const p = readPrefs();
    if (p.sort) setSort(p.sort);
    if (p.showClosed) setShowClosed(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ sort, showClosed }));
    } catch {}
  }, [sort, showClosed]);

  // ---- Data ----
  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.jobId) params.jobId = filters.jobId;
      if (filters.jobFamily) params.jobFamily = filters.jobFamily;
      if (filters.minScore) params.minScore = filters.minScore;
      if (filters.search.trim()) params.search = filters.search.trim();
      const res = await api.getPipeline(params);
      if (res.success) setApplications(res.data || []);
    } catch (err: any) {
      setToast({ id: Date.now(), tone: 'error', message: 'Gagal memuat pipeline: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, [filters.jobId, filters.jobFamily, filters.minScore, filters.search]);

  useEffect(() => {
    api.getJobs({ activeOnly: false })
      .then((res: any) => res.success && setJobs(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(loadPipeline, 300);
    return () => clearTimeout(t);
  }, [loadPipeline]);

  // Drop selections that are no longer on the board
  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(applications.map((a) => a.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [applications]);

  // Esc clears selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pendingReject && !selectedCandidate) setSelected(new Set());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingReject, selectedCandidate]);

  // ---- Derived ----
  const visibleApps = useMemo(
    () => (filters.staleOnly ? applications.filter(isStale) : applications),
    [applications, filters.staleOnly]
  );

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    ALL_STAGES.forEach((s) => (map[s.key] = []));
    visibleApps.forEach((a) => (map[a.status] || (map[a.status] = [])).push(a));
    Object.keys(map).forEach((k) => (map[k] = sortApplications(map[k], sort)));
    return map;
  }, [visibleApps, sort]);

  const countIn = (stages: typeof ALL_STAGES) => stages.reduce((n, s) => n + grouped[s.key].length, 0);
  const activeCount = countIn(ACTIVE_STAGES);
  const closedCount = countIn(CLOSED_STAGES);
  const staleCount = applications.filter(isStale).length;
  const hiredCount = grouped.HIRED.length;
  const offerCount = grouped.OFFERING.length;

  // ---- Moving ----
  const applyMove = useCallback(
    async (ids: string[], status: string, note?: string, isUndo = false) => {
      const prevStatus = new Map<string, string>();
      applications.forEach((a) => {
        if (ids.includes(a.id) && a.status !== status) prevStatus.set(a.id, a.status);
      });
      const movedIds = [...prevStatus.keys()];
      if (movedIds.length === 0) return;

      const snapshot = applications;
      const now = new Date().toISOString();
      setApplications((list) => list.map((a) => (prevStatus.has(a.id) ? { ...a, status, updatedAt: now } : a)));
      setBusyIds(new Set(movedIds));

      try {
        await api.bulkUpdateApplicationStatus({ applicationIds: movedIds, status, note });
        setSelected(new Set());
        if (isUndo) {
          setToast({ id: Date.now(), tone: 'success', message: 'Perpindahan dibatalkan.' });
          return;
        }
        const who = movedIds.length === 1
          ? applications.find((a) => a.id === movedIds[0])?.candidate?.fullName || '1 kandidat'
          : `${movedIds.length} kandidat`;
        setToast({
          id: Date.now(),
          tone: 'success',
          message: `${who} → ${stageLabel(status)}`,
          onUndo: () => {
            // Revert each group back to its original stage
            const byStatus = new Map<string, string[]>();
            prevStatus.forEach((st, id) => byStatus.set(st, [...(byStatus.get(st) || []), id]));
            byStatus.forEach((groupIds, st) => applyMoveRef.current(groupIds, st, undefined, true));
          }
        });
      } catch (err: any) {
        setApplications(snapshot);
        setToast({ id: Date.now(), tone: 'error', message: 'Gagal memindahkan: ' + err.message });
      } finally {
        setBusyIds(new Set());
      }
    },
    [applications]
  );

  // Undo callbacks outlive the render they were created in
  const applyMoveRef = useRef(applyMove);
  applyMoveRef.current = applyMove;

  const requestMove = (ids: string[], status: string) => {
    if (ids.length === 0) return;
    if (status === 'REJECTED') setPendingReject(ids);
    else applyMove(ids, status);
  };

  // ---- Selection ----
  const toggleSelect = (app: any, shiftKey: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const anchor = lastClicked.current;
      const column = grouped[app.status] || [];
      const anchorIdx = anchor ? column.findIndex((a) => a.id === anchor) : -1;
      if (shiftKey && anchorIdx >= 0) {
        const idx = column.findIndex((a) => a.id === app.id);
        const [from, to] = anchorIdx < idx ? [anchorIdx, idx] : [idx, anchorIdx];
        column.slice(from, to + 1).forEach((a) => next.add(a.id));
      } else if (next.has(app.id)) {
        next.delete(app.id);
      } else {
        next.add(app.id);
      }
      return next;
    });
    lastClicked.current = app.id;
  };

  const toggleSelectColumn = (stageKey: string) => {
    const ids = grouped[stageKey].map((a) => a.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const all = ids.every((id) => next.has(id));
      ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  // ---- Detail drawer ----
  const openDetail = async (app: any) => {
    setBusyIds(new Set([app.id]));
    try {
      const res = await api.getCandidateById(app.candidate.id);
      if (res.success && res.data) {
        // Make the drawer act on the application clicked on the board
        const fullApp = res.data.applications?.find((a: any) => a.id === app.id) || app;
        setSelectedCandidate({ ...res.data, latestApplication: fullApp, atsScore: fullApp.atsScore });
      }
    } catch (err: any) {
      setToast({ id: Date.now(), tone: 'error', message: 'Gagal membuka profil: ' + err.message });
    } finally {
      setBusyIds(new Set());
    }
  };

  const visibleStages = showClosed ? ALL_STAGES : ACTIVE_STAGES;
  const selectionMode = selected.size > 0;

  return (
    <div className="space-y-4 max-w-full">
      {/* Header + funnel summary */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-blue-600" />
            Pipeline Pelamar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Seret kartu untuk pindah tahap • klik avatar untuk memilih banyak (Shift untuk rentang) • klik kartu untuk profil lengkap
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Aktif', value: activeCount, cls: 'text-slate-900' },
            { label: 'Tertahan', value: staleCount, cls: 'text-amber-600' },
            { label: 'Offering', value: offerCount, cls: 'text-emerald-600' },
            { label: 'Diterima', value: hiredCount, cls: 'text-emerald-700' }
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-xs">
              <p className={`text-lg font-black tabular-nums ${s.cls}`}>{loading && !applications.length ? '…' : s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <PipelineToolbar
        filters={filters}
        onFiltersChange={setFilters}
        jobs={jobs}
        sort={sort}
        onSortChange={setSort}
        showClosed={showClosed}
        onToggleClosed={() => setShowClosed((v) => !v)}
        closedCount={closedCount}
        staleCount={staleCount}
        loading={loading}
        onRefresh={loadPipeline}
      />

      {/* Funnel distribution strip */}
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-200/70">
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

      {/* Kanban board */}
      <div className={`flex gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 ${selectionMode ? 'pb-24' : 'pb-4'}`}>
        {visibleStages.map((stage) => {
          const items = grouped[stage.key] || [];
          return (
            <PipelineColumn
              key={stage.key}
              stage={stage}
              items={items}
              loading={loading}
              selectedCount={items.filter((a) => selected.has(a.id)).length}
              onToggleSelectAll={() => toggleSelectColumn(stage.key)}
              onDropIds={(ids) => requestMove(ids, stage.key)}
            >
              {items.map((app) => (
                <PipelineCard
                  key={app.id}
                  app={app}
                  selected={selected.has(app.id)}
                  selectionMode={selectionMode}
                  dragging={draggingIds.includes(app.id)}
                  busy={busyIds.has(app.id)}
                  onToggleSelect={(shift) => toggleSelect(app, shift)}
                  onDragStart={(e) => {
                    // Dragging a selected card carries the whole selection
                    const ids = selected.has(app.id) ? [...selected] : [app.id];
                    e.dataTransfer.setData('application/x-hrhub-ids', JSON.stringify(ids));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingIds(ids);
                  }}
                  onDragEnd={() => setDraggingIds([])}
                  onOpen={() => openDetail(app)}
                  onMove={(status) => requestMove([app.id], status)}
                />
              ))}
            </PipelineColumn>
          );
        })}
      </div>

      <AnimatePresence>
        {selectionMode && (
          <BulkActionBar
            count={selected.size}
            onMove={(status) => requestMove([...selected], status)}
            onClear={() => setSelected(new Set())}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingReject && (
          <RejectReasonModal
            count={pendingReject.length}
            onCancel={() => setPendingReject(null)}
            onConfirm={(note) => {
              const ids = pendingReject;
              setPendingReject(null);
              applyMove(ids, 'REJECTED', note);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}
      </AnimatePresence>

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
