'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import CompanySelect from '@/components/companies/CompanySelect';
import { useCompanies } from '@/components/companies/useCompanies';
import SkillTagInput from '@/components/jobs/SkillTagInput';
import { DIVISIONS, EDUCATION_LEVELS } from '@/components/jobs/jobOptions';
import { MPR_EMPLOYMENT_TYPES, MPR_REASONS } from './manpowerFormat';

interface Props {
  /** null = new request */
  request: any | null;
  onClose: () => void;
  onSaved: (request: any, message: string) => void;
}

const toForm = (r: any) => ({
  companyId: r?.companyId || '',
  positionTitle: r?.positionTitle || '',
  department: r?.department || '',
  division: r?.division || DIVISIONS[0],
  location: r?.location || 'Jakarta Selatan',
  employmentType: r?.employmentType || 'Full-time',
  headcount: String(r?.headcount || 1),
  reason: r?.reason || 'ADDITIONAL',
  replacementFor: r?.replacementFor || '',
  justification: r?.justification || '',
  priority: r?.priority || 'NORMAL',
  targetStartDate: r?.targetStartDate ? String(r.targetStartDate).slice(0, 10) : '',
  salaryMin: r?.salaryMin == null ? '' : String(r.salaryMin),
  salaryMax: r?.salaryMax == null ? '' : String(r.salaryMax),
  minEducation: r?.minEducation || 'S1',
  minExperience: r?.minExperience == null ? '' : String(r.minExperience),
  skills: (r?.skills || []) as string[]
});

function Field({ label, required, hint, className = '', children }: { label: string; required?: boolean; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-[11px] font-bold text-slate-600">
        {label}
        {required && <span className="text-amber-600"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}

/** Submit or edit a manpower request */
export default function ManpowerFormModal({ request, onClose, onSaved }: Props) {
  const editing = !!request;
  const [form, setForm] = useState(() => toForm(request));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { companies } = useCompanies(true);
  const set = (patch: Partial<ReturnType<typeof toForm>>) => setForm((f) => ({ ...f, ...patch }));

  const divisionOptions = DIVISIONS.includes(form.division) ? DIVISIONS : [form.division, ...DIVISIONS];
  const digits = (v: string) => v.replace(/\D/g, '');
  const money = (v: string) => (v ? Number(v).toLocaleString('id-ID') : '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, headcount: Number(form.headcount) };
      const res = editing ? await api.updateManpowerRequest(request.id, payload) : await api.createManpowerRequest(payload);
      onSaved(res.data, res.message);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const input =
    'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onSubmit={submit}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl"
      >
        <div className="flex items-start gap-3 p-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">{editing ? `Edit ${request.requestNo}` : 'New manpower request'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">A TA Lead or the HR Director approves it; then TA opens it as a job posting.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <section className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Position</h4>
            <Field label="Company (PT)" required hint="The legal entity that will employ the new hire.">
              <CompanySelect companies={companies} value={form.companyId} onChange={(id) => set({ companyId: id })} required />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Position title" required className="sm:col-span-2">
                <input required value={form.positionTitle} onChange={(e) => set({ positionTitle: e.target.value })} className={input} placeholder="e.g. Boutique Supervisor" />
              </Field>
              <Field label="Department" required>
                <input required value={form.department} onChange={(e) => set({ department: e.target.value })} className={input} placeholder="e.g. Retail Operations" />
              </Field>
              <Field label="Division / business unit" required>
                <select value={form.division} onChange={(e) => set({ division: e.target.value })} className={input}>
                  {divisionOptions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Work location" required>
                <input required value={form.location} onChange={(e) => set({ location: e.target.value })} className={input} />
              </Field>
              <Field label="Employment type">
                <select value={form.employmentType} onChange={(e) => set({ employmentType: e.target.value })} className={input}>
                  {MPR_EMPLOYMENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Headcount" required>
                <input required type="number" min={1} max={50} value={form.headcount} onChange={(e) => set({ headcount: e.target.value })} className={input} />
              </Field>
              <Field label="Target start date">
                <input type="date" value={form.targetStartDate} onChange={(e) => set({ targetStartDate: e.target.value })} className={input} />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Reason</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Reason">
              {MPR_REASONS.map((r) => {
                const active = form.reason === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set({ reason: r.key })}
                    className={`text-left rounded-xl border p-3 transition-colors ${active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <p className={`text-xs font-bold ${active ? 'text-blue-800' : 'text-slate-800'}`}>{r.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{r.hint}</p>
                  </button>
                );
              })}
            </div>
            {form.reason === 'REPLACEMENT' && (
              <Field label="Replacing" required>
                <input required value={form.replacementFor} onChange={(e) => set({ replacementFor: e.target.value })} className={input} placeholder="Name of the employee who is leaving" />
              </Field>
            )}
            <Field label="Justification" required hint="Why the role is needed now — the approver decides on this.">
              <textarea
                required
                rows={3}
                value={form.justification}
                onChange={(e) => set({ justification: e.target.value })}
                className={`${input} resize-none`}
                placeholder="e.g. New boutique opens in January; the current team cannot cover two shifts."
              />
            </Field>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.priority === 'URGENT'}
                onChange={(e) => set({ priority: e.target.checked ? 'URGENT' : 'NORMAL' })}
                className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500/30"
              />
              Urgent — flag it for the approver
            </label>
          </section>

          <section className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Budget & requirements</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Monthly salary budget — min (IDR)">
                <input inputMode="numeric" value={money(form.salaryMin)} onChange={(e) => set({ salaryMin: digits(e.target.value) })} className={input} placeholder="8.000.000" />
              </Field>
              <Field label="Monthly salary budget — max (IDR)" hint="Offers above the max need TA Lead approval later.">
                <input inputMode="numeric" value={money(form.salaryMax)} onChange={(e) => set({ salaryMax: digits(e.target.value) })} className={input} placeholder="12.000.000" />
              </Field>
              <Field label="Minimum education">
                <select value={form.minEducation} onChange={(e) => set({ minEducation: e.target.value })} className={input}>
                  {EDUCATION_LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Minimum experience (years)">
                <input type="number" min={0} max={40} value={form.minExperience} onChange={(e) => set({ minExperience: e.target.value })} className={input} />
              </Field>
              <Field label="Key skills" className="sm:col-span-2" hint="Become the must-have ATS keywords when the job is opened.">
                <SkillTagInput value={form.skills} onChange={(skills: string[]) => set({ skills })} placeholder="Type a skill and press Enter" />
              </Field>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-amber-700 min-w-0 truncate" role="alert">
            {error}
          </p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editing ? 'Save changes' : 'Submit for approval'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
