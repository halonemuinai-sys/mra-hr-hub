'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Building2,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  Clock,
  Send,
  User,
  Mail,
  Phone,
  Award,
  Zap,
  Check,
  RefreshCw,
  Tag,
  Download
} from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  /** Job being applied for; null keeps the modal closed */
  job: any | null;
  onClose: () => void;
}

/** Quick apply: ATS CV scan (keeps the original CV via resumeToken) or Excel template upload */
export default function QuickApplyModal({ job, onClose }: Props) {
  const selectedJob = job;
  const [applyMode, setApplyMode] = useState<'ATS' | 'TEMPLATE'>('ATS');
  const [cvFile, setCvFile] = useState<File | null>(null);
  // Token for the original CV kept by the parse step; sent with the application
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [parsingCv, setParsingCv] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);

  // Parsed Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    headline: '',
    totalExperienceYrs: 1,
    expectedSalary: '',
    availability: 'IMMEDIATE',
    profileSummary: '',
    skills: [] as string[]
  });

  // Handle CV file upload & ATS parsing with simulated high-tech scanning steps
  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvFile(file);
    setParsingCv(true);
    setScanStep('Membaca dokumen dan struktur teks...');

    try {
      setTimeout(() => setScanStep('Mengekstrak kontak dan identitas pelamar...'), 400);
      setTimeout(() => setScanStep('Menjalankan algoritma taksonomi keahlian ATS...'), 900);

      const fd = new FormData();
      fd.append('resume', file);
      const res = await api.parseResume(fd);

      if (res.success && res.data) {
        const d = res.data;
        const newAutoFilled = new Set<string>();
        if (d.fullName) newAutoFilled.add('fullName');
        if (d.email) newAutoFilled.add('email');
        if (d.phone) newAutoFilled.add('phone');
        if (d.headline) newAutoFilled.add('headline');
        if (d.totalExperienceYrs) newAutoFilled.add('totalExperienceYrs');
        if (d.profileSummary) newAutoFilled.add('profileSummary');
        if (d.skills && d.skills.length > 0) newAutoFilled.add('skills');

        setAutoFilledFields(newAutoFilled);
        setResumeToken(d.resumeToken || null);

        setFormData((prev) => ({
          ...prev,
          fullName: d.fullName || prev.fullName,
          email: d.email || prev.email,
          phone: d.phone || prev.phone,
          headline: d.headline || prev.headline,
          totalExperienceYrs: d.totalExperienceYrs || prev.totalExperienceYrs,
          profileSummary: d.profileSummary || prev.profileSummary,
          skills: (d.skills || []).map((s: any) => (typeof s === 'string' ? s : s.skillName))
        }));

        setScanStep('Ekstraksi selesai dengan sukses!');
      }
    } catch (err: any) {
      alert('Gagal mengekstrak CV: ' + err.message);
    } finally {
      setTimeout(() => {
        setParsingCv(false);
        setScanStep('');
      }, 600);
    }
  };

  // Submit ATS Application
  const handleAtsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      alert('Nama lengkap dan email wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        jobId: selectedJob?.id,
        intakeSource: 'ATS_RESUME_UPLOAD',
        resumeToken,
        skills: formData.skills.map((s) => ({ skillName: s, category: 'TECHNICAL', proficiency: 'INTERMEDIATE' }))
      };

      const res = await api.applyCandidate(payload);
      if (res.success) {
        setSubmitSuccess(res.data);
      }
    } catch (err: any) {
      alert('Gagal mengirim lamaran: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Template Application
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFile) {
      alert('Silakan pilih file Excel template yang telah diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('template', templateFile);
      if (selectedJob?.id) fd.append('jobId', selectedJob.id);

      const res = await api.applyWithTemplate(fd);
      if (res.success) {
        setSubmitSuccess({
          message: res.message,
          totalCount: res.savedCount
        });
      }
    } catch (err: any) {
      alert('Gagal mengunggah template: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    onClose();
    setCvFile(null);
    setResumeToken(null);
    setTemplateFile(null);
    setSubmitSuccess(null);
    setAutoFilledFields(new Set());
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      headline: '',
      totalExperienceYrs: 1,
      expectedSalary: '',
      availability: 'IMMEDIATE',
      profileSummary: '',
      skills: []
    });
  };

  return (
        <AnimatePresence>
          {job && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                onClick={resetModal}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 z-10 flex flex-col max-h-[92vh]"
              >
                {/* Modal Header */}
                <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white flex items-start justify-between border-b border-slate-800/80 shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-400" />
                        Portal Lamaran ATS
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {selectedJob.employmentType}
                      </span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-white">{selectedJob.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      {selectedJob.division} • {selectedJob.location}
                    </p>
                  </div>
                  <button
                    onClick={resetModal}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                {submitSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 text-center space-y-5 my-auto"
                  >
                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-75" />
                      <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-2xl font-black text-slate-900">Lamaran Berhasil Didaftarkan!</h4>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                        Profil Anda telah berhasil dipindai oleh sistem ATS dan dikelompokkan ke dalam database rekrutmen.
                      </p>
                    </div>

                    {submitSuccess.atsScore && (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200 text-xs font-bold text-blue-900 shadow-xs">
                        <Award className="w-4 h-4 text-blue-600" />
                        Skor Kecocokan ATS: <span className="text-sm font-black text-blue-700">{submitSuccess.atsScore}%</span>
                      </div>
                    )}

                    <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                      <button
                        onClick={resetModal}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Selesai & Lihat Lowongan Lain
                      </button>
                      <a
                        href="/status"
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
                      >
                        Lacak Status Lamaran
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {/* Animated Tab Switcher */}
                    <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setApplyMode('ATS')}
                        className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                          applyMode === 'ATS'
                            ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        Mode 1: Upload CV ATS (Auto-Fill)
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyMode('TEMPLATE')}
                        className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                          applyMode === 'TEMPLATE'
                            ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        Mode 2: Template Excel (.xlsx)
                      </button>
                    </div>

                    {/* Form Body: Mode ATS */}
                    {applyMode === 'ATS' ? (
                      <form onSubmit={handleAtsSubmit} className="p-4 sm:p-6 space-y-5">
                        {/* High-Tech CV Scanner Dropzone */}
                        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-b from-blue-50/60 to-blue-50/30 p-5 text-center transition-all hover:border-blue-500 hover:bg-blue-50/80 group">
                          {/* Laser Scan Beam Animation */}
                          {parsingCv && (
                            <motion.div
                              initial={{ top: '0%' }}
                              animate={{ top: ['0%', '100%', '0%'] }}
                              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#38bdf8] z-20 pointer-events-none"
                            />
                          )}

                          <input
                            type="file"
                            id="cv-upload"
                            accept=".pdf,.docx,.doc"
                            onChange={handleCvChange}
                            className="hidden"
                          />
                          <label htmlFor="cv-upload" className="cursor-pointer block relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-sm border border-blue-100 group-hover:scale-105 transition-transform">
                              {parsingCv ? (
                                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                              ) : (
                                <UploadCloud className="w-6 h-6 text-blue-600" />
                              )}
                            </div>

                            <span className="text-xs font-bold text-slate-800 block">
                              {cvFile ? cvFile.name : 'Pilih atau Seret Dokumen CV (PDF / DOCX)'}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Algoritma parser ATS akan otomatis membaca identitas, kontak, dan keahlian Anda
                            </p>

                            {parsingCv && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 py-1.5 px-3 bg-white/90 backdrop-blur-xs rounded-xl border border-blue-200 text-xs font-bold text-blue-700 inline-flex items-center gap-2 shadow-xs"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                                {scanStep}
                              </motion.div>
                            )}

                            {autoFilledFields.size > 0 && !parsingCv && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-200"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {autoFilledFields.size} Kolom Berhasil Terisi Otomatis dari CV
                              </motion.div>
                            )}
                          </label>
                        </div>

                        {/* Professional Elevated Form Inputs */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                            <span>Informasi Kandidat</span>
                            <span className="text-[11px] text-slate-400 font-normal">Tinjau atau lengkapi data Anda</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            {/* Nama Lengkap */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  Nama Lengkap *
                                </span>
                                {autoFilledFields.has('fullName') && (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    ATS Auto-filled
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Nama lengkap Anda..."
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                  autoFilledFields.has('fullName') ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                                }`}
                              />
                            </div>

                            {/* Email */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  Alamat Email *
                                </span>
                                {autoFilledFields.has('email') && (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    ATS Auto-filled
                                  </span>
                                )}
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="email@anda.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                  autoFilledFields.has('email') ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                                }`}
                              />
                            </div>

                            {/* No WhatsApp */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  No WhatsApp / Telepon *
                                </span>
                                {autoFilledFields.has('phone') && (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    ATS Auto-filled
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="08xxxxxxxxxx"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                  autoFilledFields.has('phone') ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                                }`}
                              />
                            </div>

                            {/* Total Pengalaman */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                  Total Pengalaman (Tahun)
                                </span>
                                {autoFilledFields.has('totalExperienceYrs') && (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Estimasi ATS
                                  </span>
                                )}
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                value={formData.totalExperienceYrs}
                                onChange={(e) => setFormData({ ...formData, totalExperienceYrs: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>

                            {/* Ekspektasi Gaji */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                <span className="shrink-0 text-[10px] font-bold leading-none text-emerald-600">IDR</span>
                                Ekspektasi Gaji (IDR)
                              </label>
                              <input
                                type="number"
                                placeholder="Contoh: 15000000"
                                value={formData.expectedSalary}
                                onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                              />
                            </div>

                            {/* Status Ketersediaan */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                Status Ketersediaan
                              </label>
                              <select
                                value={formData.availability}
                                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                              >
                                <option value="IMMEDIATE">Siap Bekerja Segera (Immediate)</option>
                                <option value="ONE_MONTH_NOTICE">Notice 1 Bulan</option>
                                <option value="OPEN_OFFERS">Terbuka untuk Peluang</option>
                              </select>
                            </div>

                            {/* Ringkasan Profil Singkat */}
                            <div className="sm:col-span-2">
                              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  Ringkasan Profil Singkat
                                </span>
                                {autoFilledFields.has('profileSummary') && (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Terekstrak Otomatis
                                  </span>
                                )}
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Ceritakan ringkasan pengalaman dan keunggulan profesional Anda..."
                                value={formData.profileSummary}
                                onChange={(e) => setFormData({ ...formData, profileSummary: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                              />
                            </div>
                          </div>

                          {/* Extracted Skills Tags with Micro-animation */}
                          {formData.skills.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                                  Keahlian Terekstrak ATS ({formData.skills.length})
                                </span>
                                <span className="text-[10px] font-semibold text-blue-700">
                                  Cocok dengan Kriteria Lowongan
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {formData.skills.map((s, idx) => (
                                  <motion.span
                                    key={idx}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="px-2.5 py-1 text-xs font-semibold bg-white text-blue-700 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {s}
                                  </motion.span>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Modal Footer Buttons */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={resetModal}
                            className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            Batal
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-700 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                          >
                            {submitting ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Mengirim Lamaran...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Kirim Lamaran Sekarang
                              </>
                            )}
                          </motion.button>
                        </div>
                      </form>
                    ) : (
                      /* Mode Template Upload */
                      <form onSubmit={handleTemplateSubmit} className="p-4 sm:p-6 space-y-5">
                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <div className="text-xs">
                            <p className="font-bold text-emerald-950">Template Excel Simpel (1 Sheet Saja)</p>
                            <p className="text-emerald-800 mt-0.5 leading-relaxed">
                              Cukup isi 1 baris per kandidat pada sheet <strong>Data Pelamar</strong>. Lengkap dengan kontak, pendidikan, dan keahlian tanpa perlu pindah-pindah sheet.
                            </p>
                            <a
                              href="http://localhost:5006/api/templates/download"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Unduh Template Excel 1-Sheet (.xlsx)
                            </a>
                          </div>
                        </div>

                        <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 rounded-2xl p-8 text-center hover:bg-emerald-50/80 transition-colors">
                          <input
                            type="file"
                            id="template-upload"
                            accept=".xlsx"
                            onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <label htmlFor="template-upload" className="cursor-pointer block">
                            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs border border-emerald-100">
                              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold text-emerald-950 block">
                              {templateFile ? templateFile.name : 'Pilih File Template Excel yang Telah Diisi (.xlsx)'}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Sistem akan otomatis mengekstrak data profil, riwayat kerja, dan menghitung skor ATS
                            </p>
                          </label>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={resetModal}
                            className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            Batal
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={submitting || !templateFile}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                            {submitting ? 'Memvalidasi & Mengimpor...' : 'Unggah & Kirim Template'}
                          </motion.button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
  );
}
