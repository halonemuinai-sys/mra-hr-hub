'use client';

import React from 'react';
import { History, ArrowRight, Hand, UserPlus, LogOut, ShieldCheck, RefreshCw, Star, BadgeCheck, Megaphone, ArchiveX, CloudUpload } from 'lucide-react';
import { stageLabel } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';

// Shared formatting for ApplicationActivity rows (StageHistory, employee journey)

/** Labels for stage-gate form fields (backend/config/stageRules.js) */
export const FIELD_LABELS: Record<string, string> = {
  interviewAt: 'Jadwal interview',
  interviewer: 'Interviewer',
  interviewMode: 'Mode',
  hiringManager: 'Hiring manager',
  recommendation: 'Rekomendasi HR',
  rating: 'Rating',
  hmFeedback: 'Feedback HM',
  offerSalary: 'Gaji ditawarkan',
  startDate: 'Tanggal mulai',
  offerSigned: 'Offer ditandatangani',
  joinDate: 'Tanggal masuk',
  // PROFILE_RESUBMITTED snapshot
  source: 'Saluran',
  fullName: 'Nama',
  phone: 'Telepon',
  headline: 'Headline',
  currentCompany: 'Perusahaan',
  totalExperienceYrs: 'Pengalaman (th)',
  skills: 'Skill'
};

const DATE_TIME = new Set(['interviewAt']);
const DATE_ONLY = new Set(['startDate', 'joinDate']);

export function formatValue(key: string, v: any): React.ReactNode {
  if (v === null || v === undefined || v === '') return '—';
  if (key === 'offerSalary') return `Rp ${Number(v).toLocaleString('id-ID')}`;
  if (key === 'rating')
    return (
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < Number(v) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        ))}
      </span>
    );
  if (DATE_TIME.has(key)) return new Date(v).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (DATE_ONLY.has(key)) return new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

export function describeActivity(a: any) {
  const who = shortName(a.actor?.name) || 'Sistem';
  switch (a.action) {
    case 'STAGE_CHANGE':
      return { Icon: ArrowRight, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: <>{stageLabel(a.fromStatus)} <ArrowRight className="w-3 h-3 inline" /> <b>{stageLabel(a.toStatus)}</b></>, who };
    case 'CLAIM':
      return { Icon: Hand, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: 'Diambil sebagai PIC', who };
    case 'ASSIGN':
      return { Icon: UserPlus, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: 'Ditugaskan ke recruiter', who };
    case 'RELEASE':
      return { Icon: LogOut, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: 'Dilepas ke antrean', who };
    case 'APPROVAL_REQUESTED':
      return { Icon: ShieldCheck, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: <>Minta approval → <b>{stageLabel(a.toStatus)}</b></>, who };
    case 'APPROVAL_APPROVED':
      return { Icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: <>Approval disetujui → <b>{stageLabel(a.toStatus)}</b></>, who };
    case 'APPROVAL_REJECTED':
      return { Icon: ShieldCheck, tone: 'bg-amber-50 text-amber-700 border-amber-200', title: <>Approval ditolak → {stageLabel(a.toStatus)}</>, who };
    case 'APPROVAL_CANCELLED':
      return { Icon: ShieldCheck, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: 'Approval dibatalkan', who };
    case 'EMPLOYEE_REGISTERED':
      return { Icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: <>Didaftarkan sebagai karyawan{a.note ? <> · <b>{a.note}</b></> : null}</>, who };
    case 'EMPLOYEE_ANNOUNCED':
      return { Icon: Megaphone, tone: 'bg-blue-50 text-blue-600 border-blue-200', title: 'Diumumkan di papan Selamat Bergabung', who };
    case 'HIRE_RELEASED':
      return { Icon: ArchiveX, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: 'Dikeluarkan dari pipeline', who };
    case 'TALENTA_SYNCED':
      return { Icon: CloudUpload, tone: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: <>Terkirim ke Talenta{a.note ? <> · <b>{a.note}</b></> : null}</>, who };
    case 'TALENTA_SYNC_FAILED':
      return { Icon: CloudUpload, tone: 'bg-amber-50 text-amber-700 border-amber-200', title: <>Gagal kirim ke Talenta{a.note ? <>: {a.note}</> : null}</>, who };
    case 'HIRE_RESTORED':
      return { Icon: ArchiveX, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: 'Dikembalikan ke pipeline', who };
    case 'PROFILE_RESUBMITTED':
      return { Icon: RefreshCw, tone: 'bg-amber-50 text-amber-700 border-amber-200', title: 'Pelamar mengirim ulang lamaran', who: 'Portal karier' };
    default:
      return { Icon: History, tone: 'bg-slate-100 text-slate-500 border-slate-200', title: a.action, who };
  }
}
