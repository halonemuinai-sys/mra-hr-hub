'use client';

import React from 'react';
import { CloudUpload, Megaphone, Pencil, Route, Users } from 'lucide-react';
import { getInitials } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import { fmtDate, joinBadge, statusMeta } from './employeeFormat';
import TalentaStatusBadge from './talenta/TalentaStatusBadge';

interface Props {
  rows: any[];
  loading: boolean;
  onEdit: (emp: any) => void;
  onAnnounce: (emp: any) => void;
  /** HR may fill payroll data and send to Talenta */
  canSync: boolean;
  talentaMode: string | null;
  onTalenta: (emp: any) => void;
  /** CV received → hired → onboarding timeline */
  onJourney: (emp: any) => void;
}

export default function EmployeeTable({ rows, loading, onEdit, onAnnounce, canSync, talentaMode, onTalenta, onJourney }: Props) {
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
        <Users className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-800 mt-2">No registered employees yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Register Hired candidates from the &quot;Awaiting Registration&quot; tab or straight from the pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <th className="px-4 py-2.5 font-bold">Employee</th>
            <th className="px-4 py-2.5 font-bold">Position</th>
            <th className="px-4 py-2.5 font-bold">Placement</th>
            <th className="px-4 py-2.5 font-bold">Status</th>
            <th className="px-4 py-2.5 font-bold">Joined</th>
            <th className="px-4 py-2.5 font-bold">Announcement</th>
            <th className="px-4 py-2.5 font-bold">Talenta</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((e) => {
            const st = statusMeta(e.employmentStatus);
            const jb = joinBadge(e.joinDate);
            return (
              <tr key={e.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {getInitials(e.fullName)}
                    </span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onJourney(e)}
                        className="block max-w-full font-bold text-slate-900 hover:text-blue-700 truncate text-left"
                      >
                        {e.fullName}
                      </button>
                      <p className="text-[11px] text-slate-500 font-mono">{e.employeeNo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{e.position}</p>
                  <p className="text-[11px] text-slate-500">{e.managerName ? `Manager: ${e.managerName}` : e.department}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-700">{e.department}</p>
                  <p className="text-[11px] text-slate-500">{[e.division, e.workLocation].filter(Boolean).join(' · ')}</p>
                  {e.company ? (
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] font-bold" title={e.company.name}>
                      {e.company.code}
                    </span>
                  ) : (
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">No PT set</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 tabular-nums">{fmtDate(e.joinDate)}</p>
                  {jb && (
                    <span className={`inline-block whitespace-nowrap mt-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold ${jb.cls}`}>
                      {jb.label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {e.announcedAt ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700"
                      title={`by ${shortName(e.announcedBy?.name)}`}
                    >
                      <Megaphone className="w-3.5 h-3.5" /> {fmtDate(e.announcedAt)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Not announced</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TalentaStatusBadge emp={e} currentMode={talentaMode} />
                </td>
                <td className="px-4 py-3">
                  {
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onJourney(e)}
                        title="Recruitment journey: from CV received to hired"
                        className="px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-[11px] font-bold flex items-center gap-1"
                      >
                        <Route className="w-3.5 h-3.5" /> Journey
                      </button>
                      {canSync && (
                        <button
                          type="button"
                          onClick={() => onTalenta(e)}
                          title="Payroll data & send to Talenta"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1"
                        >
                          <CloudUpload className="w-3.5 h-3.5" /> Talenta
                        </button>
                      )}
                      {e.canEdit && (
                        <button
                          type="button"
                          onClick={() => onAnnounce(e)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                            e.announcedAt
                              ? 'border border-blue-200 text-blue-700 hover:bg-blue-50'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <Megaphone className="w-3.5 h-3.5" /> {e.announcedAt ? 'Announcement' : 'Announce'}
                        </button>
                      )}
                      {e.canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(e)}
                          aria-label={`Edit ${e.fullName}`}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
