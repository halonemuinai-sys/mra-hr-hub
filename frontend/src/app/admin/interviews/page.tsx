'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, CalendarCheck2, CalendarClock, CalendarDays, CheckCheck, ChevronLeft, ChevronRight, Columns3, Hourglass, List, RefreshCw, SlidersHorizontal, Users, X } from 'lucide-react';
import { api } from '@/lib/api';
import CompanySelect from '@/components/companies/CompanySelect';
import { useCompanies } from '@/components/companies/useCompanies';
import WeekView from '@/components/interviews/WeekView';
import MonthView from '@/components/interviews/MonthView';
import AgendaView from '@/components/interviews/AgendaView';
import InterviewDetailModal from '@/components/interviews/InterviewDetailModal';
import ScheduleModal from '@/components/interviews/ScheduleModal';
import { addDays, fmtDay, InterviewEvent, startOfDay, startOfWeek, STAGE_META, ymd } from '@/components/interviews/interviewFormat';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

type View = 'week' | 'month' | 'agenda';
const VIEW_KEY = 'hr_hub_interview_view';
const shortName = (n?: string | null) => String(n || '').replace(/\s*\(.*\)\s*$/, '');

/** First and last day shown for a view */
function rangeOf(view: View, anchor: Date) {
  if (view === 'week') {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 6) };
  }
  if (view === 'month') {
    const from = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    return { from, to: addDays(from, 41) };
  }
  const from = startOfDay(anchor);
  return { from, to: addDays(from, 29) };
}

