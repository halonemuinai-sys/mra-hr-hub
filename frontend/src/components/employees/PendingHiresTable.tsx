'use client';

import React from 'react';
import { BadgeCheck, Undo2, KanbanSquare, ArchiveX } from 'lucide-react';
import { getInitials } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import { fmtDate } from './employeeFormat';

interface Props {
  rows: any[];
  loading: boolean;
  busyId: string | null;
  onRegister: (app: any) => void;
  onRestore: (app: any) => void;
}

/** HIRED applications that have no employee record yet (still on the board, or released) */
export default function PendingHiresTable({ rows, loading, busyId, onRegister, onRestore }: Props) {
  if (loading && !rows.length) {
    return (
      <div className="p-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="py-14 text-center">
        <BadgeCheck className="w-8 h-8 text-emerald-500 mx-auto" />
        <p className="text-sm font-bold text-slate-800 mt-2">Every Hired candidate is registered</p>
        <p className="text-xs text-slate-500 mt-1">New candidates appear here once they are confirmed as Hired in the pipeline.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <th className="px-4 py-2.5 font-bold">Candidate</th>
            <th className="px-4 py-2.5 font-bold">Position</th>
            <th className="px-4 py-2.5 font-bold">PIC</th>
            <th className="px-4 py-2.5 font-bold">Hired</th>
            <th className="px-4 py-2.5 font-bold">Join date</th>
            <th className="px-4 py-2.5 font-bold">Pipeline status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {getInitials(a.candidate?.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{a.candidate?.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{a.candidate?.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-800">{a.job?.title}</p>
                <p className="text-[11px] text-slate-500">{[a.job?.company?.code, a.job?.department, a.job?.division].filter(Boolean).join(' · ')}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{shortName(a.assignedRecruiter?.name) || '-'}</td>
              <td className="px-4 py-3 text-slate-600 tabular-nums">{fmtDate(a.stageChangedAt)}</td>
              <td className="px-4 py-3 tabular-nums">
                {a.joinDate ? <span className="font-semibold text-slate-800">{fmtDate(a.joinDate)}</span> : <span className="text-slate-400">Not set</span>}
              </td>
              <td className="px-4 py-3">
                {a.releasedAt ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                    <ArchiveX className="w-3 h-3" /> Released {fmtDate(a.releasedAt)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <KanbanSquare className="w-3 h-3" /> Hired column
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {a.canRegister ? (
                  <div className="flex items-center justify-end gap-1.5">
                    {a.releasedAt && (
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => onRestore(a)}
                        title="Put back in the Hired column of the pipeline"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Restore
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRegister(a)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" /> Register
                    </button>
                  </div>
                ) : (
                  <span className="block text-right text-[10px] text-slate-400">Handled by the PIC</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
