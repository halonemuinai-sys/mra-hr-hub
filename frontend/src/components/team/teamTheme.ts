import { shortName } from '@/components/pipeline/ownership';

/** Ordered funnel stages as one blue ramp (amber = new, emerald = offer) — matches the pipeline columns */
export const STAGE_COLORS: { key: string; label: string; color: string }[] = [
  { key: 'APPLIED', label: 'Baru', color: '#f59e0b' },
  { key: 'ATS_SCREENED', label: 'Lolos ATS', color: '#93c5fd' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#60a5fa' },
  { key: 'INTERVIEW_HR', label: 'Interview HR', color: '#2563eb' },
  { key: 'INTERVIEW_USER', label: 'Interview User', color: '#1e40af' },
  { key: 'OFFERING', label: 'Offering', color: '#059669' }
];

export const firstName = (name?: string) => shortName(name).split(' ')[0];

/** Utilization tone: <70% comfortable, 70–100% busy, >100% over capacity */
export function loadTone(utilization: number | null) {
  if (utilization == null) return { bar: 'bg-slate-300', text: 'text-slate-500', label: '—' };
  if (utilization > 100) return { bar: 'bg-amber-600', text: 'text-amber-700', label: 'Kelebihan beban' };
  if (utilization >= 70) return { bar: 'bg-blue-600', text: 'text-blue-700', label: 'Sibuk' };
  return { bar: 'bg-emerald-600', text: 'text-emerald-700', label: 'Longgar' };
}

export function toCsv(rows: (string | number | null)[][]) {
  return rows
    .map((r) => r.map((v) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))).join(','))
    .join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