export default function InterviewCalendarPage() {
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState('');
  const [stage, setStage] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [mine, setMine] = useState(false);
  const [detail, setDetail] = useState<InterviewEvent | null>(null);
  const [scheduling, setScheduling] = useState<InterviewEvent | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const { companies } = useCompanies();

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY) as View | null;
      if (v === 'week' || v === 'month' || v === 'agenda') setView(v);
    } catch {}
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  const range = useMemo(() => rangeOf(view, anchor), [view, anchor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { from: ymd(range.from), to: ymd(range.to) };
      if (companyId) params.companyId = companyId;
      if (stage) params.stage = stage;
      if (interviewer) params.interviewer = interviewer;
      if (mine) params.mine = '1';
      const res = await api.getInterviews(params);
      setData(res.data);
    } catch (err: any) {
      setToast({ id: Date.now(), tone: 'error', message: 'Failed to load interviews: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, [range, companyId, stage, interviewer, mine]);

  useEffect(() => {
    load();
  }, [load]);

  const step = (dir: 1 | -1) => {
    if (view === 'week') setAnchor((a) => addDays(a, 7 * dir));
    else if (view === 'month') setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + dir, 1));
    else setAnchor((a) => addDays(a, 30 * dir));
  };

  const title =
    view === 'month'
      ? anchor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : `${fmtDay(range.from, { day: 'numeric', month: 'short' })} – ${fmtDay(range.to, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const events: InterviewEvent[] = data?.events || [];
  const s = data?.summary;
  const tiles = [
    { label: 'Today', hint: 'Interviews on your radar', value: s?.today, icon: CalendarDays, cls: 'text-blue-600', surface: 'bg-blue-50 ring-blue-100', accent: 'bg-blue-500' },
    { label: 'This week', hint: 'Your weekly schedule', value: s?.thisWeek, icon: CalendarClock, cls: 'text-indigo-600', surface: 'bg-indigo-50 ring-indigo-100', accent: 'bg-indigo-500' },
    { label: 'Awaiting outcome', hint: 'Ready for a follow-up', value: s?.awaitingOutcome, icon: Hourglass, cls: 'text-amber-600', surface: 'bg-amber-50 ring-amber-100', accent: 'bg-amber-400' },
    { label: 'Schedule clashes', hint: 'Overlapping interviews', value: s?.conflicts, icon: AlertTriangle, cls: s?.conflicts ? 'text-amber-600' : 'text-emerald-600', surface: s?.conflicts ? 'bg-amber-50 ring-amber-100' : 'bg-emerald-50 ring-emerald-100', accent: s?.conflicts ? 'bg-amber-400' : 'bg-emerald-500' }
  ];
  const activeFilters = [companyId, stage, interviewer, mine].filter(Boolean).length;
  const resetFilters = () => { setCompanyId(''); setStage(''); setInterviewer(''); setMine(false); };
  const select = 'min-w-0 w-full sm:w-auto px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-6 [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-blue-500 [&_button]:focus-visible:ring-offset-2">
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-white via-blue-50/60 to-indigo-50 px-5 py-6 sm:px-7 sm:py-7">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-blue-100/40" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><CalendarDays className="h-7 w-7" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Talent acquisition</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Interview Calendar</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">A clear view of every conversation. Plan interviews and keep your hiring moving.</p>
            </div>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-white bg-white/90 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Refreshing' : 'Refresh calendar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className={`absolute inset-y-5 left-0 w-1 rounded-r-full ${t.accent}`} />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">{t.label}</p>
              <div className={`h-9 w-9 rounded-xl ring-1 flex items-center justify-center shrink-0 ${t.surface}`}><t.icon className={`w-4 h-4 ${t.cls}`} /></div>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-900">{loading && !data ? <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-slate-100" /> : t.value ?? 0}</p>
            <p className="mt-1 text-[11px] text-slate-400">{t.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 sm:mr-1"><SlidersHorizontal className="h-4 w-4 text-slate-400" /> Filters {activeFilters > 0 && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">{activeFilters}</span>}</div>
          {companies.length > 0 && <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} allLabel="All companies" withUnassigned className="w-full sm:w-52 [&_select]:border-slate-200 [&_select]:py-2.5 [&_select]:font-medium" />}
          <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Stage" className={select}>
            <option value="">All interviews</option>
            <option value="INTERVIEW_HR">HR interviews</option>
            <option value="INTERVIEW_USER">User interviews</option>
          </select>
          <select value={interviewer} onChange={(e) => setInterviewer(e.target.value)} aria-label="Interviewer" className={`${select} sm:max-w-[200px]`}>
            <option value="">All interviewers</option>
            {(data?.interviewers || []).map((n: string) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer select-none transition-colors ${mine ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30" />
            My interviews
          </label>
          {activeFilters > 0 && <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 sm:ml-auto"><X className="h-3.5 w-3.5" /> Clear filters</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_290px] gap-5 items-start">
        <section aria-label="Interview schedule" aria-busy={loading} className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 sm:px-5 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
              <p className="mt-1 text-xs text-slate-400">{loading ? 'Updating schedule…' : `${events.filter((e) => e.status !== 'CANCELLED').length} interviews in this period`}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => step(-1)} aria-label="Previous" className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setAnchor(startOfDay(new Date()))} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Today
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next" className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5 py-3">
            <div className="inline-flex bg-slate-100 rounded-xl p-1" role="group" aria-label="View">
              {(['week', 'month', 'agenda'] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => changeView(v)}
                  aria-pressed={view === v}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${view === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {v === 'week' ? <Columns3 className="h-3.5 w-3.5" /> : v === 'month' ? <CalendarDays className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> HR interview</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> User interview</span></div>
          </div>
          {loading && !data ? <div role="status" className="flex min-h-[480px] items-center justify-center gap-2 text-sm text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" /> Loading interviews…</div> : <>
          {view === 'week' && <WeekView weekStart={range.from} events={events} onOpen={setDetail} />}
          {view === 'month' && (
            <MonthView
              month={anchor}
              events={events}
              onOpen={setDetail}
              onPickDay={(d) => {
                setAnchor(d);
                changeView('week');
              }}
            />
          )}
          {view === 'agenda' && <AgendaView events={events} onOpen={setDetail} />}
          </>}
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] text-slate-400">Select an interview to view details, send an invite, or reschedule.</div>
        </section>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><CalendarClock className="h-5 w-5" /></div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              Waiting to be scheduled
              <span className={`min-w-5 px-1.5 rounded-md text-[10px] tabular-nums ${data?.unscheduled?.length ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {data?.unscheduled?.length ?? 0}
              </span>
            </h3>
            <p className="text-xs leading-relaxed text-slate-400 mt-1.5">Set a date for the next conversation.</p>
            <ul className="mt-4 space-y-2 max-h-80 overflow-y-auto">
              {(data?.unscheduled || []).map((u: InterviewEvent) => (
                <li key={u.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${STAGE_META[u.stage]?.soft}`}>{u.candidate.fullName.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('')}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{u.candidate.fullName}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {STAGE_META[u.stage]?.short} · {u.job.title} · {shortName(u.pic?.name) || 'no PIC'}
                    </p>
                  </div>
                  {u.actions.schedule && (
                    <button type="button" onClick={() => setScheduling(u)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-blue-100 bg-white hover:bg-blue-50 text-blue-600 text-[10px] font-bold">
                      Schedule <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}
                </li>
              ))}
              {!data?.unscheduled?.length && <li className="rounded-xl bg-emerald-50/70 p-4 text-center text-xs text-emerald-700"><CheckCheck className="mx-auto mb-2 h-5 w-5" />{loading ? 'Checking schedules…' : data ? 'All interviews have a date.' : 'Schedule data is unavailable.'}</li>}
            </ul>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Interviewer workload
            </h3>
            <p className="mt-1.5 text-xs text-slate-400">Interview distribution this week</p>
            <ul className="mt-4 space-y-3">
              {(s?.interviewersThisWeek || []).map((r: any) => {
                const max = Math.max(...(s?.interviewersThisWeek || []).map((x: any) => x.count), 1);
                return (
                  <li key={r.name}>
                    <button
                      type="button"
                      onClick={() => setInterviewer(interviewer === r.name ? '' : r.name)}
                      aria-pressed={interviewer === r.name}
                      className={`w-full text-left rounded-xl p-2 transition-colors hover:bg-slate-50 ${interviewer === r.name ? 'bg-blue-50 ring-1 ring-blue-100' : ''}`}
                      title="Filter the calendar to this interviewer"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800 truncate">{r.name}</span>
                        <span className="tabular-nums text-slate-500 flex items-center gap-1">
                          {r.conflicts > 0 && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {r.count}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${r.conflicts ? 'bg-amber-400' : 'bg-linear-to-r from-blue-500 to-indigo-400'}`} style={{ width: `${(r.count / max) * 100}%` }} />
                      </div>
                    </button>
                  </li>
                );
              })}
              {!s?.interviewersThisWeek?.length && <li className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400"><CalendarCheck2 className="mx-auto mb-2 h-5 w-5 text-slate-300" />{loading ? 'Loading team schedule…' : data ? 'No interviews this week.' : 'Team schedule is unavailable.'}</li>}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 text-[11px] text-slate-500 space-y-3 sm:col-span-2 xl:col-span-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Calendar guide</h3>
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-300 border-l-2 border-l-blue-500" /> HR interview (upcoming)</p>
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300 border-l-2 border-l-emerald-500" /> User interview (upcoming)</p>
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-400" /> Passed — awaiting outcome</p>
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Completed</p>
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded ring-2 ring-amber-500" /> Clash with the same interviewer</p>
          </section>
        </aside>
      </div>

      <AnimatePresence>
        {detail && (
          <InterviewDetailModal
            key={detail.id}
            event={detail}
            onClose={() => setDetail(null)}
            onReschedule={(e) => {
              setDetail(null);
              setScheduling(e);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scheduling && (
          <ScheduleModal
            event={scheduling}
            interviewers={data?.interviewers || []}
            onClose={() => setScheduling(null)}
            onSaved={(message) => {
              setScheduling(null);
              setToast({ id: Date.now(), tone: 'success', message });
              load();
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}</AnimatePresence>
    </div>
  );
}
