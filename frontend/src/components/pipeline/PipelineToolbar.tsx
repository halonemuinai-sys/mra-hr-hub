'use client';

import React from 'react';
import { Search, RefreshCw, Archive, ArrowUpDown, AlertTriangle, X } from 'lucide-react';
import { SORT_OPTIONS, SortKey, JOB_FAMILY_OPTIONS } from './stages';
import { useCompanies } from '@/components/companies/useCompanies';

export type PipelineFilters = {
  search: string;
  jobId: string;
  /** '' = all PTs, 'none' = jobs without a PT */
  companyId: string;
  jobFamily: string;
  minScore: string;
  staleOnly: boolean;
};

export const EMPTY_FILTERS: PipelineFilters = {
  search: '',
  jobId: '',
  companyId: '',
  jobFamily: '',
  minScore: '',
  staleOnly: false
};

interface Props {
  filters: PipelineFilters;
  onFiltersChange: (f: PipelineFilters) => void;
  jobs: any[];
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  showClosed: boolean;
  onToggleClosed: () => void;
  closedCount: number;
  staleCount: number;
  loading: boolean;
  onRefresh: () => void;
}

const selectCls =
  'px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30';

export default function PipelineToolbar({
  filters,
  onFiltersChange,
  jobs,
  sort,
  onSortChange,
  showClosed,
  onToggleClosed,
  closedCount,
  staleCount,
  loading,
  onRefresh
}: Props) {
  const set = (patch: Partial<PipelineFilters>) => onFiltersChange({ ...filters, ...patch });
  const { companies } = useCompanies(true);
  const hasFilters = filters.search || filters.jobId || filters.companyId || filters.jobFamily || filters.minScore || filters.staleOnly;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search name / email / headline…"
          className="pl-8 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
      </div>

      {companies.length > 0 && (
        <select
          value={filters.companyId}
          onChange={(e) => set({ companyId: e.target.value, jobId: '' })}
          aria-label="Company (PT)"
          className={`${selectCls} max-w-[200px]`}
        >
          <option value="">All Companies</option>
          <option value="none">No company set</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      )}

      <select value={filters.jobId} onChange={(e) => set({ jobId: e.target.value })} className={`${selectCls} max-w-[200px]`}>
        <option value="">All Jobs</option>
        {jobs
          .filter((j) => !filters.companyId || (filters.companyId === 'none' ? !j.companyId : j.companyId === filters.companyId))
          .map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
      </select>

      <select value={filters.jobFamily} onChange={(e) => set({ jobFamily: e.target.value })} className={selectCls}>
        <option value="">All Job Families</option>
        {JOB_FAMILY_OPTIONS.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>

      <select value={filters.minScore} onChange={(e) => set({ minScore: e.target.value })} className={selectCls}>
        <option value="">All ATS Scores</option>
        <option value="85">Top Match (≥85%)</option>
        <option value="70">Qualified (≥70%)</option>
      </select>

      <div className="relative">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className={`${selectCls} pl-8`}
          aria-label="Sort cards"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => set({ staleOnly: !filters.staleOnly })}
        className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
          filters.staleOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
        }`}
        title="Show only candidates with no movement for ≥7 days"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Stalled ({staleCount})
      </button>

      <button
        type="button"
        onClick={onToggleClosed}
        className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
          showClosed ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Archive className="w-3.5 h-3.5" />
        Archive ({closedCount})
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={() => onFiltersChange(EMPTY_FILTERS)}
          className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </button>
      )}

      <button
        type="button"
        onClick={onRefresh}
        className="ml-auto p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        title="Refresh"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
