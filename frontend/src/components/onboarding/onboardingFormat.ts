// Onboarding labels, colours and date helpers (rules live in backend/services/onboardingRules.js)

export const OWNER_META: Record<string, { label: string; cls: string }> = {
  HR: { label: 'HR', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  IT: { label: 'IT', cls: 'bg-slate-900 text-white border-slate-900' },
  GA: { label: 'GA', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  MANAGER: { label: 'Manager', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAYROLL: { label: 'Payroll', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
};

export const PROGRESS_META: Record<string, { label: string; cls: string }> = {
  NOT_STARTED: { label: 'Not started', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-600 text-white border-emerald-600' }
};

/** Days from today (UTC date) to a date-only value */
export function daysFromToday(d?: string | null) {
  if (!d) return null;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(d).getTime() - today) / 86400000);
}

export const fmtDue = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'No due date';

/** "Overdue 2 days" / "Today" / "In 3 days" */
export function dueLabel(d?: string | null) {
  const n = daysFromToday(d);
  if (n === null) return '';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 0) return `Overdue ${-n} day${n === -1 ? '' : 's'}`;
  return `In ${n} days`;
}

export const toDateInput = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
