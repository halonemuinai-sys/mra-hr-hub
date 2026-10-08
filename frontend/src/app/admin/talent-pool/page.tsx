'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Briefcase, CheckCircle2, ExternalLink, GitCompareArrows, LayoutGrid, List, Loader2, RotateCcw, Search, SlidersHorizontal, Sparkles, Target, Users, UserPlus, UserSearch, X } from 'lucide-react';
import { api } from '@/lib/api';
import MatchCard from '@/components/talentPool/MatchCard';
import PoolList from '@/components/talentPool/PoolList';
import CandidateComparison from '@/components/talentPool/CandidateComparison';
import { ALL_SEGMENTS, MIN_SCORES, POOL_SEGMENTS, Segment, SEGMENT_META } from '@/components/talentPool/talentPoolFormat';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

type Mode = 'job' | 'pool';

export default function TalentPoolPage() {
  const [mode, setMode] = useState<Mode>('job');
  const [jobs, setJobs] = useState<any[]>([]);
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [jobId, setJobId] = useState('');
  const [minScore, setMinScore] = useState(60);
  const [segments, setSegments] = useState<Segment[]>(POOL_SEGMENTS);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [job, setJob] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pool, setPool] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [sort, setSort] = useState('score');
  const [compareOpen, setCompareOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const requestId = useRef(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [claim, setClaim] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<{ message: string; jobId: string } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const fail = (err: any, what: string) => setToast({ id: Date.now(), tone: 'error', message: `${what}: ${err.message}` });

  const loadJobs = useCallback(async () => {
    try {
      const res = await api.getTalentPoolJobs();
      setJobs(res.data || []);
      setPoolSize(res.poolSize ?? null);
      return res.data || [];
    } catch (err: any) {
      fail(err, 'Failed to load jobs');
      return [];
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // Deep link ?jobId= (reminders, job drawer); otherwise the job with the most strong matches
  useEffect(() => {
    loadJobs().then((list: any[]) => {
      const q = new URLSearchParams(window.location.search);
      const fromUrl = q.get('jobId');
      if (q.get('view') === 'pool') setMode('pool');
      if (fromUrl && list.some((j) => j.id === fromUrl)) setJobId(fromUrl);
      else if (list.length) setJobId([...list].sort((a, b) => b.strongMatches - a.strongMatches || b.matches - a.matches)[0].id);
    });
  }, [loadJobs]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadMatches = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (mode === 'job' && !jobId) return;
    setLoading(true);
    setLoadError(false);
    try {
      const params: Record<string, string> = { minScore: String(minScore), segments: segments.join(',') };
      if (debounced) params.search = debounced;
      if (mode === 'job') {
        const res = await api.matchTalentPool(jobId, params);
        if (currentRequest !== requestId.current) return;
        setJob(res.job);
        setMatches(res.data || []);
        setCounts(res.counts || {});
      } else {
        const res = await api.getTalentPool({ ...params, segments: segments.filter((s) => s !== 'ACTIVE').join(',') || POOL_SEGMENTS.join(',') });
        if (currentRequest !== requestId.current) return;
        setPool(res.data || []);
        setCounts(res.counts || {});
      }
    } catch (err: any) {
      if (currentRequest !== requestId.current) return;
      setLoadError(true);
      setMatches([]);
      setPool([]);
      setCounts({});
      fail(err, 'Failed to load matches');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [mode, jobId, minScore, segments, debounced]);

  useEffect(() => {
    loadMatches();
    return () => { requestId.current += 1; };
  }, [loadMatches]);
  useEffect(() => {
    setSelected(new Set());
    setCompareOpen(false);
  }, [jobId, mode, minScore, segments, debounced]);

  const toggleSegment = (s: Segment) =>
    setSegments((cur) => {
      const active = mode === 'pool' ? cur.filter((x) => x !== 'ACTIVE') : cur;
      return active.includes(s) ? (active.length > 1 ? active.filter((x) => x !== s) : active) : [...active, s];
    });

  const add = async (ids: string[]) => {
    if (!ids.length || !job || job.id !== jobId || loading || adding) return;
    setAdding(ids.length === 1 ? ids[0] : 'bulk');
    try {
      const res = await api.addFromTalentPool(job.id, ids, claim);
      const skipped = res.data?.skipped || [];
      setAdded({ message: res.message + (skipped.length ? ` (${skipped.map((s: any) => `${s.name || s.id}: ${s.reason}`).join('; ')})` : ''), jobId: job.id });
      setSelected(new Set());
      await Promise.all([loadMatches(), loadJobs()]);
    } catch (err: any) {
      fail(err, 'Could not add candidates');
    } finally {
      setAdding(null);
    }
  };

  const selectedJob = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);
  const jobDetails = job?.id === jobId ? job : selectedJob;
  const visibleSegments = mode === 'job' ? ALL_SEGMENTS : POOL_SEGMENTS;
  const allSelected = matches.length > 0 && matches.every((m) => selected.has(m.candidateId));
  const sortedMatches = useMemo(() => [...matches].sort((a, b) => {
    if (sort === 'name') return a.candidate.fullName.localeCompare(b.candidate.fullName);
    if (sort === 'experience') return (b.candidate.totalExperienceYrs || 0) - (a.candidate.totalExperienceYrs || 0) || b.atsScore - a.atsScore;
    if (sort === 'skills') return b.skillsScore - a.skillsScore || b.atsScore - a.atsScore;
    return b.atsScore - a.atsScore;
  }), [matches, sort]);
  const comparedMatches = sortedMatches.filter((m) => selected.has(m.candidateId));
  const resetFilters = () => { setSearch(''); setMinScore(60); setSegments(POOL_SEGMENTS); setSort('score'); };
  const filtersChanged = search !== '' || minScore !== 60 || segments.length !== POOL_SEGMENTS.length || POOL_SEGMENTS.some((s) => !segments.includes(s));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6 [&_button]:transition-colors [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-blue-500">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-32 h-96 w-96 rounded-full border-[60px] border-blue-500/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300"><Sparkles className="h-4 w-4" /> Talent rediscovery</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Talent Pool Matching
          </h1>
          <p className="text-sm leading-6 text-slate-300 mt-3">
            Great talent deserves another opportunity. Rediscover past candidates and find the right fit for your next opening.
          </p>
        </div>
        <div className="flex rounded-2xl border border-white/15 p-1 bg-white/5" role="group" aria-label="Talent pool view">
          {(
            [
              ['job', 'Match a job'],
              ['pool', `Talent pool${poolSize !== null ? ` · ${poolSize}` : ''}`]
            ] as [Mode, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={mode === k}
              onClick={() => { setMode(k); if (k === 'pool') setSegments((cur) => cur.some((s) => s !== 'ACTIVE') ? cur.filter((s) => s !== 'ACTIVE') : POOL_SEGMENTS); }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold ${mode === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              {k === 'job' ? <Target className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {label}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Candidates in pool', value: poolSize, hint: 'Talent ready to rediscover', icon: Users, tone: 'bg-blue-50 text-blue-600' },
          { label: 'Open opportunities', value: jobsLoading ? null : jobs.length, hint: 'Active roles across companies', icon: Briefcase, tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'Strong matches', value: selectedJob?.strongMatches ?? null, hint: selectedJob ? `Score 75+ / ${selectedJob.title}` : 'Select a role to see matches', icon: Sparkles, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Highest match score', value: selectedJob?.topScore ?? null, hint: selectedJob ? `Best fit / ${selectedJob.title}` : 'Select a role to see scores', icon: Target, tone: 'bg-amber-50 text-amber-600' }
        ].map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-500">{label}</p><span className={`rounded-xl p-2 ${tone}`}><Icon className="h-4 w-4" /></span></div>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-slate-900">{value ?? '—'}</p>
            <p className="mt-1.5 text-[11px] leading-4 text-slate-400">{hint}</p>
          </div>
        ))}
      </div>

      {mode === 'job' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Briefcase className="h-5 w-5" /></span><div className="flex-1"><h2 className="text-sm font-bold text-slate-900">Find talent for a role</h2><p className="mt-0.5 text-xs text-slate-500">Choose an opening to see candidates ranked by ATS fit.</p></div>{jobId && <Link href={`/admin/pipeline?jobId=${jobId}`} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">Pipeline <ArrowUpRight className="h-4 w-4" /></Link>}</div>
          <label className="block">
            <span className="block text-[11px] font-bold text-slate-700 mb-1">Open job</span>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                {!jobs.length && <option value="">{jobsLoading ? 'Loading jobs…' : 'No open jobs available'}</option>}
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company ? `[${j.company.code}] ` : ''}
                    {j.title} — {j.matches ? `${j.matches} match${j.matches === 1 ? '' : 'es'}${j.strongMatches ? `, ${j.strongMatches} strong` : ''}` : 'no matches'}
                  </option>
                ))}
              </select>
            </div>
          </label>
          {jobDetails && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
              <span>
                {jobDetails.department} · {jobDetails.location} · {jobDetails.employmentType}
              </span>
              <span>
                Min. <b className="text-slate-700">{jobDetails.minExperience} yrs</b> · <b className="text-slate-700">{jobDetails.minEducation}</b>
              </span>
              <span className="flex flex-wrap gap-1">
                {(jobDetails.mustHaveSkills || []).map((s: string) => (
                  <span key={s} className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-semibold">
                    {s}
                  </span>
                ))}
                {(jobDetails.niceToHaveSkills || []).map((s: string) => (
                  <span key={s} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    {s}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      )}

      {added && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{added.message}</span>
          <Link href={`/admin/pipeline?jobId=${added.jobId}`} className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline">
            Open in pipeline <ExternalLink className="w-3 h-3" />
          </Link>
          <button type="button" onClick={() => setAdded(null)} aria-label="Dismiss" className="p-1 rounded-lg hover:bg-emerald-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-base font-bold text-slate-900">{mode === 'job' ? 'Recommended candidates' : 'Explore your talent pool'}</h2><p className="mt-1 text-xs text-slate-500">{mode === 'job' ? 'Review fit, skills, and application history before reconnecting.' : 'Discover familiar talent and the open roles they match.'}</p></div>
            <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating</> : `${mode === 'job' ? matches.length : pool.length} candidates`}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                aria-label="Search candidates"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, headline, company, skill…"
                className="pl-9 pr-3 py-3 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500" role="group" aria-label="Minimum ATS score">
              <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /><span className="font-semibold mr-1">Min. score</span>
              {MIN_SCORES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMinScore(s)}
                  aria-pressed={minScore === s}
                  className={`px-2.5 py-1.5 rounded-lg font-bold tabular-nums ${minScore === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {s}+
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleSegments.map((s) => {
              const on = segments.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  title={SEGMENT_META[s].hint}
                  onClick={() => toggleSegment(s)}
                  aria-pressed={on}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${on ? SEGMENT_META[s].cls : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                >
                  {SEGMENT_META[s].label} <span className="opacity-70 tabular-nums">{counts[s] ?? 0}</span>
                </button>
              );
            })}
            {filtersChanged && <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"><RotateCcw className="h-3 w-3" /> Reset filters</button>}
            {mode === 'job' && matches.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected(allSelected ? new Set() : new Set(matches.map((m) => m.candidateId)))}
                disabled={loading}
                className="ml-auto text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                {allSelected ? 'Clear selection' : `Select all ${matches.length}`}
              </button>
            )}
          </div>
          {mode === 'job' && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick filters">
                <span className="mr-1 text-[11px] font-medium text-slate-400">QUICK FOCUS</span>
                <button type="button" onClick={() => { setSearch(''); setMinScore(80); setSegments(POOL_SEGMENTS); }} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">80+ ATS score</button>
                <button type="button" onClick={() => { setSearch(''); setMinScore(60); setSegments(['SILVER_MEDALIST']); }} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">Silver medalists</button>
              </div>
              <div className="flex items-center gap-3">
                <select aria-label="Sort candidates" value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600 focus:outline-blue-500">
                  <option value="score">Highest ATS score</option><option value="skills">Strongest skills</option><option value="experience">Most experienced</option><option value="name">Name A-Z</option>
                </select>
                <div role="group" aria-label="Candidate layout" className="flex gap-1 rounded-xl bg-slate-100 p-1">
                  {(['list', 'grid'] as const).map((view) => <button key={view} type="button" aria-label={`${view} view`} aria-pressed={layout === view} onClick={() => setLayout(view)} className={`rounded-lg p-2 ${layout === view ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>{view === 'list' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}</button>)}
                </div>
              </div>
            </div>
          )}
        </div>

        {loadError ? (
          <div role="alert" className="px-6 py-14 text-center"><p className="font-semibold text-slate-800">Could not load candidates</p><p className="mt-1 text-sm text-slate-500">Please try again to get the latest matches.</p><button type="button" onClick={loadMatches} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Retry</button></div>
        ) : mode === 'pool' ? (
          <PoolList
            rows={pool}
            loading={loading}
            onPickJob={(id) => {
              setJobId(id);
              setMode('job');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : loading && !matches.length ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : !matches.length ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50"><UserSearch className="w-8 h-8 text-blue-500" /></span>
            <p className="text-sm font-bold text-slate-800 mt-2">{!jobId ? (jobsLoading ? 'Finding open opportunities...' : 'No open opportunities yet') : 'No candidates match your current filters'}</p>
            <p className="text-xs text-slate-500 mt-1">{jobId ? 'Try a lower score, a different talent segment, or another opening.' : 'Matching becomes available when there is an open job.'}</p>
            {jobId && <button type="button" onClick={() => { setSearch(''); setMinScore(50); setSegments(ALL_SEGMENTS); }} className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Broaden search</button>}
          </div>
        ) : (
          <div aria-busy={loading} className={`p-3 sm:p-5 grid gap-4 items-start bg-slate-50/60 rounded-b-2xl ${layout === 'grid' ? 'xl:grid-cols-2' : 'grid-cols-1'} ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            {sortedMatches.map((m) => (
              <MatchCard
                key={m.candidateId}
                match={m}
                selected={selected.has(m.candidateId)}
                onToggle={() =>
                  setSelected((cur) => {
                    const next = new Set(cur);
                    if (next.has(m.candidateId)) next.delete(m.candidateId);
                    else next.add(m.candidateId);
                    return next;
                  })
                }
                onAdd={() => add([m.candidateId])}
                adding={adding === m.candidateId}
                disabled={loading || !!adding}
              />
            ))}
          </div>
        )}
      </div>

      {mode === 'job' && (selected.size > 0 || matches.length > 0) && (
        <div className="sticky bottom-4 z-20">
          <div className={`mx-auto max-w-3xl flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl ${selected.size ? '' : 'hidden'}`}>
            <span className="text-xs font-bold">{selected.size} selected</span>
            <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-slate-300 hover:text-white">Clear</button>
            <button type="button" disabled={comparedMatches.length < 2 || comparedMatches.length > 3 || loading} onClick={() => setCompareOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40" title="Select 2 or 3 candidates to compare"><GitCompareArrows className="h-4 w-4" /> Compare (2-3)</button>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
              <input type="checkbox" checked={claim} onChange={(e) => setClaim(e.target.checked)} className="accent-blue-600" />
              Assign to me as PIC
            </label>
            <span className="text-[10px] text-slate-400 hidden sm:inline">They enter the pipeline as Applied; the ATS score is recalculated for this job.</span>
            <button
              type="button"
              onClick={() => add([...selected])}
              disabled={loading || !!adding}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-xs font-bold hover:bg-blue-700 disabled:opacity-60"
            >
              {adding === 'bulk' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Add {selected.size} to {job?.title || 'the job'}
            </button>
          </div>
        </div>
      )}

      {compareOpen && comparedMatches.length >= 2 && comparedMatches.length <= 3 && <CandidateComparison matches={comparedMatches} jobTitle={jobDetails?.title || 'this role'} onClose={() => setCompareOpen(false)} />}
      <AnimatePresence>{toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}</AnimatePresence>
    </div>
  );
}
