// Shared labels & helpers for the employee / announcement screens

export const EMPLOYMENT_STATUSES: { key: string; label: string; cls: string }[] = [
  { key: 'PROBATION', label: 'Probation', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'CONTRACT', label: 'Contract', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'PERMANENT', label: 'Permanent', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'INTERNSHIP', label: 'Internship', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
];

export const statusMeta = (key?: string) =>
  EMPLOYMENT_STATUSES.find((s) => s.key === key) || { key: key || '', label: key || '-', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

/**
 * Date-only values (join date, stored as UTC midnight) are shown in UTC so they never shift a day;
 * real timestamps (applied, hired, announced) in the viewer's local time.
 */
export const fmtDate = (d?: string | Date | null, long = false, locale = 'en-GB') => {
  if (!d) return '-';
  const date = new Date(d);
  const dateOnly = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
  return date.toLocaleDateString(locale, { day: 'numeric', month: long ? 'long' : 'short', year: 'numeric', ...(dateOnly ? { timeZone: 'UTC' } : {}) });
};

/** Default "Welcome Aboard" text built from the form values */
export function announcementDraft(v: {
  fullName?: string;
  position?: string;
  department?: string;
  division?: string;
  workLocation?: string;
  joinDate?: string;
  managerName?: string;
}) {
  const first = (v.fullName || '').trim().split(/\s+/)[0] || 'our new colleague';
  const where = [v.department, v.division].filter(Boolean).join(', ');
  const when = v.joinDate ? ` starting ${fmtDate(v.joinDate, true)}` : '';
  const lead = v.managerName ? `, working with ${v.managerName}` : '';
  return (
    `Please welcome ${v.fullName || first}, who joins us as ${v.position || '-'}` +
    `${where ? ` in ${where}` : ''}${v.workLocation ? ` (${v.workLocation})` : ''}${when}${lead}. ` +
    `Welcome to MRA Group, ${first}!`
  );
}

/** Joined already, joins this week, or later */
export function joinBadge(joinDate?: string | null) {
  if (!joinDate) return null;
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((new Date(joinDate).getTime() - t) / 86400000);
  if (days === 0) return { label: 'Starts today', cls: 'bg-emerald-600 text-white border-emerald-600' };
  if (days > 0 && days <= 7) return { label: `Starts in ${days} day${days === 1 ? '' : 's'}`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (days > 7) return { label: 'Joining soon', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  return { label: 'Joined', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
}
