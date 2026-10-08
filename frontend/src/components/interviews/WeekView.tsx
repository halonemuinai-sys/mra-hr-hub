'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, MapPin, Video } from 'lucide-react';
import { addDays, eventTone, fmtDay, fmtTime, InterviewEvent, sameDay, STAGE_META } from './interviewFormat';

const FIRST_HOUR = 8;
const LAST_HOUR = 19; // grid ends at 19:00
const ROW = 68; // px per hour; room for time, candidate and interviewer

/** Side-by-side lanes for overlapping events of one day */
function layout(events: InterviewEvent[]) {
  const sorted = [...events].sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());
  const out: { e: InterviewEvent; lane: number; lanes: number }[] = [];
  let cluster: { e: InterviewEvent; lane: number; lanes: number }[] = [];
  let clusterEnd = 0;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => out.push({ ...c, lanes }));
    cluster = [];
  };
  sorted.forEach((e) => {
    const s = new Date(e.start!).getTime();
    const end = new Date(e.end!).getTime();
    if (cluster.length && s >= clusterEnd) flush();
    const used = new Set(cluster.filter((c) => new Date(c.e.end!).getTime() > s).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({ e, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, end);
  });
  flush();
  return out;
}

interface Props {
  weekStart: Date;
  events: InterviewEvent[];
  onOpen: (e: InterviewEvent) => void;
}

export default function WeekView({ weekStart, events, onOpen }: Props) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = new Date();
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
  const nowTop = (today.getHours() + today.getMinutes() / 60 - FIRST_HOUR) * ROW;

  return (
    <div className="overflow-auto max-h-[720px]">
      <div className="min-w-[840px]">
        {/* Day headers */}
        <div className="sticky top-0 z-40 grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200 bg-white">
          <div className="flex items-center justify-center text-[9px] font-semibold uppercase tracking-wider text-slate-400">Time</div>
          {days.map((d) => {
            const isToday = sameDay(d, today);
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const count = events.filter((e) => sameDay(new Date(e.start!), d) && e.status !== 'CANCELLED').length;
            return (
              <div key={d.toISOString()} className={`px-2 py-3 text-center border-l border-slate-100 ${isToday ? 'bg-blue-50/60' : weekend ? 'bg-slate-50' : ''}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{fmtDay(d, { weekday: 'short' })}</p>
                <p className={`my-1 inline-flex items-center justify-center w-9 h-9 rounded-xl text-lg font-bold ${isToday ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-800'}`}>
                  {d.getDate()}
                </p>
                <p className="text-[10px] text-slate-400 h-3.5">{count ? `${count} interview${count > 1 ? 's' : ''}` : ''}</p>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] relative">
          <div>
            {hours.map((h) => (
              <div key={h} className="text-[10px] text-slate-400 text-right pr-2 pt-1 tabular-nums" style={{ height: ROW }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {days.map((d) => {
            // Cancelled interviews only clutter the grid — they stay visible in the Agenda view
            const dayEvents = events.filter((e) => e.start && e.status !== 'CANCELLED' && sameDay(new Date(e.start), d));
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div key={d.toISOString()} className={`relative border-l border-slate-100 ${sameDay(d, today) ? 'bg-blue-50/30' : weekend ? 'bg-slate-50/70' : ''}`} style={{ height: hours.length * ROW }}>
                {hours.map((h) => (
                  <div key={h} className="border-t border-slate-100" style={{ height: ROW }} />
                ))}
                {sameDay(d, today) && nowTop > 0 && nowTop < hours.length * ROW && (
                  <div className="absolute inset-x-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                    <div className="h-0.5 bg-amber-500" />
                    <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                )}
                {layout(dayEvents).map(({ e, lane, lanes }) => {
                  const s = new Date(e.start!);
                  const top = Math.max(0, (s.getHours() + s.getMinutes() / 60 - FIRST_HOUR) * ROW);
                  const height = Math.max(28, ROW - 4);
                  const clipped = Math.min(top, hours.length * ROW - height);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onOpen(e)}
                      title={`${fmtTime(e.start)} ${e.candidate.fullName} — ${e.job.title}`}
                      className={`absolute z-10 rounded-lg border border-l-[3px] px-2 py-1.5 text-left overflow-hidden shadow-xs hover:shadow-md hover:z-30 transition-shadow focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-blue-500 ${eventTone(e)} ${
                        e.conflict ? 'ring-2 ring-amber-500 ring-offset-1' : ''
                      }`}
                      style={{ top: clipped + 2, height, left: `calc(${(lane / lanes) * 100}% + 3px)`, width: `calc(${100 / lanes}% - 6px)` }}
                    >
                      <p className="text-[10px] font-bold tabular-nums flex items-center gap-1 opacity-90">
                        {e.conflict && <AlertTriangle className="w-3 h-3 shrink-0" />}
                        {fmtTime(e.start)} · {STAGE_META[e.stage]?.short}
                        {e.mode === 'Online' ? <Video className="w-3 h-3 shrink-0 ml-auto" /> : e.mode === 'Onsite' ? <MapPin className="w-3 h-3 shrink-0 ml-auto" /> : null}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold truncate leading-tight">{e.candidate.fullName}</p>
                      {lanes === 1 && <p className="mt-0.5 text-[10px] truncate opacity-80 leading-tight">{e.interviewer || e.job.title}</p>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
