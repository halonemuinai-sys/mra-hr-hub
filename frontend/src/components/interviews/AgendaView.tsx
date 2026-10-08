'use client';

import React from 'react';
import { AlertTriangle, CalendarX2, MapPin, Video } from 'lucide-react';
import { fmtDay, fmtTime, InterviewEvent, sameDay, STAGE_META, STATUS_META } from './interviewFormat';

const shortName = (n?: string | null) => String(n || '').replace(/\s*\(.*\)\s*$/, '');

/** Day-grouped list of the interviews in the range */
export default function AgendaView({ events, onOpen }: { events: InterviewEvent[]; onOpen: (e: InterviewEvent) => void }) {
  if (!events.length) {
    return (
      <div className="px-6 py-24 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 ring-8 ring-blue-50/40"><CalendarX2 className="w-7 h-7 text-blue-400" /></div>
        <p className="text-base font-bold text-slate-800">No interviews in this period</p>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500">Try another date or adjust your filters. You can schedule candidates from the panel beside the calendar.</p>
      </div>
    );
  }
  const days: { day: Date; rows: InterviewEvent[] }[] = [];
  events.forEach((e) => {
    const d = new Date(e.start!);
    const last = days[days.length - 1];
    if (last && sameDay(last.day, d)) last.rows.push(e);
    else days.push({ day: d, rows: [e] });
  });
  const today = new Date();

  return (
    <div className="divide-y divide-slate-100">
      {days.map(({ day, rows }) => (
        <section key={day.toISOString()} className="grid grid-cols-1 md:grid-cols-[105px_minmax(0,1fr)] gap-4 px-4 sm:px-5 py-5">
          <div>
            <p className={`text-xs font-black ${sameDay(day, today) ? 'text-blue-600' : 'text-slate-900'}`}>{sameDay(day, today) ? 'Today' : fmtDay(day, { weekday: 'long' })}</p>
            <p className="text-[11px] text-slate-500">{fmtDay(day, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <ul className="min-w-0 space-y-2">
            {rows.map((e) => {
              const st = STATUS_META[e.status];
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(e)}
                    className={`w-full flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-xl border px-3 py-3.5 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors ${
                      e.conflict ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className="w-12 text-xs font-black tabular-nums text-slate-900">{fmtTime(e.start)}</span>
                    <span className={`w-1 self-stretch rounded-full ${STAGE_META[e.stage]?.dot}`} />
                    <span className="min-w-0 flex-1 basis-1/2 sm:basis-auto">
                      <span className={`block text-xs font-bold truncate ${e.status === 'CANCELLED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {e.candidate.fullName} <span className="font-normal text-slate-500">· {e.job.title}</span>
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {STAGE_META[e.stage]?.label} · {e.interviewer || 'No interviewer'}
                        {e.pic ? ` · PIC ${shortName(e.pic.name)}` : ''}
                      </span>
                    </span>
                    {e.mode && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500">
                        {e.mode === 'Online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />} {e.mode}
                      </span>
                    )}
                    {e.conflict && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                    <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
