'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SearchingRadarAnimation from '@/components/common/SearchingRadarAnimation';
import {
  Users,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { can, useCurrentUser } from '@/lib/permissions';
import { getScoreBadge, getStatusBadge } from '@/lib/utils';
import { stageLabel, getInitials } from '@/components/pipeline/stages';
import CandidateDetailDrawer from '@/components/candidates/CandidateDetailDrawer';

export default function CandidatesManagementPage() {
  const currentUser = useCurrentUser();
  const reduceMotion = useReducedMotion();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [jobFamily, setJobFamily] = useState('');
  const [seniorityLevel] = useState('');
  const [minScore, setMinScore] = useState('');
  const [page, setPage] = useState(1);

  // Drawer
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const fetchCandidates = async (pageToFetch = 1) => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page: pageToFetch, limit: 15 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (jobFamily) params.jobFamily = jobFamily;
      if (seniorityLevel) params.seniorityLevel = seniorityLevel;
      if (minScore) params.minScore = minScore;

      const res = await api.getCandidates(params);
      if (res.success) {
        setCandidates(res.data || []);
        setMeta(res.meta || { page: 1, total: 0, totalPages: 1 });
        setSummary(res.summary || null);
        setDataLoaded(true);
      }
    } catch (err: any) {
      setError('Unable to load candidates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Candidate data is requested only after the user starts processing.
  const handleProcessData = () => {
    if (loading) return;
    setPage(1);
    fetchCandidates(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCandidates(newPage);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete candidate "${name}"?`)) return;
    try {
      await api.deleteCandidate(id);
      fetchCandidates(page);
    } catch (err: any) {
      alert('Unable to delete: ' + err.message);
    }
  };

  // Client-side quick CSV/Excel export
  const handleExportData = () => {
    if (candidates.length === 0) {
      alert('No candidates available to export. Load results first.');
      return;
    }
    const headers = ['Full Name', 'Email', 'Phone', 'Headline', 'Experience (Years)', 'ATS Score', 'Job Family', 'Status'];
    const rows = candidates.map(c => [
      `"${c.fullName}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.headline || ''}"`,
      c.totalExperienceYrs || 0,
      c.atsScore ?? 0,
      `"${c.jobFamily || ''}"`,
      `"${c.status || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HR_HUB_Candidates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border-[40px] border-blue-400/10" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300"><Users className="h-4 w-4" /> Talent Acquisition / Candidates</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Candidate Database<br /><span className="text-blue-300">& ATS Profiling</span></h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">Explore your talent pool, compare candidate profiles, and find the right match for every role.</p>
          </div>
          <button type="button" onClick={handleExportData} disabled={!dataLoaded || loading || candidates.length === 0} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-40 sm:self-center">
            <Download className="h-4 w-4" /> Export current page
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Matching candidates', value: meta.total, hint: 'Across all filtered pages', Icon: Users, tone: 'bg-blue-50 text-blue-600' },
          { label: 'Shortlisted applications', value: summary?.shortlistedCount, hint: 'Database overview', Icon: Award, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Interview applications', value: summary?.interviewCount, hint: 'Database overview', Icon: Clock, tone: 'bg-indigo-50 text-indigo-600' }
        ].map(({ label, value, hint, Icon, tone }) => (
          <div key={label} className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className={`rounded-xl p-3 ${tone}`}><Icon className="h-5 w-5" /></span>
            <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{dataLoaded ? value ?? 0 : '—'}</p><p className="mt-1 text-[11px] text-slate-400">{hint}</p></div>
          </div>
        ))}
      </div>

      {/* 2. Filter Bar Terpadu (Pola Winner Sport / GLC) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div><h2 className="text-sm font-semibold text-slate-900">Find your next hire</h2><p className="mt-1 text-xs text-slate-500">Search and narrow your shortlist with the filters below.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search text */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProcessData()}
              aria-label="Search candidates" placeholder="Search name, email, phone, or headline..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Job Family */}
          <div>
            <select
              aria-label="Job family"
              value={jobFamily}
              onChange={(e) => setJobFamily(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">All job families</option>
              <option value="IT_DIGITAL">IT & Digital Software</option>
              <option value="RETAIL_OPS">Retail & Store Operations</option>
              <option value="CORPORATE_SERVICES">Corporate (Legal/GA/Finance)</option>
              <option value="CREATIVE_MEDIA">Creative & Broadcasting</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              aria-label="Selection stage"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">All selection stages</option>
              <option value="APPLIED">Applied</option>
              <option value="ATS_SCREENED">ATS Screened</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW_HR">HR Interview</option>
              <option value="INTERVIEW_USER">Hiring Manager Interview</option>
              <option value="REJECTED">Rejected</option>
              <option value="OFFERING">Offer</option>
              <option value="HIRED">Hired</option>
              <option value="TALENT_POOL">Talent Pool</option>
            </select>
          </div>

          {/* Min ATS Score Slider/Select */}
          <div>
            <select
              aria-label="Minimum ATS score"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">All ATS scores</option>
              <option value="85">🌟 Top Match (Score ≥ 85%)</option>
              <option value="75">⚡ Qualified (Score ≥ 75%)</option>
              <option value="60">📋 Passing (Score ≥ 60%)</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="text-xs text-slate-500">
            {dataLoaded ? (
              <span>
                Showing <strong>{candidates.length}</strong> of <strong>{meta.total || 0}</strong> matching candidates
              </span>
            ) : (
              <span>Choose your filters, then click Process Data.</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleProcessData}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-500/25 flex items-center gap-1.5 transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            {loading ? 'Processing...' : 'Process Data'}
          </button>
        </div>
      </div>

      {/* 3. Blank State atau Tabel Data */}
      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">{error}<button type="button" onClick={() => fetchCandidates(page)} className="ml-3 font-semibold underline">Retry</button></div>}
      <motion.div
        key={loading ? 'processing' : !dataLoaded ? 'ready' : `results-${meta.page}`}
        initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25 }}
        aria-busy={loading}
      >
      {loading ? (
        <SearchingRadarAnimation processing title="Processing candidate data..." subtitle="Loading profiles and ATS results for your selected filters." />
      ) : !dataLoaded ? (
        <SearchingRadarAnimation />
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-6">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No matching candidates</h3>
          <p className="text-xs text-slate-500 mt-1">Try lowering the minimum ATS score or changing your search keywords.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Talent directory</h2><span aria-live="polite" className="text-xs text-slate-500">{loading ? 'Updating results...' : `${meta.total} matching candidates`}</span></div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-4 px-5">Candidate</th>
                  <th className="py-4 px-5">Contact & Location</th>
                  <th className="py-4 px-5">Job Family</th>
                  <th className="py-4 px-5">ATS Match</th>
                  <th className="py-4 px-5">Selection Stage</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((cand) => {
                  const scoreBadge = getScoreBadge(cand.atsScore ?? 0);
                  const statusBadge = getStatusBadge(cand.status);
                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedCandidate(cand)}
                    >
                      {/* Name & Headline */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {getInitials(cand.fullName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                              {cand.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {cand.headline || 'Candidate'}
                            </p>
                            {cand.tags && cand.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {cand.tags.slice(0, 2).map((t: string, idx: number) => (
                                  <span key={idx} className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="py-4 px-5 text-slate-600">
                        <p className="font-medium text-slate-800">{cand.email}</p>
                        <p className="text-[11px] text-slate-400">{cand.phone || '-'} • {cand.location || 'Indonesia'}</p>
                      </td>

                      {/* Grouping */}
                      <td className="py-4 px-5">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {(cand.jobFamily || 'Uncategorized').replace(/_/g, ' ')}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                          {cand.totalExperienceYrs || 0} years ({cand.seniorityLevel || 'MID'})
                        </span>
                      </td>

                      {/* ATS Score */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreBadge.class}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${scoreBadge.dot}`} />
                          {cand.atsScore == null ? 'N/A' : `${cand.atsScore}%`} • {scoreBadge.label}
                        </span>
                        <div aria-hidden="true" className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${scoreBadge.dot}`} style={{ width: `${Math.min(100, Math.max(0, cand.atsScore ?? 0))}%` }} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusBadge.class}`}>
                          {stageLabel(cand.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View candidate profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {can(currentUser, 'candidate.delete') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(cand.id, cand.fullName)}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Delete candidate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {meta.page} of {meta.totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={loading || meta.page <= 1}
                onClick={() => handlePageChange(meta.page - 1)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={loading || meta.page >= (meta.totalPages || 1)}
                onClick={() => handlePageChange(meta.page + 1)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      </motion.div>

      {/* Slide-Over Drawer Profiling */}
      {selectedCandidate && (
        <CandidateDetailDrawer
          key={selectedCandidate.id}
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onUpdated={() => fetchCandidates(page)}
        />
      )}
    </div>
  );
}
