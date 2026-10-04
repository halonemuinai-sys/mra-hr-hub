'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Send,
  User,
  Mail,
  Phone,
  Tag,
  FileText,
  RefreshCw,
  Award
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Apply form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [totalExperienceYrs, setTotalExperienceYrs] = useState(2);
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availability, setAvailability] = useState('IMMEDIATE');
  const [profileSummary, setProfileSummary] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const fetchJob = async () => {
      try {
        const res = await api.getJobById(jobId);
        if (res.success && res.data) {
          setJob(res.data);
        }
      } catch (err) {
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      alert('Nama dan Email wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName,
        email,
        phone,
        totalExperienceYrs,
        expectedSalary,
        availability,
        profileSummary,
        jobId,
        skills: skills.map((s) => ({ skillName: s, category: 'TECHNICAL', proficiency: 'INTERMEDIATE' }))
      };
      const res = await api.applyCandidate(payload);
      if (res.success) {
        setSuccessResult(res.data);
      }
    } catch (err: any) {
      alert('Gagal mengirim lamaran: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
        Memuat detail lowongan...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Lowongan Tidak Ditemukan</h2>
        <Link href="/" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20">
          Kembali ke Daftar Lowongan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Direktori Lowongan
        </Link>
      </div>

      {/* Job Header Card with Gradient Accent */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {job.department}
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {job.employmentType}
            </span>
          </div>
          {job.salaryMin && (
            <div className="text-sm font-black text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              <DollarSign className="w-4 h-4" />
              {formatRupiah(job.salaryMin)} - {formatRupiah(job.salaryMax)}
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{job.title}</h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-500" />
          {job.division} • <MapPin className="w-4 h-4 text-slate-400 ml-1" /> {job.location}
        </p>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Pengalaman Minimal</span>
            <span className="font-bold text-slate-800">{job.minExperience} Tahun</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Pendidikan Minimal</span>
            <span className="font-bold text-slate-800">{job.minEducation}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Application Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Requirements */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Deskripsi Pekerjaan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>

            <h2 className="text-base font-bold text-slate-900 pt-5 border-t border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Kualifikasi & Persyaratan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {job.requirements}
            </p>

            {/* Must-have skills */}
            <div className="pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                Keahlian Kunci yang Dicari (ATS Criteria):
              </h3>
              <div className="flex flex-wrap gap-2">
                {(job.mustHaveSkills || []).map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 shadow-2xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Apply Form */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4 sticky top-24">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Lamar Posisi Ini</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Isi profil Anda untuk evaluasi ATS instan</p>
            </div>

            {successResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-emerald-950">Lamaran Berhasil Terkirim!</h3>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Skor ATS Anda: <strong>{successResult.atsScore}%</strong>
                  </p>
                </div>
                <Link
                  href="/status"
                  className="block text-xs font-bold text-white bg-blue-600 py-2.5 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all"
                >
                  Lacak Status Lamaran
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@anda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    No WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Pengalaman (Thn)
                    </label>
                    <input
                      type="number"
                      value={totalExperienceYrs}
                      onChange={(e) => setTotalExperienceYrs(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      Gaji Ekspektasi
                    </label>
                    <input
                      type="number"
                      placeholder="Rp"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    Keahlian Utama (Dipisah Koma)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: React, TypeScript, POS"
                    value={skills.join(', ')}
                    onChange={(e) => setSkills(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Ringkasan Profil Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={profileSummary}
                    onChange={(e) => setProfileSummary(e.target.value)}
                    placeholder="Ceritakan keunggulan Anda..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Kirim Lamaran Pekerjaan
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
