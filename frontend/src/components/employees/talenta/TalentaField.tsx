'use client';

import React from 'react';

export type TalentaFieldDef = {
  key: string;
  api?: string;
  section: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'number' | 'master' | 'checkbox';
  required?: boolean;
  requiredIf?: { key: string; in: string[] };
  options?: { value: string; label: string }[];
  master?: string;
  patternHint?: string;
  sensitive?: boolean;
};

export const isRequired = (f: TalentaFieldDef, values: Record<string, any>) =>
  !!f.required || (!!f.requiredIf && f.requiredIf.in.includes(String(values[f.requiredIf.key] ?? '')));

const input =
  'w-full px-3 py-2 border rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

interface Props {
  field: TalentaFieldDef;
  value: any;
  values: Record<string, any>;
  masters: Record<string, { id: number; name: string }[]> | null;
  disabled?: boolean;
  onChange: (value: any) => void;
}

/** One input of the Talenta form, rendered from the backend field definition */
export default function TalentaField({ field: f, value, values, masters, disabled, onChange }: Props) {
  const required = isRequired(f, values);
  const empty = value === undefined || value === null || String(value).trim() === '';
  const border = required && empty ? 'border-amber-300' : 'border-slate-300';

  if (f.type === 'checkbox') {
    return (
      <label className="sm:col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
        />
        {f.label}
      </label>
    );
  }

  let control: React.ReactNode;
  if (f.type === 'select' || (f.type === 'master' && masters && masters[f.master || ''])) {
    const options =
      f.type === 'select'
        ? f.options || []
        : (masters![f.master!] || []).map((m) => ({ value: m.name, label: m.name }));
    const unknown = !empty && !options.some((o) => o.value === String(value));
    control = (
      <select value={empty ? '' : String(value)} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${input} ${border}`}>
        <option value="">— Pilih —</option>
        {unknown && <option value={String(value)}>{String(value)} (tidak ada di Talenta)</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        type={f.type === 'date' ? 'date' : 'text'}
        inputMode={f.type === 'number' ? 'numeric' : undefined}
        value={value ?? ''}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={`${input} ${border}`}
      />
    );
  }

  return (
    <label className="space-y-1">
      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
        {f.label}
        {required && <span className="text-amber-600">*</span>}
        {f.patternHint && <span className="font-normal text-slate-400">({f.patternHint})</span>}
      </span>
      {control}
      {f.type === 'number' && !empty && Number.isFinite(Number(String(value).replace(/[^\d.]/g, ''))) && (
        <span className="block text-[10px] text-slate-500 tabular-nums">
          Rp {Number(String(value).replace(/[^\d.]/g, '')).toLocaleString('id-ID')}
        </span>
      )}
    </label>
  );
}
