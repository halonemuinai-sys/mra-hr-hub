'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Scale, ArrowRight, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { stageLabel } from '@/components/pipeline/stages';
import { firstName } from './teamTheme';

interface Props {
  canAssign: boolean;
  onApplied: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Suggested reassignments: stalled candidates of overloaded recruiters and the long-waiting
 * unassigned queue go to the least loaded recruiter. Applied through the normal assign API.
 */
export default function RebalancePanel({ canAssign, onApplied, onError }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTeamRebalance();
      if (res.success) {
        setData(res.data);
        setPicked(new Set(res.data.suggestions.map((s: any) => s.applicationId)));
      }
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = async () => {
    const chosen = (data?.suggestions || []).filter((s: any) => picked.has(s.applicationId));
    if (!chosen.length) return;
    setApplying(true);
    try {
      const byTarget = new Map<string, string[]>();
      chosen.forEach((s: any) => byTarget.set(s.to.id, [...(byTarget.get(s.to.id) || []), s.applicationId]));
      for (const [to, ids] of byTarget) await api.assignApplications(ids, to);
      onApplied(`${chosen.length} candidates reassigned.`);
      await load();
    } catch (err: any) {
      onError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const suggestions = data?.suggestions || [];
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="h-full flex flex-col">
      {loading && !data ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : !suggestions.length ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-xs font-bold text-slate-800 mt-2">Team workload is balanced</p>
          <p className="text-[11px] text-slate-500">No stalled candidates need reassignment.</p>
        </div>
      ) : (
        <>
          {/* Before → after per recruiter */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {data.loads.map((l: any) => (
              <div key={l.id} className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1.5 text-[11px]">
                <p className="font-bold text-slate-800 truncate">{firstName(l.name)}</p>
                <p className="tabular-nums text-slate-600">
                  {l.before} <ArrowRight className="w-3 h-3 inline text-slate-400" /> <b className="text-slate-900">{l.after}</b>
                </p>
              </div>
            ))}
          </div>
          <ul className="space-y-1.5 overflow-y-auto max-h-[260px] -mr-1 pr-1">
            {suggestions.map((s: any) => (
              <li key={s.applicationId}>
                <label className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer ${picked.has(s.applicationId) ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'}`}>
                  <input type="checkbox" disabled={!canAssign} checked={picked.has(s.applicationId)} onChange={() => toggle(s.applicationId)} className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600" />
                  <span className="min-w-0 flex-1 text-[11px]">
                    <span className="block font-bold text-slate-900 truncate">{s.candidate}</span>
                    <span className="block text-slate-500 truncate">{stageLabel(s.status)} · {s.reason}</span>
                    <span className="flex items-center gap-1 text-slate-700 mt-0.5">
                      {s.from ? firstName(s.from.name) : 'Queue'}
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <b>{firstName(s.to.name)}</b>
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button type="button" onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Recalculate">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        {canAssign ? (
          <button
            type="button"
            disabled={!picked.size || applying}
            onClick={apply}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1.5"
          >
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
            Apply {picked.size || ''} assignments
          </button>
        ) : (
          <span className="text-[10px] text-slate-500">Only TA Leads can apply assignments.</span>
        )}
      </div>
    </div>
  );
}
