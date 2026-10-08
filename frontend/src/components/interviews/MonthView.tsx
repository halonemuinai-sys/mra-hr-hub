'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { addDays, fmtTime, InterviewEvent, sameDay, startOfWeek, STAGE_META } from './interviewFormat';

const MAX_CHIPS = 3;

interface Props {
  month: Date;
  events: InterviewEvent[];
  onOpen: (e: InterviewEvent) => void;
  onPickDay: (d: Date) => void;
}

/** 6-week grid; each day shows up to three interviews, then "+n more" opens the week */
export default function MonthView({ month, events, onOpen, onPickDay }: Props) {
  const first = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1));
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const today = new Date();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <p key={d} className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {d}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const list = events.filter((e) => e.start && sameDay(new Date(e.start), d) && e.status !== 'CANCELLED');
          const isToday = sameDay(d, today);
          return (
            <div key={d.toISOString()} className={`min-h-[124px] border-b border-l border-slate-100 p-2 ${isToday ? 'bg-blue-50/40' : inMonth ? '' : 'bg-slate-50/80'}`}>
              <button
                type="button"
                onClick={() => onPickDay(d)}
                aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center ${
                  isToday ? 'bg-blue-600 text-white' : inMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300'
                }`}
                title="Open this week"
              >
                {d.getDate()}
              </button>
              <div className="mt-2 space-y-1">
                {list.slice(0, MAX_CHIPS).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onOpen(e)}
                    className={`w-full flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] text-left hover:brightness-95 ${
                      e.status === 'COMPLETED' ? 'bg-slate-100 text-slate-500' : e.status === 'AWAITING_OUTCOME' ? 'bg-amber-50 text-amber-800' : STAGE_META[e.stage]?.soft
                    } ${e.conflict ? 'bg-amber-50' : ''}`}
                    title={`${fmtTime(e.start)} ${e.candidate.fullName} — ${STAGE_META[e.stage]?.label}`}
                  >
                    {e.conflict ? (
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.status === 'AWAITING_OUTCOME' ? 'bg-amber-500' : STAGE_META[e.stage]?.dot}`} />
                    )}
                    <span className="tabular-nums font-semibold shrink-0">{fmtTime(e.start)}</span>
                    <span className="truncate">{e.candidate.fullName}</span>
                  </button>
                ))}
                {list.length > MAX_CHIPS && (
                  <button type="button" onClick={() => onPickDay(d)} className="px-1 text-[10px] font-bold text-blue-600 hover:text-blue-800">
                    +{list.length - MAX_CHIPS} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
