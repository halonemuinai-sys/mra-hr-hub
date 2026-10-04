'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpRight,
  Briefcase,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKpis = async () => {
    setLoading(true);
    try {
      const res = await api.getKpis();
      if (res.success && res.data) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, []);

  const stages = kpis?.stagesBreakdown || {};
  const families = kpis?.jobFamilyDistribution || {};
  const sources = kpis?.sourceDistribution || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cockpit Rekrutmen Eksekutif</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan otomasi pelacakan kandidat, skor ATS, dan pengelompokan talent pool MRA Group
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/candidates"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            Kelola Database Kandidat
          </Link>
          <Link
            href="/admin/templates"
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Bulk Ingestion Excel
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Database</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '...' : kpis?.totalCandidates || 0}
            </h3>
            <span className="text-[11px] font-semibold text-blue-600 mt-1 inline-block">
              {kpis?.totalApplications || 0} Lamaran Aktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-Rata Skor ATS</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {loading ? '...' : `${kpis?.averageAtsScore || 78}%`}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 mt-1 inline-block flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Akurasi Terkalibrasi
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortlist Ratio</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">
              {loading ? '...' : `${kpis?.shortlistRatio || 0}%`}
            </h3>
            <span className="text-[11px] font-semibold text-indigo-600 mt-1 inline-block">
              Siap Wawancara HR/User
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Diterima (Hired)</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '...' : kpis?.hiredCount || 0}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 inline-block">
              {kpis?.activeJobs || 0} Posisi Terbuka
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid Charts & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stages Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Distribusi Tahapan Seleksi Rekrutmen
            </h3>
            <Link href="/admin/candidates" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Lihat Detail <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Baru Masuk (Applied)', count: stages.APPLIED || 0, color: 'bg-amber-500' },
              { label: 'Lolos Pre-screen ATS', count: stages.ATS_SCREENED || 0, color: 'bg-sky-500' },
              { label: 'Shortlisted HR', count: stages.SHORTLISTED || 0, color: 'bg-blue-600' },
              { label: 'Tahap Interview (HR / User)', count: (stages.INTERVIEW_HR || 0) + (stages.INTERVIEW_USER || 0), color: 'bg-indigo-600' },
              { label: 'Offering Letter', count: stages.OFFERING || 0, color: 'bg-purple-600' },
              { label: 'Diterima Bekerja (Hired)', count: stages.HIRED || 0, color: 'bg-emerald-600' },
              { label: 'Talent Pool Arsip', count: stages.TALENT_POOL || 0, color: 'bg-slate-400' }
            ].map((st, i) => {
              const total = kpis?.totalApplications || 1;
              const pct = Math.round((st.count / total) * 100);
              return (
                <div key={i} className="text-xs">
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{st.label}</span>
                    <span className="text-slate-900 font-bold">{st.count} kandidat ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${st.color} transition-all duration-500`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Talent Grouping & Channels */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Kelompok Bidang (Job Family)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">IT & Digital Software</span>
                <span className="font-bold text-blue-700">{families.IT_DIGITAL || 0} Kandidat</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Retail & Store Operations</span>
                <span className="font-bold text-emerald-700">{families.RETAIL_OPS || 0} Kandidat</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Corporate (Legal/GA/Finance)</span>
                <span className="font-bold text-indigo-700">{families.CORPORATE_SERVICES || 0} Kandidat</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Creative & Broadcasting</span>
                <span className="font-bold text-purple-700">{families.CREATIVE_MEDIA || 0} Kandidat</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Saluran Masuk (Intake Source)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Upload CV ATS (PDF/Word)</span>
                <span className="font-bold text-slate-900">{sources.ATS_RESUME_UPLOAD || 0}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Template Ingestion (.xlsx)</span>
                <span className="font-bold text-slate-900">{sources.EXCEL_TEMPLATE || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
