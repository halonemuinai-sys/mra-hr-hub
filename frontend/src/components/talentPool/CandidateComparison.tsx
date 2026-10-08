'use client';

import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { Check, GitCompareArrows, X } from 'lucide-react';
import { getInitials } from '@/components/pipeline/stages';
import { barTone, scoreTone } from './talentPoolFormat';

interface Props {
  matches: any[];
  jobTitle: string;
  onClose: () => void;
}

export default function CandidateComparison({ matches, jobTitle, onClose }: Props) {
  return (
    <Dialog open onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-8">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-600"><GitCompareArrows className="h-4 w-4" /> Candidate comparison</div>
                <DialogTitle className="text-xl font-bold text-slate-900">Find your strongest fit</DialogTitle>
                <Description className="mt-1 text-sm text-slate-500">Compare {matches.length} candidates for {jobTitle}. Scores reflect the requirements of this role.</Description>
              </div>
              <button type="button" onClick={onClose} aria-label="Close comparison" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-[620px] table-fixed text-left text-sm">
                <caption className="sr-only">Candidate profiles and ATS score breakdown</caption>
                <thead><tr><th className="w-32 pb-5 text-xs font-medium text-slate-400">For this opening</th>{matches.map((m) => (
                  <th key={m.candidateId} className="px-3 pb-5 align-top">
                    <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">{getInitials(m.candidate.fullName)}</span>
                    <p className="break-words font-bold text-slate-900">{m.candidate.fullName}</p>
                    <p className="mt-1 text-xs font-normal text-slate-500">{m.candidate.headline || m.candidate.currentCompany || 'No headline'}</p>
                  </th>
                ))}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {([['Overall ATS', 'atsScore'], ['Skills', 'skillsScore'], ['Experience', 'expScore'], ['Education', 'eduScore']] as const).map(([label, field]) => (
                    <tr key={field}><th scope="row" className="py-4 text-xs font-medium text-slate-500">{label}</th>{matches.map((m) => (
                      <td key={m.candidateId} className="px-3 py-4"><span className={`text-xl font-bold tabular-nums ${scoreTone(m[field])}`}>{m[field]}<span className="text-xs font-normal text-slate-400"> / 100</span></span><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${barTone(m[field])}`} style={{ width: `${Math.max(0, Math.min(100, m[field]))}%` }} /></div></td>
                    ))}</tr>
                  ))}
                  {[
                    ['Experience', (m: any) => `${m.candidate.totalExperienceYrs || 0} years`],
                    ['Location', (m: any) => m.candidate.location || 'Not provided'],
                    ['Availability', (m: any) => m.candidate.availability || 'Not provided']
                  ].map(([label, value]) => <tr key={label as string}><th scope="row" className="py-4 text-xs font-medium text-slate-500">{label as string}</th>{matches.map((m) => <td key={m.candidateId} className="px-3 py-4 text-xs text-slate-700">{(value as (m: any) => string)(m)}</td>)}</tr>)}
                  <tr><th scope="row" className="py-4 text-xs font-medium text-slate-500">Matched skills</th>{matches.map((m) => <td key={m.candidateId} className="px-3 py-4 align-top"><div className="flex flex-wrap gap-1">{m.matchedKeywords.length ? m.matchedKeywords.map((skill: string) => <span key={skill} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700"><Check className="h-3 w-3" />{skill}</span>) : <span className="text-xs text-slate-400">None</span>}</div></td>)}</tr>
                  <tr><th scope="row" className="py-4 text-xs font-medium text-slate-500">Missing requirements</th>{matches.map((m) => <td key={m.candidateId} className="px-3 py-4 align-top"><div className="flex flex-wrap gap-1">{m.missingKeywords.length ? m.missingKeywords.map((skill: string) => <span key={skill} className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700">{skill}</span>) : <span className="text-xs font-medium text-emerald-600">No missing keywords</span>}</div></td>)}</tr>
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500">Use the score alongside skills and application history when reviewing candidates.</div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
