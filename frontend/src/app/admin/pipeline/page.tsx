'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import CandidateDetailDrawer from '@/components/candidates/CandidateDetailDrawer';
import PipelineHeader from '@/components/pipeline/PipelineHeader';
import FunnelStrip from '@/components/pipeline/FunnelStrip';
import PipelineBoard from '@/components/pipeline/PipelineBoard';
import { usePipelineSelection } from '@/components/pipeline/usePipelineSelection';
import EmployeeFormModal from '@/components/employees/EmployeeFormModal';
import PipelineToolbar, { PipelineFilters, EMPTY_FILTERS } from '@/components/pipeline/PipelineToolbar';
import OwnerScopeBar from '@/components/pipeline/OwnerScopeBar';
import BulkActionBar from '@/components/pipeline/BulkActionBar';
import RejectReasonModal from '@/components/pipeline/RejectReasonModal';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';
import TransitionModal, { TransitionPreview } from '@/components/pipeline/transition/TransitionModal';
import ApprovalsDrawer from '@/components/pipeline/approvals/ApprovalsDrawer';
import { useApprovals } from '@/components/pipeline/approvals/useApprovals';
import {
  ACTIVE_STAGES,
  CLOSED_STAGES,
  ALL_STAGES,
  SortKey,
  isStale,
  sortApplications,
  stageLabel
} from '@/components/pipeline/stages';
import {
  OwnerScope,
  isLead,
  canMove,
  canClaim,
  canRelease,
  defaultScope
} from '@/components/pipeline/ownership';
import { can, useCurrentUser } from '@/lib/permissions';

const PREFS_KEY = 'hr_hub_pipeline_prefs';

