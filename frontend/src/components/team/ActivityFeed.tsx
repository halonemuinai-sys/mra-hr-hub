'use client';

import React from 'react';
import { Hand, LogOut, UserPlus, ArrowRightLeft, XCircle, CheckCircle2, ShieldCheck, BadgeCheck, Megaphone, ArchiveX, CloudUpload } from 'lucide-react';
import { describeActivity, formatRelative } from './teamFormat';

/** Actions whose note is already part of the sentence (describeActivity) */
const NOTE_IN_TEXT = new Set(['EMPLOYEE_REGISTERED', 'TALENTA_SYNCED', 'TALENTA_SYNC_FAILED']);

function iconFor(a: any) {
  if (a.action === 'CLAIM') return { Icon: Hand, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  if (a.action === 'RELEASE') return { Icon: LogOut, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  if (a.action === 'ASSIGN') return { Icon: UserPlus, cls: 'bg-blue-50 text-blue-600 border-blue-200' };
  if (a.action === 'APPROVAL_REQUESTED') return { Icon: ShieldCheck, cls: 'bg-blue-50 text-blue-600 border-blue-200' };
  if (a.action === 'APPROVAL_APPROVED') return { Icon: ShieldCheck, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  if (a.action === 'APPROVAL_REJECTED' || a.action === 'APPROVAL_CANCELLED')
    return { Icon: ShieldCheck, cls: 'bg-amber-50 text-amber-600 border-amber-200' };
  if (a.action === 'EMPLOYEE_REGISTERED') return { Icon: BadgeCheck, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  if (a.action === 'TALENTA_SYNCED') return { Icon: CloudUpload, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  if (a.action === 'TALENTA_SYNC_FAILED') return { Icon: CloudUpload, cls: 'bg-amber-50 text-amber-600 border-amber-200' };
  if (a.action === 'EMPLOYEE_ANNOUNCED') return { Icon: Megaphone, cls: 'bg-blue-50 text-blue-600 border-blue-200' };
  if (a.action === 'HIRE_RELEASED' || a.action === 'HIRE_RESTORED') return { Icon: ArchiveX, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  if (a.toStatus === 'HIRED') return { Icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  if (a.toStatus === 'REJECTED') return { Icon: XCircle, cls: 'bg-amber-50 text-amber-600 border-amber-200' };
  return { Icon: ArrowRightLeft, cls: 'bg-blue-50 text-blue-600 border-blue-200' };
}

export default function ActivityFeed({
  items,
  loading,
  compact,
  clock
}: {
  items: any[];
  loading: boolean;
  compact?: boolean;
  /** Show the time of day (for lists already grouped by date) instead of "3 days ago" */
  clock?: boolean;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 py-6 text-center">No activity recorded yet.</p>;
  }

  return (
    <ol className="space-y-1">
      {items.map((a) => {
        const { Icon, cls } = iconFor(a);
        const { who, text } = describeActivity(a);
        return (
          <li key={a.id} className="flex items-start gap-2.5 py-1.5">
            <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${cls}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0 text-xs">
              <p className="text-slate-700 leading-snug">
                {!compact && <b className="text-slate-900">{who} </b>}
                {text}
              </p>
              {a.note && !NOTE_IN_TEXT.has(a.action) && <p className="text-[11px] text-slate-500 italic truncate" title={a.note}>“{a.note}”</p>}
              <p className="text-[10px] text-slate-400 mt-0.5">
                {clock ? new Date(a.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : formatRelative(a.createdAt)}
                {a.application?.job?.title ? ` • ${a.application.job.title}` : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
