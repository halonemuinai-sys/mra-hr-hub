'use client';

import React from 'react';
import { Star } from 'lucide-react';

export type GateField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'datetime' | 'currency' | 'rating' | 'checkbox';
  required?: boolean;
  options?: string[];
  value?: any;
};

interface Props {
  field: GateField;
  value: any;
  onChange: (value: any) => void;
  /** Quick-pick chips appended to a textarea (e.g. rejection reasons) */
  suggestions?: string[];
}

const inputCls =
  'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

/** Renders one stage-gate form field by type (field schema comes from backend/config/stageRules.js) */
export default function StageField({ field, value, onChange, suggestions }: Props) {
  const label = (
    <span className="text-[11px] font-bold text-slate-700">
      {field.label}
      {field.required && <span className="text-amber-600"> *</span>}
    </span>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <label className="block space-y-1">
          {label}
          {suggestions && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange(value ? `${value}${String(value).trim().endsWith('.') ? '' : ','} ${s}` : s)}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:border-slate-400"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-none`} />
        </label>
      );

    case 'select':
      return (
        <label className="block space-y-1">
          {label}
          <div className="flex gap-1.5">
            {(field.options || []).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  value === opt ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </label>
      );

    case 'rating':
      return (
        <div className="space-y-1">
          {label}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star`}>
                <Star className={`w-6 h-6 ${n <= Number(value || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
              </button>
            ))}
            {value ? <span className="ml-2 text-xs font-bold text-slate-700">{value}/5</span> : null}
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600"
          />
          {label}
        </label>
      );

    case 'currency':
      return (
        <label className="block space-y-1">
          {label}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
            <input
              inputMode="numeric"
              value={value ? Number(value).toLocaleString('id-ID') : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                onChange(digits ? Number(digits) : '');
              }}
              className={`${inputCls} pl-9 tabular-nums`}
              placeholder="0"
            />
          </div>
        </label>
      );

    case 'date':
    case 'datetime':
      return (
        <label className="block space-y-1">
          {label}
          <input
            type={field.type === 'date' ? 'date' : 'datetime-local'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
          />
        </label>
      );

    default:
      return (
        <label className="block space-y-1">
          {label}
          <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} />
        </label>
      );
  }
}
