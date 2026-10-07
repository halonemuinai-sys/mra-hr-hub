'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  MapPin,
  Building2,
  ArrowRight,
  Clock,
  RotateCcw,
  Eye,
  GraduationCap
} from 'lucide-react';
import { publicSalaryLabel } from '@/lib/jobSalary';
import { CATEGORY_TABS, getJobPillarBadge } from './careersData';

interface Props {
  loading: boolean;
  /** Jobs after search / location / pillar filters */
  jobs: any[];
  pillarCounts: Record<string, number>;
  selectedPillar: string;
  onPillarChange: (id: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onView: (job: any) => void;
  onApply: (job: any) => void;
}

/** Pillar tabs + job card grid with "Lihat Detail" / "Lamar Cepat" actions */
export default function JobListings({ loading, jobs, pillarCounts, selectedPillar, onPillarChange, hasActiveFilters, onResetFilters, onView, onApply }: Props) {
  return (
      <section id="lowongan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-16">
        {/* Category Pill Tabs matching reference design */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none mb-8">
          {CATEGORY_TABS.map((tab) => {
            const isAct = selectedPillar === tab.id;
            const Icon = tab.icon;
            const count = pillarCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                onClick={() => onPillarChange(tab.id)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 shrink-0 border cursor-pointer ${
                  isAct
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isAct ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.name}</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ml-1 ${
                    isAct ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section Title & Active Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Lowongan Terbuka
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Menampilkan {jobs.length} posisi strategis aktif dengan kriteria penilaian ATS otomatis
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Semua Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-64" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Tidak ada lowongan yang cocok</h3>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => onView(job)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />

                {(() => {
                  const pillarBadge = getJobPillarBadge(job);
                  return (
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${pillarBadge.color}`}
                          >
                            {pillarBadge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {job.department}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                          {job.employmentType}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        {job.division}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Min. {job.minExperience} Thn
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium text-[11px]">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {job.minEducation || 'S1'}
                        </span>
                      </div>

                      {(
                        <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                          <span className="shrink-0 text-[10px] font-bold leading-none text-emerald-600">IDR</span>
                          <span>
                            {publicSalaryLabel(job)}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skills badges */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(job.mustHaveSkills || []).slice(0, 3).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors"
                          >
                            {s}
                          </span>
                        ))}
                        {(job.mustHaveSkills || []).length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                            +{(job.mustHaveSkills || []).length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(job);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-blue-700 border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lihat Detail</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply(job);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Lamar Cepat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
  );
}
