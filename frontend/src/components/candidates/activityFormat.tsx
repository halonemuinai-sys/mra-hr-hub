'use client';

import React from 'react';
import { History, ArrowRight, Hand, UserPlus, LogOut, ShieldCheck, RefreshCw, Star, BadgeCheck, Megaphone, ArchiveX, CloudUpload, CalendarClock, FileSignature, UserSearch } from 'lucide-react';
import { stageLabel } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';

// Shared formatting for ApplicationActivity rows (StageHistory, employee journey)

/** Labels for stage-gate form fields (backend/config/stageRules.js) */
export const FIELD_LABELS: Record<string, string> = {
  interviewAt: 'Interview schedule',
  interviewer: 'Interviewer',
  interviewMode: 'Mode',
  hiringManager: 'Hiring manager',
  recommendation: 'HR recommendation',
  rating: 'Rating',
  hmFeedback: 'Feedback HM',
  offerSalary: 'Offered salary',
  startDate: 'Start date',
  offerSigned: 'Offer signed',
  joinDate: 'Join date',
  // PROFILE_RESUBMITTED snapshot
  source: 'Source',
  fullName: 'Name',
  phone: 'Phone',
  headline: 'Headline',
  currentCompany: 'Company',
  totalExperienceYrs: 'Experience (years)',
  skills: 'Skill'
};

const DATE_TIME = new Set(['interviewAt']);
const DATE_ONLY = new Set(['startDate', 'joinDate']);

export function formatValue(key: string, v: any): React.ReactNode {
  if (v === null || v === undefined || v === '') return '—';
  if (key === 'offerSalary') return `IDR ${Number(v).toLocaleString('en-GB')}`;
  if (key === 'rating')
    return (
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < Number(v) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        ))}
      </span>
    );
  if (DATE_TIME.has(key)) return new Date(v).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (DATE_ONLY.has(key)) return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

export function describeActivity(a: any) {
  const who = shortName(a.actor?.name) || 'System';
  switch (a.action) {
    case 'STAGE_CHANGE':
      return { Icon: ArrowRight, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: <>{stageLabel(a.fromStatus)} <ArrowRight className="w-3 h-3 inline" /> <b>{stageLabel(a.toStatus)}</b></>, who };
    case 'CLAIM':
      return { Icon: Hand, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: 'Claimed by recruiter', who };
    case 'ASSIGN':
      return { Icon: UserPlus, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: 'Assigned to recruiter', who };
    case 'RELEASE':
      return { Icon: LogOut, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: 'Released to queue', who };
    case 'APPROVAL_REQUESTED':
      return { Icon: ShieldCheck, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: <>Approval requested → <b>{stageLabel(a.toStatus)}</b></>, who };
    case 'APPROVAL_APPROVED':
      return { Icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: <>Approval granted → <b>{stageLabel(a.toStatus)}</b></>, who };
    case 'APPROVAL_REJECTED':
      return { Icon: ShieldCheck, tone: 'bg-amber-50 text-amber-700 border-amber-200', title: <>Approval rejected → {stageLabel(a.toStatus)}</>, who };
    case 'APPROVAL_CANCELLED':
      return { Icon: ShieldCheck, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: 'Approval cancelled', who };
    case 'EMPLOYEE_REGISTERED':
      return { Icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: <>Registered as employee{a.note ? <> · <b>{a.note}</b></> : null}</>, who };
    case 'EMPLOYEE_ANNOUNCED':
      return { Icon: Megaphone, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: 'Announced on the welcome board', who };
    case 'HIRE_RELEASED':
      return { Icon: ArchiveX, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: 'Released from pipeline', who };
    case 'TALENTA_SYNCED':
      return { Icon: CloudUpload, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: <>Sent to Talenta{a.note ? <> · <b>{a.note}</b></> : null}</>, who };
    case 'TALENTA_SYNC_FAILED':
      return { Icon: CloudUpload, tone: 'bg-amber-50 text-amber-700 border-amber-200', title: <>Failed to send to Talenta{a.note ? <>: {a.note}</> : null}</>, who };
    case 'INTERVIEW_SCHEDULED':
      return { Icon: CalendarClock, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: <>Interview scheduled — <b>{stageLabel(a.toStatus)}</b></>, who };
    case 'HIRE_RESTORED':
      return { Icon: ArchiveX, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: 'Restored to pipeline', who };
    case 'TALENT_POOL_ADDED':
      return { Icon: UserSearch, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: <>Added from the talent pool{a.note ? <> · <b>{a.note}</b></> : null}</>, who };
    case 'OFFER_LETTER_CREATED':
      return { Icon: FileSignature, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: <>Offer letter drafted{a.note ? <> · <b>{a.note}</b></> : null}</>, who };
    case 'OFFER_LETTER_SENT':
      return { Icon: FileSignature, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: <>Offer letter sent{a.note ? <> · <b>{a.note}</b></> : null}</>, who };
    case 'OFFER_ACCEPTED':
      return { Icon: FileSignature, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: <>Offer accepted{a.note ? <> · <b>{a.note}</b></> : null}</>, who };
    case 'OFFER_DECLINED':
      return { Icon: FileSignature, tone: 'bg-amber-50 text-amber-700 border-amber-200', title: <>Offer declined{a.note ? <>: {a.note}</> : null}</>, who };
    case 'OFFER_LETTER_CANCELLED':
      return { Icon: FileSignature, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: <>Offer letter cancelled{a.note ? <> · {a.note}</> : null}</>, who };
    case 'PROFILE_RESUBMITTED':
      return { Icon: RefreshCw, tone: 'bg-amber-50 text-amber-700 border-amber-200', title: 'Candidate resubmitted application', who: 'Career portal' };
    default:
      return { Icon: History, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: a.action, who };
  }
}
