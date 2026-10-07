'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Star,
  Award,
  DollarSign,
  Clock,
  Save,
  Copy,
  Check,
  Building2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { formatRupiah, formatDate, getScoreBadge, getStatusBadge } from '@/lib/utils';
import CandidateRadarChart from './CandidateRadarChart';
import { api } from '@/lib/api';
import { useCurrentUser } from '@/lib/permissions';
import { canMove } from '@/components/pipeline/ownership';

interface Props {
  candidate: any | null;
  onClose: () => void;
  onUpdated: () => void;
}

// Wrapper keeps the early return out of the component that calls hooks (rules of hooks)
export default function CandidateDetailDrawer(props: Props) {
  if (!props.candidate) return null;
  return <CandidateDrawerContent {...props} />;
}

function CandidateDrawerContent({ candidate, onClose, onUpdated }: Props) {
  const currentUser = useCurrentUser();
  const app = candidate.latestApplication || (candidate.applications && candidate.applications[0]);
  const stageLocked = !!app && !canMove(currentUser, app);
  const [status, setStatus] = useState<string>(app?.status || 'APPLIED');
  const [rating, setRating] = useState<number>(app?.scorecardRating || 0);
  const [notes, setNotes] = useState<string>(app?.recruiterNotes || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const atsScore = candidate.atsScore || app?.atsScore || 75;
  const scoreBadge = getScoreBadge(atsScore);
  const statusBadge = getStatusBadge(status);

  // Radar data
  const radarData = candidate.radarDimensions || candidate.evaluation?.radarDimensions || [
    { subject: 'Teknis', score: app?.skillsScore || 80, fullMark: 100 },
    { subject: 'Pengalaman', score: app?.expScore || 75, fullMark: 100 },
    { subject: 'Pendidikan', score: app?.eduScore || 85, fullMark: 100 },
    { subject: 'Stabilitas', score: 78, fullMark: 100 },
    { subject: 'Kecocokan Lowongan', score: atsScore, fullMark: 100 }
  ];

  const matchedKeywords = app?.matchedKeywords || candidate.evaluation?.matchedKeywords || [];
  const missingKeywords = app?.missingKeywords || candidate.evaluation?.missingKeywords || [];

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleAppendNote = (tagText: string) => {
    setNotes((prev) => (prev ? `${prev.trim()} • ${tagText}` : tagText));
  };

  const handleSaveAction = async () => {
    if (!app?.id) {
      alert('Aplikasi lowongan tidak terasosiasi untuk kandidat ini.');
      return;
    }
    setSaving(true);
    try {
      await api.updateApplicationStatus(app.id, {
        status,
        recruiterNotes: notes,
        scorecardRating: rating
      });
      alert('Status dan evaluasi kandidat berhasil disimpan!');
      onUpdated();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return 'HR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col z-10 overflow-hidden border-l border-slate-200"
        >
          {/* 1. Executive Slate Header */}
          <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800 relative">
            <div className="flex items-start gap-4">
              {/* Monogram Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-800 text-white font-bold text-lg flex items-center justify-center ring-2 ring-blue-500/30 shadow-md shrink-0">
                {getInitials(candidate.fullName)}
              </div>

              <div className="space-y-1">
                {/* Status & ATS Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreBadge.class}`}>
                    ATS {atsScore}% • {scoreBadge.label}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                  {candidate.intakeSource === 'EXCEL_TEMPLATE' && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      Template Ingestion
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold tracking-tight text-white">{candidate.fullName}</h2>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{candidate.headline || 'Kandidat Profesional'}</span>
                  {candidate.currentCompany && (
                    <span className="text-slate-400">• {candidate.currentCompany}</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Scrollable Cockpit Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/60">
            {/* Quick 4-Grid Executive Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pengalaman</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {candidate.totalExperienceYrs || 0} Tahun
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ekspektasi Gaji</span>
                </div>
                <div className="text-sm font-bold text-slate-900 truncate" title={formatRupiah(candidate.expectedSalary)}>
                  {formatRupiah(candidate.expectedSalary)}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ketersediaan</span>
                </div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {candidate.availability || 'Segera'}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  <span>Domisili</span>
                </div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {candidate.location || 'Indonesia'}
                </div>
              </div>
            </div>

            {/* Quick Contact & Info Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700 font-medium">{candidate.email}</span>
                <button
                  onClick={() => handleCopy(candidate.email, 'email')}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Salin Email"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-700 font-medium">{candidate.phone || '-'}</span>
                {candidate.phone && (
                  <button
                    onClick={() => handleCopy(candidate.phone, 'phone')}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Salin No HP"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Candidate DNA & Match Profiling */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Candidate DNA & Match Profiling
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluasi otomatis 5 pilar kecocokan kompetensi dan kriteria lowongan
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  Score {atsScore}/100
                </span>
              </div>

              {/* Chart & 5-Pillar Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                  <CandidateRadarChart data={radarData} />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Breakdown Skor 5 Pilar
                  </p>
                  {radarData.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-600">{item.subject}</span>
                        <span className="font-bold text-slate-900">{item.score}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Keyword ATS Matching Analysis */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Keyword ATS Matching Analysis
                    </h3>
                    <p className="text-xs text-slate-500">
                      Perbandingan kata kunci spesifikasi lowongan dengan resume kandidat
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {matchedKeywords.length} Teridentifikasi
                </span>
              </div>

              {/* Matched Keywords */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Cocok dengan Kriteria Lowongan ({matchedKeywords.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {matchedKeywords.length > 0 ? (
                    matchedKeywords.map((kw: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/80 flex items-center gap-1 shadow-2xs"
                      >
                        ✓ {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Belum ada kata kunci mutlak yang cocok</span>
                  )}
                </div>
              </div>

              {/* Missing Keywords */}
              {missingKeywords.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Kriteria Tambahan Belum Ditemukan di CV ({missingKeywords.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingKeywords.map((kw: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1"
                      >
                        ✕ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Riwayat Pengalaman Kerja */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Riwayat Pengalaman Kerja
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kronologi rekam jejak profesional kandidat
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {candidate.experiences && candidate.experiences.length > 0 ? (
                  candidate.experiences.map((exp: any, i: number) => (
                    <div key={i} className="relative pl-6 border-l-2 border-slate-200 pb-4 last:pb-0">
                      <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                      <div className="flex flex-wrap justify-between items-start gap-1">
                        <h4 className="text-xs font-bold text-slate-900">{exp.roleTitle}</h4>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Sekarang' : formatDate(exp.endDate)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-blue-700 mt-0.5">
                        {exp.companyName} {exp.industry ? `• ${exp.industry}` : ''}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada riwayat terdaftar</p>
                )}
              </div>
            </div>

            {/* Pendidikan Terakhir (NO PURPLE) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pendidikan Terakhir
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kualifikasi latar belakang akademik
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {candidate.educations && candidate.educations.length > 0 ? (
                  candidate.educations.map((edu: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{edu.institution}</p>
                        <p className="text-slate-500 font-medium">
                          {edu.degree} - {edu.major}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="inline-block font-semibold text-slate-700 bg-slate-200/80 px-2.5 py-0.5 rounded-md text-[11px]">
                          Lulus {edu.graduationYear || '-'}
                        </span>
                        {edu.gpa && (
                          <p className="text-emerald-700 font-bold text-[11px]">
                            IPK: {edu.gpa}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Pendidikan belum ditambahkan</p>
                )}
              </div>
            </div>

            {/* Evaluasi & Aksi Recruiter */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Evaluasi & Aksi Recruiter
                    </h3>
                    <p className="text-xs text-slate-500">
                      Perbarui tahapan rekrutmen dan berikan rating kandidat
                    </p>
                  </div>
                </div>

                {/* 5-star rating */}
                <div className="flex items-center gap-1 bg-amber-50/60 px-2.5 py-1 rounded-xl border border-amber-200/60">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5 hover:scale-115 transition-transform"
                      title={`Beri rating ${star}`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-700 ml-1.5">{rating}/5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ubah Tahapan Seleksi Kandidat:
                </label>
                {stageLocked && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-1.5">
                    Tahapan hanya dapat diubah oleh PIC kandidat atau TA Lead. Rating & catatan tetap bisa diisi.
                  </p>
                )}
                <select
                  value={status}
                  disabled={stageLocked}
                  onChange={(e) => setStatus(e.target.value)}
                  className="disabled:bg-slate-50 disabled:text-slate-500 w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="APPLIED">Baru Masuk (Applied)</option>
                  <option value="ATS_SCREENED">Lolos ATS Pre-screen</option>
                  <option value="SHORTLISTED">Shortlisted (Siap Interview)</option>
                  <option value="INTERVIEW_HR">Jadwal Interview HR</option>
                  <option value="INTERVIEW_USER">Jadwal Interview User</option>
                  <option value="OFFERING">Offering Letter Tahap Akhir</option>
                  <option value="HIRED">Diterima Bekerja (Hired)</option>
                  <option value="TALENT_POOL">Simpan di Talent Pool</option>
                  <option value="REJECTED">Tidak Lolos / Ditolak</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Catatan Internal Recruiter / HR:
                  </label>
                  <span className="text-[11px] text-slate-400">Klik tag cepat:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Gaji Sesuai Budget',
                    'Komunikasi Baik',
                    'Portofolio Kuat',
                    'Rekomendasi Interview User',
                    'Siap Notice 1 Bulan'
                  ].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAppendNote(tag)}
                      className="text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2 py-0.5 rounded-md transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan catatan hasil wawancara, kelebihan teknis, atau catatan salary..."
                  rows={3}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAction}
                disabled={saving}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan Tahapan & Catatan'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
