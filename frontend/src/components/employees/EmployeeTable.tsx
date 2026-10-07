'use client';

import React from 'react';
import { Megaphone, Pencil, Users } from 'lucide-react';
import { getInitials } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import { fmtDate, joinBadge, statusMeta } from './employeeFormat';

interface Props {
  rows: any[];
  loading: boolean;
  onEdit: (emp: any) => void;
  onAnnounce: (emp: any) => void;
}

export default function EmployeeTable({ rows, loading, onEdit, onAnnounce }: Props) {
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
        <p className="text-sm font-bold text-slate-800 mt-2">Belum ada karyawan terdaftar</p>
        <p className="text-xs text-slate-500 mt-1">Daftarkan kandidat Hired dari tab &quot;Menunggu Registrasi&quot; atau langsung dari pipeline.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <th className="px-4 py-2.5 font-bold">Karyawan</th>
            <th className="px-4 py-2.5 font-bold">Jabatan</th>
            <th className="px-4 py-2.5 font-bold">Penempatan</th>
            <th className="px-4 py-2.5 font-bold">Status</th>
            <th className="px-4 py-2.5 font-bold">Bergabung</th>
            <th className="px-4 py-2.5 font-bold">Pengumuman</th>
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
                      <p className="font-bold text-slate-900 truncate">{e.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{e.employeeNo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{e.position}</p>
                  <p className="text-[11px] text-slate-500">{e.managerName ? `Atasan: ${e.managerName}` : e.department}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-700">{e.department}</p>
                  <p className="text-[11px] text-slate-500">{[e.division, e.workLocation].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 tabular-nums">{fmtDate(e.joinDate)}</p>
                  {jb && <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold ${jb.cls}`}>{jb.label}</span>}
                </td>
                <td className="px-4 py-3">
                  {e.announcedAt ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700" title={`oleh ${shortName(e.announcedBy?.name)}`}>
                      <Megaphone className="w-3.5 h-3.5" /> {fmtDate(e.announcedAt)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Belum diumumkan</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {e.canEdit && (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAnnounce(e)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                          e.announcedAt
                            ? 'border border-blue-200 text-blue-700 hover:bg-blue-50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Megaphone className="w-3.5 h-3.5" /> {e.announcedAt ? 'Pengumuman' : 'Umumkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(e)}
                        aria-label={`Ubah ${e.fullName}`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
