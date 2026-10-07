'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { Company } from './useCompanies';

interface Props {
  companies: Company[];
  value: string;
  onChange: (id: string) => void;
  /** Filter mode: first option is "All companies" (+ optional "No company set") */
  allLabel?: string;
  withUnassigned?: boolean;
  /** Form mode: placeholder shown when nothing is chosen */
  placeholder?: string;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
}

/** PT dropdown — filter (All companies) or form field (choose a PT). Inactive PTs only appear when already selected. */
export default function CompanySelect({ companies, value, onChange, allLabel, withUnassigned, placeholder, required, className = '', ariaLabel = 'Company (PT)' }: Props) {
  const options = companies.filter((c) => c.isActive || c.id === value);
  return (
    <div className={`relative ${className}`}>
      <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
      >
        {allLabel !== undefined ? <option value="">{allLabel}</option> : <option value="">{placeholder || '— Choose a company (PT) —'}</option>}
        {withUnassigned && <option value="none">No company set</option>}
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.code}){c.isActive ? '' : ' — inactive'}
          </option>
        ))}
      </select>
    </div>
  );
}
