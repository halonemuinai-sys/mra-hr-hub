'use client';

import React, { useEffect, useState } from 'react';
import { Layers, AlertTriangle, Briefcase, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { can, useCurrentUser } from '@/lib/permissions';
import { getScoreBadge } from '@/lib/utils';
import { stageLabel } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';

interface Props {
  candidateId: string;
  /** Application currently shown in the drawer (highlighted) */
  currentApplicationId?: string;
}

/** Every application of this person + profiles that look like the same person */
export default function ApplicationHistory({ candidateId, currentApplicationId }: Props) {
  const user = useCurrentUser();
  const canSeeDuplicates = can(user, 'pipeline.claim');
  const [apps, setApps] = useState<any[]>([]);
  const [dupes, setDupes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCandidateApplications(candidateId).then((r: any) => r.success && setApps(r.data || [])),
      canSeeDuplicates ? api.getCandidateDuplicates(candidateId).then((r: any) => r.success && setDupes(r.data || [])) : null
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId, canSeeDuplicates]);

  if (!loading && apps.length <= 1 && dupes.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Application History ({apps.length})</h3>
          <p className="text-[11px] text-slate-500">All jobs this candidate has applied for</p>
        </div>
      </div>

      {dupes.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
          <p className="font-bold text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Possible duplicate profiles ({dupes.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {dupes.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-2 text-[11px]">
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-900 truncate">{d.fullName}</span>
                  <span className="block text-slate-500 truncate">{d.email} · {d.phone || '—'}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold text-amber-800">{d.reasons.join(' · ')}</span>
                  <span className="block text-slate-500">{d.applications} applications</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-amber-700">Check whether the same person applied using a different email before proceeding.</p>
        </div>
      )}

      {loading ? (
        <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {apps.map((a) => {
            const badge = getScoreBadge(Math.round(a.atsScore || 0));
            const current = a.id === currentApplicationId;
            return (
              <li key={a.id} className={`px-3 py-2.5 flex items-center justify-between gap-3 ${current ? 'bg-blue-50/60' : ''}`}>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {a.job?.title}
                    {current && <span className="text-[10px] font-bold text-blue-600">· current</span>}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">{stageLabel(a.status)}</span>
                    <span>·</span>
                    {new Date(a.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span>·</span>
                    <UserRound className="w-3 h-3" />
                    {a.assignedRecruiter ? shortName(a.assignedRecruiter.name) : 'unassigned'}
                    {a.job && !a.job.isActive && ' · job closed'}
                  </p>
                </div>
                <span className={`shrink-0 px-1.5 py-0.5 rounded-md border text-[10px] font-bold tabular-nums ${badge.class}`}>
                  {Math.round(a.atsScore || 0)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
