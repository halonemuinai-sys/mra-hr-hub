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
  KanbanSquare,
  RefreshCw,
  UploadCloud,
  PenLine
} from 'lucide-react';
import { api } from '@/lib/api';

const FUNNEL_STAGES = [
  { label: 'Baru Masuk', keys: ['APPLIED'], color: 'bg-amber-500' },
  { label: 'Lolos Pre-screen ATS', keys: ['ATS_SCREENED'], color: 'bg-blue-400' },
  { label: 'Shortlisted HR', keys: ['SHORTLISTED'], color: 'bg-blue-500' },
  { label: 'Interview (HR / User)', keys: ['INTERVIEW_HR', 'INTERVIEW_USER'], color: 'bg-blue-700' },
  { label: 'Offering Letter', keys: ['OFFERING'], color: 'bg-emerald-500' },
  { label: 'Diterima (Hired)', keys: ['HIRED'], color: 'bg-emerald-600' }
];

const JOB_FAMILIES = [
  { key: 'IT_DIGITAL', label: 'IT & Digital Software' },
  { key: 'RETAIL_OPS', label: 'Retail & Store Operations' },
  { key: 'CORPORATE_SERVICES', label: 'Corporate (Legal/GA/Finance)' },
  { key: 'CREATIVE_MEDIA', label: 'Creative & Broadcasting' }
];

const SOURCES = [
  { key: 'ATS_RESUME_UPLOAD', label: 'Upload CV ATS (PDF/Word)', icon: UploadCloud },
  { key: 'EXCEL_TEMPLATE', label: 'Template Ingestion (.xlsx)', icon: FileSpreadsheet },
  { key: 'MANUAL_INPUT', label: 'Input Manual', icon: PenLine }
];

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

  const val = (v: any) => (loading ? '…' : v ?? 0);

  const funnel = FUNNEL_STAGES.map((s) => ({
    ...s,
    count: s.keys.reduce((n, k) => n + (stages[k] || 0), 0)
  }));
  const funnelMax = Math.max(1, ...funnel.map((s) => s.count));
  const archived = (stages.TALENT_POOL || 0) + (stages.REJECTED || 0);

  const familyTotal = Math.max(1, JOB_FAMILIES.reduce((n, f) => n + (families[f.key] || 0), 0));
  const sourceTotal = Math.max(1, SOURCES.reduce((n, s) => n + (sources[s.key] || 0), 0));

  const kpiCards = [
    {
      label: 'Total Database',
      value: val(kpis?.totalCandidates),
      hint: `${kpis?.totalApplications || 0} lamaran tercatat`,
      icon: Users,
      tone: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
      label: 'Rata-Rata Skor ATS',
      value: loading ? '…' : `${kpis?.averageAtsScore || 0}%`,
      hint: 'Seluruh lamaran',
      icon: Award,
      tone: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
    {
      label: 'Shortlist Ratio',
      value: loading ? '…' : `${kpis?.shortlistRatio || 0}%`,
      hint: 'Siap wawancara HR/User',
      icon: TrendingUp,
      tone: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
      label: 'Diterima (Hired)',
      value: val(kpis?.hiredCount),
      hint: `${kpis?.activeJobs || 0} posisi terbuka`,
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Rekrutmen</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan pelacakan kandidat, skor ATS, dan talent pool MRA Group
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadKpis}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/pipeline"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-600/20 flex items-center gap-1.5 transition-colors"
          >
            <KanbanSquare className="w-3.5 h-3.5" />
            Buka Pipeline
          </Link>
          <Link
            href="/admin/candidates"
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Database Kandidat
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{card.value}</h3>
                <span className="text-[11px] font-medium text-slate-500 mt-1 inline-block">{card.hint}</span>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${card.tone}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Funnel Tahapan Seleksi
            </h3>
            <Link
              href="/admin/pipeline"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Kelola di Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {funnel.map((st) => (
              <div key={st.label} className="grid grid-cols-[150px_1fr_40px] sm:grid-cols-[180px_1fr_48px] items-center gap-3 text-xs">
                <span className="font-semibold text-slate-700 truncate">{st.label}</span>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${st.color} transition-all duration-500`}
                    style={{ width: `${(st.count / funnelMax) * 100}%` }}
                  />
                </div>
                <span className="text-right font-bold text-slate-900 tabular-nums">{loading ? '…' : st.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Arsip (Talent Pool + Tidak Lolos)</span>
            <span className="font-bold text-slate-700 tabular-nums">{loading ? '…' : archived}</span>
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Kelompok Bidang (Job Family)
            </h3>
            <div className="space-y-3 text-xs">
              {JOB_FAMILIES.map((f) => {
                const n = families[f.key] || 0;
                return (
                  <div key={f.key}>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-slate-700">{f.label}</span>
                      <span className="font-bold text-slate-900 tabular-nums">{loading ? '…' : n}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(n / familyTotal) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Saluran Masuk (Intake Source)
            </h3>
            <div className="space-y-2.5 text-xs">
              {SOURCES.map((s) => {
                const Icon = s.icon;
                const n = sources[s.key] || 0;
                return (
                  <div key={s.key} className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      {s.label}
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {loading ? '…' : n}
                      <span className="text-slate-400 font-medium ml-1">({Math.round((n / sourceTotal) * 100)}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
