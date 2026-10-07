'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Company } from './useCompanies';

interface Props {
  company: Company | null;
  onClose: () => void;
  onSaved: (company: Company, message: string) => void;
}

const FIELDS: { key: keyof Company; label: string; hint?: string; required?: boolean; span?: boolean; placeholder?: string }[] = [
  { key: 'name', label: 'Legal name', required: true, span: true, placeholder: 'PT Mugi Rekso Abadi' },
  { key: 'code', label: 'Short code', required: true, hint: 'Shown in lists and file names, e.g. MRA', placeholder: 'MRA' },
  { key: 'npwp', label: 'Company NPWP', hint: '15 or 16 digits (optional)' },
  { key: 'talentaBranch', label: 'Default Talenta branch', hint: 'Prefills the Branch field when sending new employees to Talenta' },
  { key: 'address', label: 'Registered address', span: true }
];

/** Create / edit a company (PT) */
export default function CompanyFormModal({ company, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({
    name: company?.name || '',
    code: company?.code || '',
    npwp: company?.npwp || '',
    talentaBranch: company?.talentaBranch || '',
    address: company?.address || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = company ? await api.updateCompany(company.id, values) : await api.createCompany(values);
      onSaved(res.data, res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const input =
    'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onSubmit={submit}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">{company ? 'Edit company' : 'Add company (PT)'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Legal entity within MRA Group that hires and employs staff.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className={`space-y-1 ${f.span ? 'sm:col-span-2' : ''}`}>
              <span className="text-[11px] font-bold text-slate-600">
                {f.label}
                {f.required && <span className="text-amber-600"> *</span>}
              </span>
              {f.key === 'address' ? (
                <textarea
                  value={values.address}
                  rows={2}
                  onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
                  className={`${input} resize-none`}
                />
              ) : (
                <input
                  value={values[f.key as string]}
                  required={f.required}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: f.key === 'code' ? e.target.value.toUpperCase() : e.target.value }))}
                  className={`${input} ${f.key === 'code' ? 'font-mono' : ''}`}
                />
              )}
              {f.hint && <span className="block text-[10px] text-slate-400">{f.hint}</span>}
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-amber-700 min-w-0 truncate" role="alert">
            {error}
          </p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {company ? 'Save changes' : 'Add company'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
