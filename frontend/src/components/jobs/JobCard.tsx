'use client';

import React from 'react';
import { Briefcase, MapPin, Wallet, ScanLine, Pencil, Users, ArrowUpRight, Clock } from 'lucide-react';
import { internalSalaryLabel } from '@/lib/jobSalary';

interface Props {
  job: any;
  onOpen: () => void;
  onEdit: () => void;
}

export default function JobCard({ job, onOpen, onEdit }: Props) {
  const keywords: string[] = job.mustHaveSkills || [];
  const applicants = job._count?.applications || 0;

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-[border-color,box-shadow] hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/50 focus-within:border-blue-400">
      <div className={`h-1 ${job.isActive ? 'bg-blue-500' : 'bg-slate-200'}`} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600"><Briefcase className="h-5 w-5" /></span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${job.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${job.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {job.isActive ? 'Live on portal' : 'Closed'}
          </span>
        </div>
        <p className="mb-1.5 truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400" title={job.department}>{job.department || 'Department not specified'}</p>
        <h3 className="text-base font-semibold leading-snug tracking-tight text-slate-900">
          <button type="button" onClick={onOpen} className="text-left transition-colors after:absolute after:inset-0 hover:text-blue-700 focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-blue-500">{job.title}</button>
        </h3>
        <p className="mt-1 text-xs text-slate-500">{job.division}</p>

        <div className="mt-5 space-y-2.5 text-xs text-slate-500">
          <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span>{job.location || 'Location not specified'}</span></p>
          <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span>{job.employmentType} / Min. {job.minExperience} years</span></p>
          <p className="flex items-start gap-2"><Wallet className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="font-medium text-slate-700">{internalSalaryLabel(job)}</span></p>
        </div>

        <div className="mt-5 flex-1 rounded-xl border border-blue-100/70 bg-blue-50/40 p-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2"><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700"><ScanLine className="h-3.5 w-3.5" /> Must-have ATS</p><span className="text-[10px] font-medium text-blue-500">{keywords.length} keywords</span></div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 4).map((k, i) => <span key={`${k}-${i}`} className="max-w-full break-words rounded-md border border-blue-100 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">{k}</span>)}
            {keywords.length > 4 && <span className="px-1 py-1 text-[10px] font-semibold text-blue-600">+{keywords.length - 4} more</span>}
            {!keywords.length && <span className="text-[11px] text-amber-700">Add keywords for ATS screening.</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:px-6">
        <span className="flex items-center gap-2 text-xs text-slate-500"><Users className="h-4 w-4 text-slate-400" /><b className="font-semibold text-slate-900 tabular-nums">{applicants}</b> applicants</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onEdit} aria-label={`Edit job ${job.title}`} className="relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500"><Pencil className="h-3 w-3" /> Edit</button>
          <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-600" />
        </div>
      </div>
    </article>
  );
}
