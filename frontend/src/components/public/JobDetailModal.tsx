'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  Share2,
  Check,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { publicSalaryLabel, hasPublicSalary } from '@/lib/jobSalary';
import Link from 'next/link';

interface JobDetailModalProps {
  job: any | null;
  onClose: () => void;
  onApplyNow: (job: any) => void;
}

export default function JobDetailModal({
  job,
  onClose,
  onApplyNow
}: JobDetailModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!job) return null;

  const handleShare = () => {
    const url = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Convert requirements / description into formatted bullet points if string
  const formatList = (text: string) => {
    if (!text) return [];
    if (text.includes('•') || text.includes('-')) {
      return text
        .split(/[•\-]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    if (text.includes(',')) {
      return text
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return [text];
  };

  const requirementList = formatList(job.requirements || '');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* 1. Executive Modal Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-7 relative border-b border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30">
                    {job.department || 'Operasional'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {job.employmentType || 'Full-time'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    ATS Automated Match
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                  {job.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 font-medium">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{job.division || 'MRA Group Unit'}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">{job.location || 'Indonesia'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Salin tautan lowongan"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Tutup dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 bg-slate-50/60">
            {/* Quick Metrics Grid (4 Key Highlights) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lokasi</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {job.location || 'Jakarta'}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pengalaman</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Min. {job.minExperience || 1} Tahun
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pendidikan</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {job.minEducation || 'S1 / D3'}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                  <span className="shrink-0 text-[10px] font-bold leading-none text-emerald-600">IDR</span>
                  <span>Kisaran Gaji</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {publicSalaryLabel(job)}
                </div>
              </div>
            </div>

            {/* Salary Banner if available */}
            {hasPublicSalary(job) && (
              <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <span className="shrink-0 text-[10px] font-bold leading-none">IDR</span>
                  </div>
                  <div>
                    <p className="font-bold">Remunerasi & Penawaran Gaji Pokok</p>
                    <p className="text-emerald-700 text-[11px]">
                      {publicSalaryLabel(job)}{' '}
                      (berdasarkan evaluasi kualifikasi & pengalaman)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                  Transparan
                </span>
              </div>
            )}

            {/* Ringkasan & Deskripsi Pekerjaan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Deskripsi & Ruang Lingkup Pekerjaan
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {job.description ||
                  'Bertanggung jawab dalam mengelola operasional strategis, memastikan standar kualitas korporat MRA Group, serta berkolaborasi lintas tim untuk mencapai target bisnis divisi.'}
              </p>
            </div>

            {/* Kualifikasi & Persyaratan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kualifikasi & Persyaratan Pelamar
              </h3>
              <div className="space-y-2">
                {requirementList.map((req: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Keahlian & Keterampilan (Must-Have & Nice-to-Have Skills) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Keahlian & Kata Kunci ATS yang Dibutuhkan
              </h3>

              {/* Must-Have Skills */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Keahlian Utama (Must-Have):</p>
                <div className="flex flex-wrap gap-2">
                  {(job.mustHaveSkills || []).map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Nice-to-Have Skills */}
              {job.niceToHaveSkills && job.niceToHaveSkills.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Nilai Tambah (Nice-to-Have):</p>
                  <div className="flex flex-wrap gap-2">
                    {job.niceToHaveSkills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Benefit & Fasilitas Karyawan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-500" />
                Benefit & Fasilitas Karyawan MRA Group
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>BPJS Kesehatan & Ketenagakerjaan Komprehensif</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>Diskon Khusus Karyawan Brand Retail & F&B MRA</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>Program Pelatihan & Pengembangan Karir Terpadu</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>Lingkungan Kerja Dinamis, Inklusif, & Profesional</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sticky Bottom Action Footer */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href={`/jobs/${job.id}`}
              target="_blank"
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors order-2 sm:order-1"
            >
              <span>Buka di Halaman Penuh</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApplyNow(job);
                }}
                className="flex-1 sm:flex-initial px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lamar Posisi Ini</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
