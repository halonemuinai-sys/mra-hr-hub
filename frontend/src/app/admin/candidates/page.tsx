'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  Building2,
  FileSpreadsheet,
  Award,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { can, useCurrentUser } from '@/lib/permissions';
import { formatRupiah, formatDate, getScoreBadge, getStatusBadge } from '@/lib/utils';
import SearchingRadarAnimation from '@/components/common/SearchingRadarAnimation';
import CandidateDetailDrawer from '@/components/candidates/CandidateDetailDrawer';

export default function CandidatesManagementPage() {
  const currentUser = useCurrentUser();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [jobFamily, setJobFamily] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState('');
  const [minScore, setMinScore] = useState('');
  const [page, setPage] = useState(1);

  // Drawer
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const fetchCandidates = async (pageToFetch = 1) => {
    setLoading(true);
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
      alert('Gagal mengambil data kandidat: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load or user clicks "Proses & Filter Data"
  const handleProcessData = () => {
    setPage(1);
    fetchCandidates(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCandidates(newPage);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data kandidat "${name}" secara permanen?`)) return;
    try {
      await api.deleteCandidate(id);
      fetchCandidates(page);
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Client-side quick CSV/Excel export
  const handleExportData = () => {
    if (candidates.length === 0) {
      alert('Tidak ada data yang dapat diekspor. Proses data terlebih dahulu.');
      return;
    }
    const headers = ['Nama Lengkap', 'Email', 'No HP', 'Headline', 'Pengalaman (Tahun)', 'ATS Score', 'Job Family', 'Status'];
    const rows = candidates.map(c => [
      `"${c.fullName}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.headline || ''}"`,
      c.totalExperienceYrs || 0,
      c.atsScore || 75,
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
      {/* 1. Header Konsisten */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Database Kandidat & Profiling ATS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen profiling terpadu, skor kecocokan algoritma ATS, dan pengelompokan talent pool
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            disabled={!dataLoaded || candidates.length === 0}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Ekspor Hasil Filter
          </button>
        </div>
      </div>

      {/* 2. Filter Bar Terpadu (Pola Winner Sport / GLC) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search text */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProcessData()}
              placeholder="Cari nama, email, no HP, atau keahlian..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Job Family */}
          <div>
            <select
              value={jobFamily}
              onChange={(e) => setJobFamily(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">Semua Kelompok Bidang</option>
              <option value="IT_DIGITAL">IT & Digital Software</option>
              <option value="RETAIL_OPS">Retail & Store Operations</option>
              <option value="CORPORATE_SERVICES">Corporate (Legal/GA/Finance)</option>
              <option value="CREATIVE_MEDIA">Creative & Broadcasting</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">Semua Status Seleksi</option>
              <option value="APPLIED">Baru Masuk (Applied)</option>
              <option value="ATS_SCREENED">Lolos ATS Pre-screen</option>
              <option value="SHORTLISTED">Shortlisted HR</option>
              <option value="INTERVIEW_HR">Interview HR / User</option>
              <option value="OFFERING">Offering Letter</option>
              <option value="HIRED">Diterima (Hired)</option>
              <option value="TALENT_POOL">Talent Pool</option>
            </select>
          </div>

          {/* Min ATS Score Slider/Select */}
          <div>
            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">Semua Skor ATS</option>
              <option value="85">🌟 Top Match (Score ≥ 85%)</option>
              <option value="75">⚡ Qualified (Score ≥ 75%)</option>
              <option value="60">📋 Passing (Score ≥ 60%)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {dataLoaded ? (
              <span>
                Menampilkan <strong>{candidates.length}</strong> dari <strong>{summary?.totalDatabase || 0}</strong> total kandidat di database
              </span>
            ) : (
              <span>Filter belum diterapkan ke database server</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleProcessData}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-500/25 flex items-center gap-1.5 transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            {loading ? 'Memproses Data...' : 'Proses & Filter Data'}
          </button>
        </div>
      </div>

      {/* 3. Blank State atau Tabel Data */}
      {!dataLoaded ? (
        <SearchingRadarAnimation
          title="Data Kandidat Belum Diambil"
          subtitle="Gunakan filter di atas untuk menyaring kelompok bidang, rentang skor ATS, atau status seleksi, lalu tekan tombol Proses & Filter Data."
        />
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-6">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Tidak ada kandidat yang memenuhi filter</h3>
          <p className="text-xs text-slate-500 mt-1">Coba kurangi batasan nilai ATS atau ubah kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Summary Pills on Table */}
          {summary && (
            <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="text-slate-700">Total Database: {summary.totalDatabase}</span>
              <span className="text-blue-700">Shortlisted: {summary.shortlistedCount}</span>
              <span className="text-blue-700">Tahap Interview: {summary.interviewCount}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Kandidat & Headline</th>
                  <th className="py-3 px-4">Kontak & Lokasi</th>
                  <th className="py-3 px-4">Kelompok Bidang</th>
                  <th className="py-3 px-4">Skor ATS Match</th>
                  <th className="py-3 px-4">Status Seleksi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((cand) => {
                  const scoreBadge = getScoreBadge(cand.atsScore || 75);
                  const statusBadge = getStatusBadge(cand.status);
                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedCandidate(cand)}
                    >
                      {/* Name & Headline */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0">
                            {cand.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                              {cand.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {cand.headline || 'Kandidat'}
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
                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-medium text-slate-800">{cand.email}</p>
                        <p className="text-[11px] text-slate-400">{cand.phone || '-'} • {cand.location || 'Indonesia'}</p>
                      </td>

                      {/* Grouping */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {cand.jobFamily || 'CORPORATE'}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                          {cand.totalExperienceYrs || 0} Thn ({cand.seniorityLevel || 'MID'})
                        </span>
                      </td>

                      {/* ATS Score */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreBadge.class}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${scoreBadge.dot}`} />
                          {cand.atsScore || 75}% • {scoreBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusBadge.class}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Buka Profiling DNA"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {can(currentUser, 'candidate.delete') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(cand.id, cand.fullName)}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Hapus Data"
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
              Halaman {meta.page} dari {meta.totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => handlePageChange(meta.page - 1)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={meta.page >= (meta.totalPages || 1)}
                onClick={() => handlePageChange(meta.page + 1)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer Profiling */}
      {selectedCandidate && (
        <CandidateDetailDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onUpdated={() => fetchCandidates(page)}
        />
      )}
    </div>
  );
}
