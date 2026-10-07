import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'IDR 0';
  return 'IDR ' + Number(amount).toLocaleString('id-ID');
}

export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

export function getScoreBadge(score: number) {
  if (score >= 85) {
    return {
      label: 'Top Match',
      class: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
      dot: 'bg-emerald-500'
    };
  }
  if (score >= 70) {
    return {
      label: 'Qualified',
      class: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
      dot: 'bg-blue-500'
    };
  }
  return {
    label: 'Needs Review',
    class: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
    dot: 'bg-amber-500'
  };
}

export function getStatusBadge(status?: string) {
  switch (status) {
    case 'HIRED':
      return { label: 'Diterima (Hired)', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'OFFERING':
      return { label: 'Offering Letter', class: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
    case 'SHORTLISTED':
      return { label: 'Shortlisted', class: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'INTERVIEW_HR':
    case 'INTERVIEW_USER':
      return { label: 'Interview', class: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'ATS_SCREENED':
      return { label: 'ATS Screened', class: 'bg-blue-50 text-blue-600 border-blue-200' };
    case 'REJECTED':
      return { label: 'Tidak Lolos', class: 'bg-slate-100 text-slate-600 border-slate-200' };
    case 'TALENT_POOL':
      return { label: 'Talent Pool', class: 'bg-slate-100 text-slate-700 border-slate-200' };
    default:
      return { label: 'Baru Masuk', class: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
}
