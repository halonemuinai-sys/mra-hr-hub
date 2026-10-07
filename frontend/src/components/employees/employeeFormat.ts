// Shared labels & helpers for the employee / announcement screens

export const EMPLOYMENT_STATUSES: { key: string; label: string; cls: string }[] = [
  { key: 'PROBATION', label: 'Probation', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'CONTRACT', label: 'Kontrak', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'PERMANENT', label: 'Tetap', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'INTERNSHIP', label: 'Magang', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
];

export const statusMeta = (key?: string) =>
  EMPLOYMENT_STATUSES.find((s) => s.key === key) || { key: key || '', label: key || '-', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

export const fmtDate = (d?: string | null, long = false) =>
  d
    ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: long ? 'long' : 'short', year: 'numeric', timeZone: 'UTC' })
    : '-';

/** Default "Selamat Bergabung" text built from the form values */
export function announcementDraft(v: {
  fullName?: string;
  position?: string;
  department?: string;
  division?: string;
  workLocation?: string;
  joinDate?: string;
  managerName?: string;
}) {
  const first = (v.fullName || '').trim().split(/\s+/)[0] || 'rekan baru kita';
  const where = [v.department, v.division].filter(Boolean).join(', ');
  const when = v.joinDate ? ` mulai ${fmtDate(v.joinDate, true)}` : '';
  const lead = v.managerName ? ` dan akan bekerja bersama ${v.managerName}` : '';
  return (
    `Mari sambut ${v.fullName || first} yang bergabung sebagai ${v.position || '-'}` +
    `${where ? ` di ${where}` : ''}${v.workLocation ? ` (${v.workLocation})` : ''}${when}${lead}. ` +
    `Selamat bergabung di MRA Group, ${first}!`
  );
}

/** Joined already, joins this week, or later */
export function joinBadge(joinDate?: string | null) {
  if (!joinDate) return null;
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((new Date(joinDate).getTime() - t) / 86400000);
  if (days === 0) return { label: 'Mulai hari ini', cls: 'bg-emerald-600 text-white border-emerald-600' };
  if (days > 0 && days <= 7) return { label: `Mulai ${days} hari lagi`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (days > 7) return { label: 'Akan bergabung', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  return { label: 'Sudah bergabung', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
}
