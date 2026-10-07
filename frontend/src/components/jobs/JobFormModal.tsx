'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Sparkles, Briefcase, Wallet, FileText, ScanLine } from 'lucide-react';
import { api } from '@/lib/api';
import SkillTagInput from './SkillTagInput';
import { DIVISIONS, EMPLOYMENT_TYPES, EDUCATION_LEVELS, EMPTY_JOB, JobForm, toForm } from './jobOptions';

interface Props {
  /** null = create a new job */
  job: any | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const inputCls =
  'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-slate-700">
        {label}
        {required && <span className="text-amber-600"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
    </label>
  );
}

export default function JobFormModal({ job, onClose, onSaved }: Props) {
  const isEdit = !!job;
  const [form, setForm] = useState<JobForm>(() => (job ? toForm(job) : EMPTY_JOB));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
  const set = (patch: Partial<JobForm>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    api.getHiringManagers()
      .then((res: any) => res.success && setManagers(res.data || []))
      .catch(() => {});
  }, []);

  const divisionOptions = DIVISIONS.includes(form.division) ? DIVISIONS : [form.division, ...DIVISIONS];
  const hasSalary = form.salaryVisibility !== 'UNSPECIFIED';
  const salaryInvalid = hasSalary && form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salaryInvalid) return setError('Minimum salary cannot exceed maximum salary.');
    if (!form.mustHaveSkills.length) return setError('Add at least one must-have keyword for ATS scoring.');
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        salaryMin: !hasSalary || form.salaryMin === '' ? null : Number(form.salaryMin),
        salaryMax: !hasSalary || form.salaryMax === '' ? null : Number(form.salaryMax),
        hiringManagerId: form.hiringManagerId || null
      };
      const res = isEdit ? await api.updateJob(job.id, payload) : await api.createJob(payload);
      onSaved(res.message);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const money = (v: string) => (v ? Number(v).toLocaleString('id-ID') : '');
  const parseMoney = (v: string) => v.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{isEdit ? 'Edit Job & ATS Criteria' : 'Add Job & ATS Criteria'}</h3>
            {isEdit && <p className="text-[11px] text-slate-500">Keyword changes apply to ATS scoring for future applications.</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-6 space-y-4 overflow-y-auto bg-slate-50/80">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3"><span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Briefcase className="h-4 w-4" /></span><h4 className="flex-1 text-sm font-semibold text-slate-900">Position details</h4><span className="text-xs font-medium text-slate-300">01</span></div>
            <Field label="Job title" required>
              <input required value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} placeholder="e.g. Senior React Developer" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Department" required>
                <input required value={form.department} onChange={(e) => set({ department: e.target.value })} className={inputCls} placeholder="e.g. Technology & Digital" />
              </Field>
              <Field label="Division / business unit">
                <select value={form.division} onChange={(e) => set({ division: e.target.value })} className={inputCls}>
                  {divisionOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <input value={form.location} onChange={(e) => set({ location: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Hiring Manager" hint="Only this manager can view this job’s candidates and confirm hires. Leave empty for all hiring managers.">
                <select value={form.hiringManagerId} onChange={(e) => set({ hiringManagerId: e.target.value })} className={inputCls}>
                  <option value="">— Not assigned —</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.jobCount} jobs)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Employment type">
                <select value={form.employmentType} onChange={(e) => set({ employmentType: e.target.value })} className={inputCls}>
                  {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3"><span className="rounded-lg bg-blue-50 p-2 text-blue-600"><ScanLine className="h-4 w-4" /></span><h4 className="flex-1 text-sm font-semibold text-slate-900">ATS criteria</h4><span className="text-xs font-medium text-slate-300">02</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Minimum experience (years)">
                <input type="number" min={0} value={form.minExperience} onChange={(e) => set({ minExperience: Math.max(0, parseInt(e.target.value, 10) || 0) })} className={inputCls} />
              </Field>
              <Field label="Minimum education">
                <select value={form.minEducation} onChange={(e) => set({ minEducation: e.target.value })} className={inputCls}>
                  {(EDUCATION_LEVELS.includes(form.minEducation) ? EDUCATION_LEVELS : [form.minEducation, ...EDUCATION_LEVELS]).map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs leading-relaxed text-blue-800">Prioritize core skills in <b>must-have</b>. Use <b>nice-to-have</b> for additional skills that support this role.</div>
            <Field label="Must-have keywords" required hint="Press Enter or comma to add. These keywords carry the most weight in ATS matching.">
              <SkillTagInput value={form.mustHaveSkills} onChange={(v) => set({ mustHaveSkills: v })} placeholder="e.g. React, TypeScript, REST API" />
            </Field>
            <Field label="Nice-to-have keywords" hint="Optional skills that add value.">
              <SkillTagInput value={form.niceToHaveSkills} onChange={(v) => set({ niceToHaveSkills: v })} placeholder="e.g. Docker, Prisma" tone="slate" />
            </Field>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3"><span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Wallet className="h-4 w-4" /></span><h4 className="flex-1 text-sm font-semibold text-slate-900">Compensation</h4><span className="text-xs font-medium text-slate-300">03</span></div>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-700">Salary visibility</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {([
                  ['PUBLIC', 'Public salary', 'Show the salary range to applicants.'],
                  ['CONFIDENTIAL', 'Confidential', 'Keep the budget internal; hide amounts from applicants.'],
                  ['UNSPECIFIED', 'No salary range', 'Publish without salary amounts or a budget cap.']
                ] as const).map(([value, label, hint]) => (
                  <label key={value} className={`cursor-pointer rounded-xl border p-3 transition-colors ${form.salaryVisibility === value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-800"><input type="radio" name="salaryVisibility" value={value} checked={form.salaryVisibility === value} onChange={() => set({ salaryVisibility: value })} className="accent-blue-600" />{label}</span>
                    <span className="mt-2 block text-[11px] leading-relaxed text-slate-500">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {hasSalary ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Minimum salary (IDR / month)">
                <input inputMode="numeric" value={money(form.salaryMin)} onChange={(e) => set({ salaryMin: parseMoney(e.target.value) })} className={`${inputCls} tabular-nums`} placeholder="0" />
              </Field>
              <Field label="Maximum salary (IDR / month)" hint="Also the budget cap: offers above this amount require TA Lead approval.">
                <input inputMode="numeric" value={money(form.salaryMax)} onChange={(e) => set({ salaryMax: parseMoney(e.target.value) })} className={`${inputCls} tabular-nums ${salaryInvalid ? 'border-amber-500' : ''}`} placeholder="0" />
              </Field>
            </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">Saving with no salary range removes any previously saved salary amounts. The career portal will show &ldquo;Salary not specified&rdquo;.</p>
            )}
            {form.salaryVisibility === 'CONFIDENTIAL' && <p className="text-xs text-blue-700">Amounts are visible only in the internal workspace. The maximum salary still applies to offer approvals.</p>}

          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3"><span className="rounded-lg bg-blue-50 p-2 text-blue-600"><FileText className="h-4 w-4" /></span><h4 className="flex-1 text-sm font-semibold text-slate-900">Job content</h4><span className="text-xs font-medium text-slate-300">04</span></div>
            <Field label="Job description">
              <textarea rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
            <Field label="Requirements" hint="One requirement per line, displayed as a checklist on the career portal.">
              <textarea rows={4} value={form.requirements} onChange={(e) => set({ requirements: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
          </section>

          <label className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white cursor-pointer">
            <span>
              <span className="block text-xs font-bold text-slate-900">Publish on the career portal</span>
              <span className="block text-[11px] text-slate-500">Turn off to close the job while retaining its application history.</span>
            </span>
            <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
          </label>

          {error && <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            {form.mustHaveSkills.length} must-have · {form.niceToHaveSkills.length} nice-to-have
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Publish Job'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
