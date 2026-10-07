'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { Building2, Pencil, Plus, Power } from 'lucide-react';
import { api } from '@/lib/api';
import { can, useCurrentUser } from '@/lib/permissions';
import { Company, useCompanies } from '@/components/companies/useCompanies';
import CompanyFormModal from '@/components/companies/CompanyFormModal';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

export default function CompaniesPage() {
  const user = useCurrentUser();
  const { companies, loading, reload } = useCompanies();
  const [form, setForm] = useState<{ company: Company | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = (tone: ToastState['tone'], message: string) => setToast({ id: Date.now(), tone, message });
  const manage = can(user, 'company.manage');

  const toggle = async (c: Company) => {
    setBusyId(c.id);
    try {
      const res = await api.updateCompany(c.id, { isActive: !c.isActive });
      notify('success', c.isActive ? `${c.name} deactivated — it can no longer be chosen for new jobs.` : `${c.name} reactivated.`);
      if (res.success) reload();
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Companies (PT)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Legal entities of MRA Group. Every job is posted by a PT, new employees are contracted by a PT, and the dashboard and
            report can be filtered per PT.
          </p>
        </div>
        {manage && (
          <button
            type="button"
            onClick={() => setForm({ company: null })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add company
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="px-4 py-2.5 font-bold">Code</th>
              <th className="px-4 py-2.5 font-bold">Company</th>
              <th className="px-4 py-2.5 font-bold">NPWP</th>
              <th className="px-4 py-2.5 font-bold">Talenta branch</th>
              <th className="px-4 py-2.5 font-bold text-right">Jobs</th>
              <th className="px-4 py-2.5 font-bold text-right">Employees</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && !companies.length
              ? [0, 1].map((i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-8 rounded-lg bg-slate-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              : companies.map((c) => (
                  <tr key={c.id} className={`hover:bg-slate-50/70 ${c.isActive ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold">{c.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      {c.address && <p className="text-[11px] text-slate-500 truncate max-w-xs">{c.address}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.npwp || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.talentaBranch || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <Link href={`/admin/jobs?companyId=${c.id}`} className="font-bold text-blue-700 hover:text-blue-900">
                        {c._count?.jobs ?? 0}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-700">{c._count?.employees ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                          c.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {manage && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggle(c)}
                            disabled={busyId === c.id}
                            title={c.isActive ? 'Deactivate (existing jobs and employees keep it)' : 'Reactivate'}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ company: c })}
                            aria-label={`Edit ${c.name}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        Companies are never deleted — deactivate one to stop it from being chosen for new jobs; existing jobs, employees and reports keep it.
      </p>

      <AnimatePresence>
        {form && (
          <CompanyFormModal
            company={form.company}
            onClose={() => setForm(null)}
            onSaved={(_, message) => {
              setForm(null);
              notify('success', message);
              reload();
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}</AnimatePresence>
    </div>
  );
}
