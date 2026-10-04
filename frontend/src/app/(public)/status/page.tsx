'use client';

import React, { useState } from 'react';
import { Search, ShieldCheck, CheckCircle2, Clock, Building2, Briefcase, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, getScoreBadge, getStatusBadge } from '@/lib/utils';

export default function ApplicationStatusPage() {
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.getCandidates({ search: emailInput.trim(), limit: 1 });
      if (res.success && res.data && res.data.length > 0) {
        setCandidate(res.data[0]);
      } else {
        setCandidate(null);
      }
    } catch (err) {
      console.error('Error tracking status:', err);
      setCandidate(null);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepIndex: number, currentStatus: string) => {
    const stagesOrder = ['APPLIED', 'ATS_SCREENED', 'SHORTLISTED', 'INTERVIEW_HR', 'OFFERING', 'HIRED'];
    const currentIdx = stagesOrder.indexOf(currentStatus);
    if (currentIdx === -1) return 'pending';
    if (currentIdx > stepIndex) return 'completed';
    if (currentIdx === stepIndex) return 'active';
    return 'pending';
  };

  const currentStatus = candidate?.status || candidate?.latestApplication?.status || 'APPLIED';
  const scoreBadge = candidate ? getScoreBadge(candidate.atsScore || 75) : null;
  const statusBadge = candidate ? getStatusBadge(currentStatus) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center max-w-xl mx-auto space-y-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Lacak Status Lamaran Mandiri
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Masukkan alamat email yang Anda gunakan saat melamar untuk melihat perkembangan evaluasi profil ATS dan jadwal seleksi Anda.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto pt-2">
          <input
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Masukkan alamat email Anda..."
            className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-500/25 flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Mencari...' : 'Lacak'}
          </button>
        </form>
      </div>

      {/* Result View */}
      {searched && (
        <div>
          {candidate ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {scoreBadge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${scoreBadge.class}`}>
                        ATS {candidate.atsScore}% • {scoreBadge.label}
                      </span>
                    )}
                    {statusBadge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{candidate.fullName}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    {candidate.headline || 'Kandidat'}
                  </p>
                </div>
                <div className="text-xs text-slate-500 sm:text-right">
                  <p>Terdaftar: {formatDate(candidate.createdAt)}</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{candidate.email}</p>
                </div>
              </div>

              {/* Progress Stepper */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Alur Tahapan Rekrutmen
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { title: '1. Lamaran Masuk', desc: 'CV diterima & dipindai oleh ATS Engine' },
                    { title: '2. Shortlisted HR', desc: 'Profil lolos kriteria awal tim rekrutmen' },
                    { title: '3. Tahap Wawancara', desc: 'Interview HR & User Komite' },
                    { title: '4. Keputusan Akhir', desc: 'Offering letter & onboarding' }
                  ].map((step, idx) => {
                    const st = getStepStatus(idx, currentStatus);
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border text-xs relative ${
                          st === 'completed'
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : st === 'active'
                            ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold mb-1">
                          {st === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                st === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {idx + 1}
                            </div>
                          )}
                          <span>{step.title}</span>
                        </div>
                        <p className="text-[11px] mt-1 leading-relaxed opacity-80">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Tidak ditemukan data lamaran dengan email <strong>"{emailInput}"</strong>. Silakan periksa kembali email Anda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
