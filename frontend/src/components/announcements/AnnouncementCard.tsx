'use client';

import React from 'react';
import { CalendarDays, MapPin, Sparkles, UserRound } from 'lucide-react';
import { getInitials } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import { fmtDate, joinBadge } from '@/components/employees/employeeFormat';

const NEW_DAYS = 7;

/** "Selamat Bergabung" card — no contact details, safe for every CMS user */
export default function AnnouncementCard({ item, compact = false }: { item: any; compact?: boolean }) {
  const jb = joinBadge(item.joinDate);
  const fresh = item.announcedAt && Date.now() - new Date(item.announcedAt).getTime() < NEW_DAYS * 86400000;

  if (compact) {
    return (
      <div className="flex items-start gap-3 py-2.5">
        <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
          {getInitials(item.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 truncate">{item.fullName}</p>
          <p className="text-[11px] text-slate-500 truncate">
            {item.position} · {item.division}
          </p>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 tabular-nums shrink-0">{fmtDate(item.joinDate)}</span>
      </div>
    );
  }

  return (
    <article className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <div className="relative bg-slate-900 px-5 pt-4 pb-10">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Selamat Bergabung</span>
          {fresh && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
              <Sparkles className="w-3 h-3" /> Baru
            </span>
          )}
        </div>
      </div>
      <div className="relative z-10 px-5 -mt-7 flex items-end gap-3">
        <span className="w-14 h-14 rounded-2xl bg-emerald-600 border-4 border-white text-white text-lg font-black flex items-center justify-center shrink-0 shadow-sm">
          {getInitials(item.fullName)}
        </span>
        {jb && <span className={`mb-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${jb.cls}`}>{jb.label}</span>}
      </div>
      <div className="px-5 pt-3 pb-4 flex-1 flex flex-col">
        <h3 className="text-base font-black text-slate-900 leading-tight">{item.fullName}</h3>
        <p className="text-xs font-bold text-blue-700 mt-0.5">{item.position}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{[item.department, item.division].filter(Boolean).join(' · ')}</p>

        <div className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Bergabung {fmtDate(item.joinDate, true)}
          </span>
          {item.workLocation && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.workLocation}
            </span>
          )}
          {item.managerName && (
            <span className="flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5 text-slate-400" /> Atasan: {item.managerName}
            </span>
          )}
        </div>

        {item.announcementMessage && (
          <p className="mt-3 text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 whitespace-pre-line">
            {item.announcementMessage}
          </p>
        )}

        <p className="mt-auto pt-3 text-[10px] text-slate-400">
          Diumumkan {fmtDate(item.announcedAt)}
          {item.announcedBy?.name ? ` oleh ${shortName(item.announcedBy.name)}` : ''}
        </p>
      </div>
    </article>
  );
}
