export type Stage = {
  key: string;
  label: string;
  accent: string; // column top border
  dot: string;
};

// Active hiring funnel (Zero Purple: amber → blue → emerald)
export const ACTIVE_STAGES: Stage[] = [
  { key: 'APPLIED', label: 'Baru Masuk', accent: 'border-t-amber-500', dot: 'bg-amber-500' },
  { key: 'ATS_SCREENED', label: 'Lolos ATS', accent: 'border-t-blue-400', dot: 'bg-blue-400' },
  { key: 'SHORTLISTED', label: 'Shortlisted HR', accent: 'border-t-blue-500', dot: 'bg-blue-500' },
  { key: 'INTERVIEW_HR', label: 'Interview HR', accent: 'border-t-blue-600', dot: 'bg-blue-600' },
  { key: 'INTERVIEW_USER', label: 'Interview User', accent: 'border-t-blue-700', dot: 'bg-blue-700' },
  { key: 'OFFERING', label: 'Offering', accent: 'border-t-emerald-500', dot: 'bg-emerald-500' },
  { key: 'HIRED', label: 'Diterima', accent: 'border-t-emerald-600', dot: 'bg-emerald-600' }
];

export const CLOSED_STAGES: Stage[] = [
  { key: 'TALENT_POOL', label: 'Talent Pool', accent: 'border-t-slate-400', dot: 'bg-slate-400' },
  { key: 'REJECTED', label: 'Tidak Lolos', accent: 'border-t-slate-600', dot: 'bg-slate-600' }
];

export const ALL_STAGES = [...ACTIVE_STAGES, ...CLOSED_STAGES];

export const stageLabel = (key: string) => ALL_STAGES.find((s) => s.key === key)?.label || key;

/** Next stage in the active funnel, or null at HIRED / closed stages */
export function nextStage(key: string): Stage | null {
  const i = ACTIVE_STAGES.findIndex((s) => s.key === key);
  return i >= 0 && i < ACTIVE_STAGES.length - 1 ? ACTIVE_STAGES[i + 1] : null;
}

// Aging thresholds (days without stage movement)
export const STALE_WARN_DAYS = 7;
export const STALE_CRITICAL_DAYS = 14;

export function daysSince(dateStr?: string) {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

/** When the application entered its current stage */
export const stageSince = (app: any) => app.stageChangedAt || app.updatedAt || app.appliedAt;

export function isStale(app: any) {
  const closed = app.status === 'HIRED' || CLOSED_STAGES.some((s) => s.key === app.status);
  return !closed && daysSince(stageSince(app)) >= STALE_WARN_DAYS;
}

export function getInitials(name?: string) {
  if (!name) return 'HR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type SortKey = 'score' | 'newest' | 'stale' | 'rating';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Skor ATS tertinggi' },
  { key: 'rating', label: 'Rating tertinggi' },
  { key: 'stale', label: 'Paling lama di tahap' },
  { key: 'newest', label: 'Lamaran terbaru' }
];

export function sortApplications(list: any[], sort: SortKey) {
  const time = (d?: string) => (d ? new Date(d).getTime() : 0);
  const sorted = [...list];
  switch (sort) {
    case 'rating':
      return sorted.sort((a, b) => (b.scorecardRating || 0) - (a.scorecardRating || 0) || b.atsScore - a.atsScore);
    case 'stale':
      return sorted.sort((a, b) => time(stageSince(a)) - time(stageSince(b)));
    case 'newest':
      return sorted.sort((a, b) => time(b.appliedAt) - time(a.appliedAt));
    default:
      return sorted.sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0));
  }
}

export const JOB_FAMILY_OPTIONS = [
  { key: 'IT_DIGITAL', label: 'IT & Digital' },
  { key: 'RETAIL_OPS', label: 'Retail & Store Ops' },
  { key: 'CORPORATE_SERVICES', label: 'Corporate Services' },
  { key: 'CREATIVE_MEDIA', label: 'Creative & Media' }
];

export const REJECT_REASONS = [
  'Skill teknis belum sesuai',
  'Pengalaman kurang relevan',
  'Ekspektasi gaji di atas budget',
  'Tidak hadir interview',
  'Kandidat mengundurkan diri',
  'Posisi sudah terisi'
];
