'use client';

import React from 'react';
import { ArrowRight, History, Users } from 'lucide-react';
import { getInitials } from '@/components/pipeline/stages';
import { daysAgo, historyStatus, scoreTone, Segment, SEGMENT_META } from './talentPoolFormat';

interface Props {
  rows: any[];
  loading: boolean;
  /** Open the job view for this job */
  onPickJob: (jobId: string) => void;
}

/** Everyone in the pool with the open jobs they fit best */
export default function PoolList({ rows, loading, onPickJob }: Props) {
  if (loading && !rows.length)
    return (
      <div className="p-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  if (!rows.length)
    return (
      <div className="px-6 py-16 text-center">
        <Users className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-800 mt-2">Nobody in this part of the pool</p>
        <p className="text-xs text-slate-500 mt-1">Candidates land here when they are moved to Talent Pool or rejected for another job.</p>
      </div>
    );

  return (
    <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="bg-slate-50/80 text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <th className="px-5 py-3 font-bold">Candidate</th>
            <th className="px-5 py-3 font-bold">Last application</th>
            <th className="px-5 py-3 font-bold w-[40%]">Best open jobs</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const c = r.candidate;
            const seg = SEGMENT_META[r.segment as Segment];
            const last = c.history[0];
            return (
              <tr key={c.id} className="align-top transition-colors hover:bg-blue-50/30">
                <td className="px-5 py-5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{getInitials(c.fullName)}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{c.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[260px]">{c.headline || c.currentCompany || '—'}</p>
                      <span title={seg.hint} className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${seg.cls}`}>
                        {seg.label}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5">
                  {last ? (
                    <div className="text-[11px] text-slate-600">
                      <p className="font-semibold text-slate-800 truncate max-w-[260px]">{last.jobTitle}</p>
                      <p className="flex items-center gap-1 text-slate-500">
                        <History className="w-3 h-3" /> {historyStatus(last)} · {daysAgo(last.date)}
                      </p>
                      {c.history.length > 1 && <p className="text-slate-400">+{c.history.length - 1} earlier application{c.history.length > 2 ? 's' : ''}</p>}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-5">
                  {r.bestJobs.length ? (
                    <div className="flex flex-col gap-1">
                      {r.bestJobs.map((j: any) => (
                        <button
                          key={j.jobId}
                          type="button"
                          onClick={() => onPickJob(j.jobId)}
                          className="group flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                        >
                          <span className={`w-8 text-right font-black tabular-nums ${scoreTone(j.atsScore)}`}>{j.atsScore}</span>
                          {j.companyCode && <span className="px-1 rounded bg-slate-900 text-white font-mono text-[9px] font-bold">{j.companyCode}</span>}
                          <span className="flex-1 truncate text-slate-700 font-semibold">{j.title}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">No open job above the minimum score</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
