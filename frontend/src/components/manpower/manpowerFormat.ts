// Labels & badges for manpower requests (backend/services/manpowerRules.js holds the rules)

export const MPR_STATUSES: { key: string; label: string; cls: string }[] = [
  { key: 'PENDING', label: 'Pending approval', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'APPROVED', label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'REJECTED', label: 'Rejected', cls: 'bg-slate-900 text-white border-slate-900' },
  { key: 'CANCELLED', label: 'Withdrawn', cls: 'bg-slate-100 text-slate-500 border-slate-200' }
];

export const MPR_REASONS: { key: string; label: string; hint: string }[] = [
  { key: 'REPLACEMENT', label: 'Replacement', hint: 'Someone resigned, moved or ends their contract' },
  { key: 'ADDITIONAL', label: 'Additional headcount', hint: 'More people for an existing role' },
  { key: 'NEW_POSITION', label: 'New position', hint: 'A role that does not exist yet' }
];

export const MPR_EMPLOYMENT_TYPES = ['Full-time', 'Contract', 'Internship', 'Part-time'];

export const statusOf = (key: string) => MPR_STATUSES.find((s) => s.key === key) || MPR_STATUSES[0];
export const reasonLabel = (key: string) => MPR_REASONS.find((r) => r.key === key)?.label || key;

export const fmtIdr = (n?: number | null) => (n == null ? '—' : `IDR ${Number(n).toLocaleString('id-ID')}`);

export function budgetLabel(min?: number | null, max?: number | null) {
  if (min == null && max == null) return 'No budget given';
  if (min != null && max != null) return `${fmtIdr(min)} – ${fmtIdr(max)}`;
  return min != null ? `from ${fmtIdr(min)}` : `up to ${fmtIdr(max)}`;
}

/** Display status: an approved request with a job is "In recruitment", fully hired is "Fulfilled" */
export function progressOf(r: any) {
  if (r.status !== 'APPROVED') return statusOf(r.status);
  if (!r.jobId) return { key: 'TO_OPEN', label: 'Approved — open job', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  const hired = r.fulfillment?.hired || 0;
  if (hired >= r.headcount) return { key: 'FULFILLED', label: 'Fulfilled', cls: 'bg-emerald-600 text-white border-emerald-600' };
  return { key: 'RECRUITING', label: 'In recruitment', cls: 'bg-blue-600 text-white border-blue-600' };
}
