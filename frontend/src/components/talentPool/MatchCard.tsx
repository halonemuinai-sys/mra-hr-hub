'use client';

import React, { useState } from 'react';
import { AlertTriangle, Check, ChevronDown, FileText, History, Loader2, MapPin, UserPlus } from 'lucide-react';
import { fetchResumeBlob } from '@/lib/api';
import { getInitials } from '@/components/pipeline/stages';
import { getScoreBadge } from '@/lib/utils';
import { barTone, daysAgo, historyStatus, scoreTone, Segment, SEGMENT_META } from './talentPoolFormat';

interface Props {
  match: any;
  selected: boolean;
  onToggle: () => void;
  onAdd: () => void;
  adding: boolean;
  disabled?: boolean;
}

/** One ranked candidate for the chosen job */
export default function MatchCard({ match: m, selected, onToggle, onAdd, adding, disabled }: Props) {
  const c = m.candidate;
  const seg = SEGMENT_META[m.segment as Segment];
  const badge = getScoreBadge(m.atsScore);
  const [cvBusy, setCvBusy] = useState(false);
  const [cvError, setCvError] = useState('');

  const openCv = async () => {
    setCvBusy(true);
    setCvError('');
    try {
      const url = URL.createObjectURL(await fetchResumeBlob(c.id));
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      setCvError(err.message);
    } finally {
      setCvBusy(false);
    }
  };

  return (
    <div className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all ${selected ? 'border-blue-400 ring-2 ring-blue-500/15 shadow-sm' : 'border-slate-200/80 hover:border-blue-200 hover:shadow-md'}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={`${selected ? 'Unselect' : 'Select'} ${c.fullName}`}
          aria-pressed={selected}
          className={`mt-2 w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0 ${selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white hover:border-blue-400'}`}
        >
          {selected && <Check className="w-3 h-3" />}
        </button>
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">{getInitials(c.fullName)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-base font-bold text-slate-900 break-words">{c.fullName}</p>
            <span title={seg.hint} className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${seg.cls}`}>
              {seg.label}
            </span>
            {m.recentRejection && (
              <span className="px-1.5 py-0.5 rounded-md border text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-200 inline-flex items-center gap-1" title="Rejected less than 90 days ago — check the reason first">
                <AlertTriangle className="w-3 h-3" /> Rejected {m.rejectedDaysAgo} days ago
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {[c.headline, c.currentCompany].filter(Boolean).join(' · ') || '—'}
          </p>
          <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2">
            {c.location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="w-3 h-3" /> {c.location}
              </span>
            )}
            <span>{c.totalExperienceYrs || 0} yrs experience</span>
            {c.seniorityLevel && <span>{c.seniorityLevel}</span>}
          </p>
        </div>
        <div className="text-center shrink-0">
          <div className={`relative flex h-[68px] w-[68px] items-center justify-center mx-auto ${scoreTone(m.atsScore)}`}>
            <svg aria-hidden="true" viewBox="0 0 72 72" className="absolute inset-0 h-full w-full -rotate-90"><circle cx="36" cy="36" r="30" fill="none" strokeWidth="5" className="stroke-slate-100" /><circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset={188.5 * (1 - Math.max(0, Math.min(100, m.atsScore)) / 100)} className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700" /></svg>
            <div><p className="text-xl font-bold tabular-nums leading-none">{m.atsScore}</p><p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-slate-400">ATS fit</p></div>
          </div>
          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${badge.class}`}>{badge.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-4 rounded-xl bg-slate-50/80 p-3 sm:ml-[82px]">
        {[
          ['Skills', m.skillsScore],
          ['Experience', m.expScore],
          ['Education', m.eduScore]
        ].map(([k, v]) => (
          <div key={k as string}>
            <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
              <span>{k}</span>
              <span className="font-bold tabular-nums text-slate-700">{v}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${barTone(v as number)}`} style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>

      {(m.matchedKeywords.length > 0 || m.missingKeywords.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-4 sm:pl-[82px]">
          {m.matchedKeywords.map((k: string) => (
            <span key={'m' + k} className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
              ✓ {k}
            </span>
          ))}
          {m.missingKeywords.map((k: string) => (
            <span key={'x' + k} className="px-1.5 py-0.5 rounded-md bg-white text-slate-400 border border-dashed border-slate-300 text-[10px] font-semibold" title="Missing must-have">
              {k}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-end justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><History className="h-3.5 w-3.5" /> {c.history.length} past application{c.history.length === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2 shrink-0">
          {cvError && <span className="text-[10px] text-amber-700">{cvError}</span>}
          {c.hasResume && (
            <button type="button" onClick={openCv} disabled={cvBusy} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
              {cvBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} CV
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            disabled={adding || disabled}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm shadow-blue-600/15 hover:bg-blue-700 disabled:opacity-60"
          >
            {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />} Add to pipeline
          </button>
        </div>
      </div>
      <details className="group mt-4 border-t border-slate-100 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg py-1 text-xs font-semibold text-blue-600 outline-offset-4 focus-visible:outline-blue-500 [&::-webkit-details-marker]:hidden">
          Profile & application history <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4">
          <dl className="grid grid-cols-2 gap-4 text-xs">
            <div><dt className="text-slate-400">Availability</dt><dd className="mt-1 font-medium text-slate-700">{c.availability || 'Not provided'}</dd></div>
            <div><dt className="text-slate-400">Seniority</dt><dd className="mt-1 font-medium text-slate-700">{c.seniorityLevel || 'Not provided'}</dd></div>
          </dl>
          {c.skills?.length > 0 && <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Profile skills</p><div className="flex flex-wrap gap-1.5">{c.skills.map((skill: string) => <span key={skill} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600">{skill}</span>)}</div></div>}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Application timeline</p>
            {c.history.length ? <ol className="ml-1.5 space-y-4 border-l border-slate-200 pl-4">
              {c.history.map((h: any, i: number) => <li key={`${h.jobId}-${i}`} className="relative text-xs"><span aria-hidden="true" className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-blue-400 ring-4 ring-slate-50" /><p className="font-semibold text-slate-800">{h.jobTitle} {h.companyCode && <span className="ml-1 rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500">{h.companyCode}</span>}</p><p className="mt-1 text-slate-500">{historyStatus(h)}</p><p className="mt-1 text-[10px] text-slate-400">{daysAgo(h.date)}</p></li>)}
            </ol> : <p className="text-xs text-slate-400">No application history available.</p>}
          </div>
        </div>
      </details>
    </div>
  );
}
