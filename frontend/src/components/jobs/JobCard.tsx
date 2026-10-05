'use client';

import React from 'react';
import { MapPin, Wallet, Sparkles, Pencil, Users, ChevronRight } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface Props {
  job: any;
  onOpen: () => void;
  onEdit: () => void;
}

export default function JobCard({ job, onOpen, onEdit }: Props) {
  const keywords: string[] = job.mustHaveSkills || [];
  const applicants = job._count?.applications || 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className={`group text-left bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
        job.isActive ? 'border-slate-200/80' : 'border-slate-200 bg-slate-50/60'
      }`}
    >
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-100 truncate">{job.department}</span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${job.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
            {job.isActive ? 'Aktif' : 'Ditutup'}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-700">{job.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{job.division}</p>

        <div className="mt-3 text-xs text-slate-600 space-y-1">
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.location} · {job.employmentType} · min. {job.minExperience} th</span>
          </p>
          {(job.salaryMin || job.salaryMax) && (
            <p className="font-semibold text-emerald-700 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              {formatRupiah(job.salaryMin)} – {formatRupiah(job.salaryMax)}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1.5">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Must-have keywords ({keywords.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 5).map((k, i) => (
              <span key={`${k}-${i}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100">{k}</span>
            ))}
            {keywords.length > 5 && <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-500">+{keywords.length - 5}</span>}
            {!keywords.length && <span className="text-[10px] text-amber-700">Belum ada keyword</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-500">
          <Users className="w-3.5 h-3.5" />
          <b className="text-slate-900 tabular-nums">{applicants}</b> pelamar
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 font-semibold flex items-center gap-1"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <span className="p-1.5 text-slate-300 group-hover:text-blue-600">
            <ChevronRight className="w-4 h-4" />
          </span>
        </span>
      </div>
    </div>
  );
}
