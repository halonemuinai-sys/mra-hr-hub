'use client';

import React from 'react';
import { BadgeCheck, CalendarCheck, CornerUpLeft, FileInput, Trophy } from 'lucide-react';
import { ALL_STAGES, stageLabel } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import { describeActivity, FIELD_LABELS, formatValue } from '@/components/candidates/activityFormat';
import { fmtDays } from './JourneyStageBar';

const dotOf = (status: string) => ALL_STAGES.find((s) => s.key === status)?.dot || 'bg-slate-400';
const when = (d: string) =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function StageData({ data }: { data: Record<string, any> | null }) {
  const fields = Object.entries(data || {}).filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && !v.length));
  if (!fields.length) return null;
  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
      {fields.map(([k, v]) => (
        <div key={k} className={k === 'hmFeedback' || k === 'reason' ? 'col-span-2' : ''}>
          <dt className="text-[10px] text-slate-400">{FIELD_LABELS[k] || k}</dt>
          <dd className="text-[11px] font-semibold text-slate-800 break-words">{formatValue(k, v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function EventRow({ a }: { a: any }) {
  const d = describeActivity(a);
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${d.tone}`}>
        <d.Icon className="w-3 h-3" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-700">{d.title}</p>
        <p className="text-[10px] text-slate-400">
          {d.who} · {when(a.createdAt)}
        </p>
        {a.note && a.action !== 'EMPLOYEE_REGISTERED' && a.action !== 'TALENTA_SYNCED' && (
          <p className="text-[11px] text-slate-600 italic">“{a.note}”</p>
        )}
      </div>
    </li>
  );
}

interface Props {
  stages: any[];
  afterHire: any[];
  appliedVia: string;
  joinDate?: string | null;
}

/** Stage-by-stage story with the form data, notes and actions recorded in each stage */
export default function JourneyTimeline({ stages, afterHire, appliedVia, joinDate }: Props) {
  return (
    <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
      {stages.map((s, i) => {
        const first = i === 0;
        const isHired = s.status === 'HIRED';
        return (
          <li key={i} className="pl-6 relative">
            <span
              className={`absolute -left-[13px] top-0 w-6 h-6 rounded-lg flex items-center justify-center text-white ${
                isHired ? 'bg-emerald-600' : first ? 'bg-slate-900' : dotOf(s.status)
              }`}
            >
              {isHired ? (
                <Trophy className="w-3.5 h-3.5" />
              ) : first ? (
                <FileInput className="w-3.5 h-3.5" />
              ) : s.backward ? (
                <CornerUpLeft className="w-3.5 h-3.5" />
              ) : (
                <span className="text-[10px] font-black">{i}</span>
              )}
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-xs font-bold text-slate-900">{first ? 'CV received' : stageLabel(s.status)}</p>
              {s.backward && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">moved back</span>
              )}
              {s.days !== null && s.days !== undefined && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold tabular-nums">
                  {fmtDays(s.days)} in this stage
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {when(s.enteredAt)}
              {first ? ` · ${appliedVia}` : s.by ? ` · by ${shortName(s.by)}` : ''}
            </p>
            {s.note && <p className="mt-1 text-[11px] text-slate-600 italic">“{s.note}”</p>}
            <StageData data={s.data} />
            {s.events.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {s.events.map((a: any) => (
                  <EventRow key={a.id || a.createdAt + a.action} a={a} />
                ))}
              </ul>
            )}
          </li>
        );
      })}

      {(afterHire.length > 0 || joinDate) && (
        <li className="pl-6 relative">
          <span className="absolute -left-[13px] top-0 w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <BadgeCheck className="w-3.5 h-3.5" />
          </span>
          <p className="text-xs font-bold text-slate-900">After the hire</p>
          <ul className="mt-2 space-y-1.5">
            {afterHire.map((a: any) => (
              <EventRow key={a.id || a.createdAt + a.action} a={a} />
            ))}
            {joinDate && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-md border bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-3 h-3" />
                </span>
                <p className="text-[11px] text-slate-700">
                  {new Date(joinDate).getTime() <= Date.now() ? 'Started work on' : 'Scheduled to start on'}{' '}
                  <b>
                    {new Date(joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  </b>
                </p>
              </li>
            )}
          </ul>
        </li>
      )}
    </ol>
  );
}
