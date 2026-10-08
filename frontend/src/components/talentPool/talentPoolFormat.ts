/** Talent pool labels (mirror of backend/services/talentPoolMatcher.js) */
import { stageLabel } from '@/components/pipeline/stages';

export type Segment = 'TALENT_POOL' | 'SILVER_MEDALIST' | 'PAST_APPLICANT' | 'ACTIVE';

export const SEGMENT_META: Record<Segment, { label: string; hint: string; cls: string }> = {
  TALENT_POOL: { label: 'Talent pool', hint: 'Parked in the Talent Pool of another job', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  SILVER_MEDALIST: { label: 'Silver medalist', hint: 'Rejected elsewhere after reaching an interview', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  PAST_APPLICANT: { label: 'Past applicant', hint: 'Rejected early for another job', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  ACTIVE: { label: 'Active elsewhere', hint: 'Still in another job’s pipeline — coordinate with its PIC', cls: 'bg-white text-slate-600 border-slate-300' }
};

export const POOL_SEGMENTS: Segment[] = ['TALENT_POOL', 'SILVER_MEDALIST', 'PAST_APPLICANT'];
export const ALL_SEGMENTS: Segment[] = [...POOL_SEGMENTS, 'ACTIVE'];
export const MIN_SCORES = [50, 60, 70, 80];

export const daysAgo = (d?: string | null) => {
  if (!d) return '';
  const n = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));
  return n === 0 ? 'today' : n === 1 ? 'yesterday' : n < 60 ? `${n} days ago` : `${Math.round(n / 30)} months ago`;
};

/** "Rejected · reached Interview User" / "Talent Pool" / "Shortlisted" */
export function historyStatus(h: { status: string; furthest: string }) {
  if ((h.status === 'REJECTED' || h.status === 'TALENT_POOL') && h.furthest && h.furthest !== 'APPLIED') return `${stageLabel(h.status)} · reached ${stageLabel(h.furthest)}`;
  return stageLabel(h.status);
}

export const scoreTone = (s: number) => (s >= 85 ? 'text-emerald-600' : s >= 70 ? 'text-blue-600' : 'text-amber-600');
export const barTone = (s: number) => (s >= 85 ? 'bg-emerald-500' : s >= 70 ? 'bg-blue-600' : 'bg-amber-500');