function readPrefs(): { sort?: SortKey; showClosed?: boolean; scope?: OwnerScope } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function PipelinePage() {
  const user = useCurrentUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<PipelineFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('score');
  const [showClosed, setShowClosed] = useState(false);
  const [scope, setScope] = useState<OwnerScope>('all');
  const [focusRecruiterId, setFocusRecruiterId] = useState('');
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const { selected, setSelected, toggleSelect, toggleSelectColumn } = usePipelineSelection();
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const [pendingReject, setPendingReject] = useState<string[] | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const [transition, setTransition] = useState<{ appId: string; preview: TransitionPreview } | null>(null);
  const [showApprovals, setShowApprovals] = useState(false);
  const [registerApp, setRegisterApp] = useState<any | null>(null);

  const lead = isLead(user);
  const notify = (tone: ToastState['tone'], message: string, onUndo?: () => void) =>
    setToast({ id: Date.now(), tone, message, onUndo });

  // ---- Preferences (per viewer) ----
  useEffect(() => {
    const p = readPrefs();
    const mayOwn = can(user, 'pipeline.claim');
    setScope(p.scope && (p.scope !== 'me' || mayOwn) ? p.scope : defaultScope(user));
    if (p.sort) setSort(p.sort);
    if (p.showClosed) setShowClosed(true);

    // Deep links: ?view=approvals · ?filter=stale · ?scope=unassigned|me|all · ?jobId=<id>
    const q = new URLSearchParams(window.location.search);
    const linkScope = q.get('scope') as OwnerScope | null;
    if (linkScope && ['me', 'unassigned', 'all'].includes(linkScope) && (linkScope !== 'me' || mayOwn)) setScope(linkScope);
    if (q.get('filter') === 'stale') {
      setFilters((f) => ({ ...f, staleOnly: true }));
      if (!linkScope) setScope(mayOwn && !isLead(user) ? 'me' : 'all');
    }
    if (q.get('view') === 'approvals') setShowApprovals(true);
    const linkJob = q.get('jobId');
    if (linkJob) {
      setFilters((f) => ({ ...f, jobId: linkJob }));
      if (!linkScope) setScope('all');
    }

    setPrefsLoaded(true);
  }, [user]);

  useEffect(() => {
    if (!prefsLoaded) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ sort, showClosed, scope }));
    } catch {}
  }, [sort, showClosed, scope, prefsLoaded]);

  // ---- Data ----
  const loadRecruiters = useCallback(() => {
    api.getRecruiters()
      .then((res: any) => res.success && setRecruiters(res.data || []))
      .catch(() => {});
  }, []);

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.jobId) params.jobId = filters.jobId;
      if (filters.companyId) params.companyId = filters.companyId;
      if (filters.jobFamily) params.jobFamily = filters.jobFamily;
      if (filters.minScore) params.minScore = filters.minScore;
      if (filters.search.trim()) params.search = filters.search.trim();
      const res = await api.getPipeline(params);
      if (res.success) setApplications(res.data || []);
    } catch (err: any) {
      notify('error', 'Failed to load pipeline: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.jobId, filters.companyId, filters.jobFamily, filters.minScore, filters.search]);

  useEffect(() => {
    api.getJobs({ activeOnly: false })
      .then((res: any) => res.success && setJobs(res.data || []))
      .catch(() => {});
    loadRecruiters();
  }, [loadRecruiters]);

  const approvals = useApprovals((tone, message) => notify(tone, message), () => loadPipeline());

  useEffect(() => {
    const t = setTimeout(loadPipeline, 300);
    return () => clearTimeout(t);
  }, [loadPipeline]);

  // Esc clears selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pendingReject && !selectedCandidate) setSelected(new Set());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingReject, selectedCandidate, setSelected]);

  // ---- Derived ----
  const ownerCounts = useMemo(
    () => ({
      me: applications.filter((a) => user && a.assignedRecruiterId === user.id).length,
      unassigned: applications.filter((a) => !a.assignedRecruiterId).length,
      all: applications.length
    }),
    [applications, user]
  );

  const visibleApps = useMemo(() => {
    let list = applications;
    if (scope === 'me') list = list.filter((a) => user && a.assignedRecruiterId === user.id);
    else if (scope === 'unassigned') list = list.filter((a) => !a.assignedRecruiterId);
    else if (focusRecruiterId) list = list.filter((a) => a.assignedRecruiterId === focusRecruiterId);
    if (filters.staleOnly) list = list.filter(isStale);
    return list;
  }, [applications, scope, focusRecruiterId, filters.staleOnly, user]);

  // Drop selections that are no longer visible
  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(visibleApps.map((a) => a.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleApps, setSelected]);

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
  const staleCount = visibleApps.filter(isStale).length;

  const selectedApps = applications.filter((a) => selected.has(a.id));
  const claimableSelected = selectedApps.filter((a) => canClaim(user, a));
  const releasableSelected = selectedApps.filter((a) => canRelease(user, a));
  const movableSelected = selectedApps.filter((a) => canMove(user, a));

  // ---- Moving ----
  const applyMove = useCallback(
    async (ids: string[], status: string, note?: string, isUndo = false) => {
      const prevStatus = new Map<string, string>();
      applications.forEach((a) => {
        if (ids.includes(a.id) && a.status !== status && canMove(user, a)) prevStatus.set(a.id, a.status);
      });
      const movedIds = [...prevStatus.keys()];
      if (movedIds.length === 0) return;

      const snapshot = applications;
      const now = new Date().toISOString();
      const me = user ? { id: user.id, name: user.name } : null;
      setApplications((list) =>
        list.map((a) => {
          if (!prevStatus.has(a.id)) return a;
          // Recruiters auto-claim unassigned cards they move (mirrors backend)
          const claim = !a.assignedRecruiterId && !can(user, 'pipeline.move.any') && me
            ? { assignedRecruiterId: me.id, assignedRecruiter: me }
            : {};
          return { ...a, ...claim, status, stageChangedAt: now };
        })
      );
      setBusyIds(new Set(movedIds));

      try {
        const res = await api.bulkUpdateApplicationStatus({ applicationIds: movedIds, status, note });
        // Not moved: owned by someone else, or the move needs the validation form / approval
        const denied: string[] = [...(res.data?.deniedIds || []), ...(res.data?.needsReview || [])];
        if (denied.length) {
          // Someone else owns these now — put them back and refresh ownership
          setApplications((list) =>
            list.map((a) => (denied.includes(a.id) ? snapshot.find((s) => s.id === a.id) || a : a))
          );
          loadPipeline();
        }
        setSelected(new Set());
        if (isUndo) {
          notify('success', 'Move undone.');
          return;
        }
        const okIds = movedIds.filter((id) => !denied.includes(id));
        if (!okIds.length) {
          notify('error', res.message);
          return;
        }
        const who = okIds.length === 1
          ? applications.find((a) => a.id === okIds[0])?.candidate?.fullName || '1 candidate'
          : `${okIds.length} candidates`;
        notify(
          denied.length ? 'error' : 'success',
          denied.length ? res.message : `${who} → ${stageLabel(status)}`,
          () => {
            // Revert each group back to its original stage
            const byStatus = new Map<string, string[]>();
            okIds.forEach((id) => {
              const st = prevStatus.get(id)!;
              byStatus.set(st, [...(byStatus.get(st) || []), id]);
            });
            // Moving back needs a reason at the stage gate
            byStatus.forEach((groupIds, st) => applyMoveRef.current(groupIds, st, 'Undo', true));
          }
        );
      } catch (err: any) {
        setApplications(snapshot);
        notify('error', 'Failed to move: ' + err.message);
      } finally {
        setBusyIds(new Set());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applications, user, loadPipeline]
  );

  // Undo callbacks outlive the render they were created in
  const applyMoveRef = useRef(applyMove);
  applyMoveRef.current = applyMove;

  // Single card: ask the stage gate what the move needs (direct → move, otherwise open the form)
  const startTransition = async (app: any, status: string) => {
    setBusyIds(new Set([app.id]));
    try {
      const res = await api.previewTransition(app.id, status);
      const preview: TransitionPreview = res.data;
      if (preview.direct && !preview.blocks.length) applyMove([app.id], status);
      else setTransition({ appId: app.id, preview });
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setBusyIds(new Set());
    }
  };

  const requestMove = (ids: string[], status: string) => {
    const targets = ids.map((id) => applications.find((x) => x.id === id)).filter(Boolean) as any[];
    const allowed = targets.filter((a) => a.status !== status && canMove(user, a));
    if (allowed.length === 0) {
      const pending = targets.some((a) => a.pendingRequest);
      notify(
        'error',
        pending
          ? 'This candidate has a stage move awaiting approval.'
          : 'This candidate is owned by another recruiter. Ask a TA Lead to reassign it.'
      );
      return;
    }
    if (allowed.length === 1) startTransition(allowed[0], status);
    else if (status === 'REJECTED') setPendingReject(allowed.map((a) => a.id));
    else applyMove(allowed.map((a) => a.id), status);
  };

  // ---- Ownership actions ----
  const runOwnership = async (ids: string[], action: () => Promise<any>) => {
    setBusyIds(new Set(ids));
    try {
      const res = await action();
      notify(res.data?.conflicts?.length ? 'error' : 'success', res.message);
      setSelected(new Set());
      await loadPipeline();
      if (lead) loadRecruiters();
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setBusyIds(new Set());
    }
  };

  const claim = (ids: string[]) => runOwnership(ids, () => api.claimApplications(ids));
  const release = (ids: string[]) => runOwnership(ids, () => api.releaseApplications(ids));
  const assign = (ids: string[], recruiterId: string) =>
    runOwnership(ids, () => api.assignApplications(ids, recruiterId));

  // ---- After the hire ----
  const dropCard = (id: string) => setApplications((list) => list.filter((a) => a.id !== id));

  const releaseHire = async (app: any) => {
    setBusyIds(new Set([app.id]));
    try {
      const res = await api.releaseHires([app.id]);
      if (!res.data?.releasedIds?.includes(app.id)) {
        notify('error', res.message);
        return;
      }
      dropCard(app.id);
      notify('success', `${app.candidate?.fullName || 'Hire'} released from the board.`, async () => {
        try {
          await api.restoreHire(app.id);
          notify('success', 'Release undone.');
        } catch (err: any) {
          notify('error', err.message);
        }
        loadPipeline();
      });
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setBusyIds(new Set());
    }
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
      notify('error', 'Failed to open profile: ' + err.message);
    } finally {
      setBusyIds(new Set());
    }
  };

  const visibleStages = showClosed ? ALL_STAGES : ACTIVE_STAGES;
  const emptyMine = !loading && scope === 'me' && ownerCounts.me === 0;

  return (
    <div className="space-y-4 max-w-full">
      <PipelineHeader
        approvalsCount={approvals.toDecideCount}
        onOpenApprovals={() => {
          setShowApprovals(true);
          approvals.load();
        }}
        stats={{ active: activeCount, stale: staleCount, offering: grouped.OFFERING.length, hired: grouped.HIRED.length }}
        loading={loading && !applications.length}
      />

      <OwnerScopeBar
        scope={scope}
        onScopeChange={(s) => {
          setScope(s);
          setFocusRecruiterId('');
        }}
        ownerCounts={ownerCounts}
        showMine={can(user, 'pipeline.claim')}
        recruiters={lead ? recruiters : null}
        focusRecruiterId={focusRecruiterId}
        onFocusRecruiter={setFocusRecruiterId}
      />

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
        onRefresh={() => {
          loadPipeline();
          loadRecruiters();
        }}
      />

      {emptyMine && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-blue-900">
            You don&apos;t own any candidates yet. <b>{ownerCounts.unassigned}</b> candidates are waiting in the queue.
          </span>
          {ownerCounts.unassigned > 0 && (
            <button
              type="button"
              onClick={() => setScope('unassigned')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              View queue
            </button>
          )}
        </div>
      )}

      <FunnelStrip grouped={grouped} activeCount={activeCount} />

      <PipelineBoard
        stages={visibleStages}
        grouped={grouped}
        loading={loading}
        user={user}
        selected={selected}
        draggingIds={draggingIds}
        busyIds={busyIds}
        movableSelectedIds={movableSelected.map((a) => a.id)}
        onToggleSelect={toggleSelect}
        onToggleSelectColumn={toggleSelectColumn}
        onMove={requestMove}
        onClaim={(id) => claim([id])}
        onRegisterHire={setRegisterApp}
        onReleaseHire={releaseHire}
        onOpen={openDetail}
        onDragStart={setDraggingIds}
        onDragEnd={() => setDraggingIds([])}
      />

      <AnimatePresence>
        {selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            claimableCount={claimableSelected.length}
            releasableCount={releasableSelected.length}
            canMove={movableSelected.length > 0}
            recruiters={lead ? recruiters : null}
            onMove={(status) => requestMove(movableSelected.map((a) => a.id), status)}
            onClaim={() => claim(claimableSelected.map((a) => a.id))}
            onRelease={() => release(releasableSelected.map((a) => a.id))}
            onAssign={(rid) => assign([...selected], rid)}
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
        {transition && (
          <TransitionModal
            applicationId={transition.appId}
            preview={transition.preview}
            onClose={() => setTransition(null)}
            onDone={({ pending, message }) => {
              setTransition(null);
              notify('success', message);
              loadPipeline();
              if (pending) approvals.load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showApprovals && (
          <ApprovalsDrawer
            data={approvals.data}
            loading={approvals.loading}
            onClose={() => setShowApprovals(false)}
            onDecide={approvals.decide}
            onCancel={approvals.cancel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {registerApp && (
          <EmployeeFormModal
            applicationId={registerApp.id}
            onClose={() => setRegisterApp(null)}
            onSaved={(_, message) => {
              dropCard(registerApp.id);
              setRegisterApp(null);
              notify('success', message);
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
