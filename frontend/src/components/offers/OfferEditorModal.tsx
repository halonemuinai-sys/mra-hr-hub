'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Loader2, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import CompanySelect from '@/components/companies/CompanySelect';
import { useCompanies } from '@/components/companies/useCompanies';
import OfferPreview, { OfferDocument } from './OfferPreview';
import { EMPLOYMENT_TYPES, idr, OfferValues, toValues } from './offerFormat';

interface Props {
  /** New letter for this application … */
  applicationId: string;
  /** … or edit this draft */
  letter?: any;
  onClose: () => void;
  onSaved: (letter: any, message: string) => void;
}

function Field({ label, required, hint, className = '', children }: { label: string; required?: boolean; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] font-bold text-slate-700 mb-1">
        {label}
        {required && <span className="text-amber-600"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-slate-400 mt-0.5">{hint}</span>}
    </label>
  );
}

const digits = (v: string) => v.replace(/\D/g, '');
const money = (v: string) => (v ? Number(v).toLocaleString('id-ID') : '');

/** Create / edit an offer letter — form on the left, the letter as it will print on the right */
export default function OfferEditorModal({ applicationId, letter, onClose, onSaved }: Props) {
  const editing = !!letter;
  const { companies } = useCompanies();
  const [values, setValues] = useState<OfferValues | null>(editing ? toValues(letter) : null);
  const [companyId, setCompanyId] = useState<string>(editing ? letter.companyId || '' : '');
  const [doc, setDoc] = useState<OfferDocument | null>(null);
  const [loading, setLoading] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Language-dependent defaults of the prefill, so switching language only replaces untouched texts
  const defaults = useRef<Record<string, { benefits: string; workingHours: string }>>({});

  useEffect(() => {
    let alive = true;
    api
      .getOfferPrefill(applicationId, editing ? letter.language : 'id')
      .then((res) => {
        if (!alive) return;
        const v = toValues(res.data.values);
        defaults.current[v.language] = { benefits: v.benefits, workingHours: v.workingHours };
        if (!editing) {
          setValues(v);
          setCompanyId(res.data.companyId || '');
        }
      })
      .catch((err) => alive && !editing && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [applicationId, editing, letter]);

  // Live preview (debounced) — the backend builds the same document model as the PDF
  useEffect(() => {
    if (!values) return;
    const t = setTimeout(() => {
      api
        .previewOffer({ companyId, values, letterNo: letter?.letterNo })
        .then((res) => setDoc(res.data))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [values, companyId, letter?.letterNo]);

  const set = (patch: Partial<OfferValues>) => setValues((v) => (v ? { ...v, ...patch } : v));

  const switchLanguage = async (lang: 'id' | 'en') => {
    if (!values || values.language === lang) return;
    const prev = defaults.current[values.language];
    if (!defaults.current[lang]) {
      try {
        const res = await api.getOfferPrefill(applicationId, lang);
        defaults.current[lang] = { benefits: res.data.values.benefits || '', workingHours: res.data.values.workingHours || '' };
      } catch {
        defaults.current[lang] = { benefits: values.benefits, workingHours: values.workingHours };
      }
    }
    const next = defaults.current[lang];
    setValues((v) =>
      v
        ? {
            ...v,
            language: lang,
            benefits: !prev || v.benefits === prev.benefits ? next.benefits : v.benefits,
            workingHours: !prev || v.workingHours === prev.workingHours ? next.workingHours : v.workingHours
          }
        : v
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setSaving(true);
    setError('');
    try {
      const res = editing ? await api.updateOffer(letter.id, { companyId, values }) : await api.createOffer({ applicationId, companyId, values });
      onSaved(res.data, res.message);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const input =
    'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
  const total = values ? Number(values.baseSalary || 0) + values.allowances.reduce((n, a) => n + Number(a.amount || 0), 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.form
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onSubmit={submit}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative w-full max-w-7xl h-[94vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-start gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <FileSignature className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">{editing ? `Edit ${letter.letterNo}` : 'New offer letter'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Salary and start date come from the Offering stage. The preview is exactly what the PDF will say.</p>
          </div>
          {values && (
            <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50" role="group" aria-label="Letter language">
              {(['id', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchLanguage(l)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold ${values.language === l ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'}`}
                >
                  {l === 'id' ? 'Bahasa Indonesia' : 'English'}
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading || !values ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500 gap-2">
            {error ? <span className="text-amber-700 font-semibold">{error}</span> : <><Loader2 className="w-4 h-4 animate-spin" /> Preparing the letter…</>}
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <div className="overflow-y-auto p-6 space-y-5 border-r border-slate-100">
              <section className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Issuer & candidate</h4>
                <Field label="Company (PT)" required hint="Letterhead, wording and letter number follow this PT.">
                  <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} required />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Candidate name" required>
                    <input required value={values.candidateName} onChange={(e) => set({ candidateName: e.target.value })} className={input} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={values.candidateEmail} onChange={(e) => set({ candidateEmail: e.target.value })} className={input} />
                  </Field>
                  <Field label="Phone">
                    <input value={values.candidatePhone} onChange={(e) => set({ candidatePhone: e.target.value })} className={input} />
                  </Field>
                  <Field label="Address / city">
                    <input value={values.candidateAddress} onChange={(e) => set({ candidateAddress: e.target.value })} className={input} />
                  </Field>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Position</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Position" required className="sm:col-span-2">
                    <input required value={values.positionTitle} onChange={(e) => set({ positionTitle: e.target.value })} className={input} />
                  </Field>
                  <Field label="Department">
                    <input value={values.department} onChange={(e) => set({ department: e.target.value })} className={input} />
                  </Field>
                  <Field label="Work location" required>
                    <input required value={values.workLocation} onChange={(e) => set({ workLocation: e.target.value })} className={input} />
                  </Field>
                  <Field label="Employment type" required>
                    <select value={values.employmentType} onChange={(e) => set({ employmentType: e.target.value })} className={input}>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  {values.employmentType === 'Contract' ? (
                    <Field label="Contract length (months)" required>
                      <input required type="number" min={1} max={60} value={values.contractMonths} onChange={(e) => set({ contractMonths: e.target.value })} className={input} />
                    </Field>
                  ) : values.employmentType === 'Full-time' ? (
                    <Field label="Probation (months)" hint="Max. 3 months for permanent staff.">
                      <input type="number" min={0} max={6} value={values.probationMonths} onChange={(e) => set({ probationMonths: e.target.value })} className={input} />
                    </Field>
                  ) : (
                    <div />
                  )}
                  <Field label="Reporting to">
                    <input value={values.reportingTo} onChange={(e) => set({ reportingTo: e.target.value })} className={input} />
                  </Field>
                  <Field label="Working hours">
                    <input value={values.workingHours} onChange={(e) => set({ workingHours: e.target.value })} className={input} />
                  </Field>
                  <Field label="Start date" required>
                    <input required type="date" value={values.startDate} onChange={(e) => set({ startDate: e.target.value })} className={input} />
                  </Field>
                  <Field label="Offer valid until" required hint="On or before the start date.">
                    <input required type="date" value={values.validUntil} max={values.startDate || undefined} onChange={(e) => set({ validUntil: e.target.value })} className={input} />
                  </Field>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Compensation (gross / month)</h4>
                <Field label="Base salary" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                    <input
                      required
                      inputMode="numeric"
                      value={money(values.baseSalary)}
                      onChange={(e) => set({ baseSalary: digits(e.target.value) })}
                      className={`${input} pl-9 tabular-nums`}
                      placeholder="0"
                    />
                  </div>
                </Field>
                <div className="space-y-2">
                  {values.allowances.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={a.label}
                        onChange={(e) => set({ allowances: values.allowances.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                        placeholder="e.g. Tunjangan transport"
                        aria-label="Allowance name"
                        className={`${input} flex-1`}
                      />
                      <div className="relative w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                        <input
                          inputMode="numeric"
                          value={money(a.amount)}
                          onChange={(e) => set({ allowances: values.allowances.map((x, j) => (j === i ? { ...x, amount: digits(e.target.value) } : x)) })}
                          aria-label="Allowance amount"
                          className={`${input} pl-9 tabular-nums`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => set({ allowances: values.allowances.filter((_, j) => j !== i) })}
                        aria-label="Remove allowance"
                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    {values.allowances.length < 10 && (
                      <button
                        type="button"
                        onClick={() => set({ allowances: [...values.allowances, { label: '', amount: '' }] })}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add fixed allowance
                      </button>
                    )}
                    {values.allowances.length > 0 && (
                      <span className="text-[11px] text-slate-500">
                        Total fixed income <b className="text-slate-900 tabular-nums">{idr(total)}</b>
                      </span>
                    )}
                  </div>
                </div>
                <Field label="Other benefits" hint="One per line — printed as bullets.">
                  <textarea rows={4} value={values.benefits} onChange={(e) => set({ benefits: e.target.value })} className={input} />
                </Field>
                <Field label="Additional terms" hint="Optional, one per line (e.g. uniform, placement rotation, document checks).">
                  <textarea rows={3} value={values.additionalTerms} onChange={(e) => set({ additionalTerms: e.target.value })} className={input} />
                </Field>
              </section>

              <section className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Signatory</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name" required>
                    <input required value={values.signatoryName} onChange={(e) => set({ signatoryName: e.target.value })} className={input} />
                  </Field>
                  <Field label="Title" required>
                    <input required value={values.signatoryTitle} onChange={(e) => set({ signatoryTitle: e.target.value })} className={input} />
                  </Field>
                </div>
              </section>
            </div>

            <div className="hidden lg:block overflow-y-auto bg-slate-100 p-6">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Preview</p>
              {doc ? <OfferPreview doc={doc} /> : <div className="h-[600px] bg-white rounded animate-pulse" />}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50/60">
          {error && values && <p className="text-xs font-semibold text-amber-700 flex-1">{error}</p>}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !values}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editing ? 'Save draft' : 'Create draft'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
