'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, FileSearch, Hand, MessagesSquare, Route, ShieldCheck, Star, Users, Wallet, X, CalendarCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { getInitials, stageLabel } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import ResumeButton from '@/components/candidates/ResumeButton';
import { fmtDate, statusMeta } from '../employeeFormat';
import JourneyStageBar, { fmtDays } from './JourneyStageBar';
import JourneyTimeline from './JourneyTimeline';

const INTAKE_LABELS: Record<string, string> = {
  ATS_RESUME_UPLOAD: 'CV upload on the career portal',
  EXCEL_TEMPLATE: 'Excel template',
  MANUAL_INPUT: 'Entered manually by the TA team'
};

const scoreTone = (n: number) => (n >= 85 ? 'text-emerald-600' : n >= 60 ? 'text-blue-600' : 'text-amber-600');

function Kpi({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <Icon className="w-3 h-3 text-blue-600" /> {label}
      </p>
      <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">{value}</p>
      {hint && <p className="text-[10px] text-slate-400 truncate">{hint}</p>}
    </div>
  );
}

const daysText = (d: number | null | undefined) => (d === null || d === undefined ? '—' : fmtDays(d));

/** Read-only: the full road from CV received to hired and onboarding, for one employee */
export default function EmployeeJourneyDrawer({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getEmployeeJourney(employeeId)
      .then((res: any) => setData(res.data))
      .catch((err: any) => setError(err.message));
  }, [employeeId]);

  const emp = data?.employee;
  const j = data?.journey;
  const app = data?.application;
  const cand = data?.candidate;
  const m = j?.metrics;
  const st = statusMeta(emp?.employmentStatus);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        tabIndex={-1}
        className="relative w-full max-w-3xl h-full bg-slate-50 shadow-2xl flex flex-col outline-none"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 pt-5 pb-4 relative">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600" />
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white text-base font-black flex items-center justify-center shrink-0">
              {getInitials(emp?.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 flex items-center gap-1.5">
                <Route className="w-3 h-3" /> Recruitment Journey
              </p>
              <h3 className="text-base font-black truncate">{emp?.fullName || 'Loading…'}</h3>
              {emp && (
                <p className="text-[11px] text-slate-300 truncate">
                  {emp.position} · {emp.company?.name || emp.division} · <span className="font-mono">{emp.employeeNo}</span>
                </p>
              )}
            </div>
            {emp && <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold ${st.cls}`}>{st.label}</span>}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{error}</p>}

          {!data && !error && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {data && !j && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-12 text-center text-xs text-slate-500">
              The original application of this employee no longer exists (the candidate or job was deleted), so the recruitment
              journey cannot be shown.
            </div>
          )}

          {j && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Kpi
                  icon={Clock}
                  label="Applied → Hired"
                  value={daysText(m.timeToHireDays)}
                  hint={`${fmtDate(j.milestones.applied)} → ${fmtDate(j.milestones.hired)}`}
                />
                <Kpi
                  icon={Hand}
                  label="Claimed by PIC"
                  value={daysText(m.timeToClaimDays)}
                  hint={app?.assignedRecruiter ? shortName(app.assignedRecruiter.name) : 'after applying'}
                />
                <Kpi
                  icon={MessagesSquare}
                  label="To 1st interview"
                  value={daysText(m.timeToInterviewDays)}
                  hint={`${m.interviewCount} interview session(s)`}
                />
                <Kpi
                  icon={CalendarCheck}
                  label="Hired → Join"
                  value={m.hireToJoinDays === null ? '—' : `${m.hireToJoinDays} days`}
                  hint={j.milestones.joinDate ? fmtDate(j.milestones.joinDate) : undefined}
                />
              </div>

              {/* Stage bar */}
              <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Stage flow</h4>
                  <p className="text-[10px] text-slate-500">
                    {m.stageCount} stages · {m.peopleInvolved} people involved
                    {m.backMoves ? ` · ${m.backMoves}× moved back` : ''}
                    {m.slowestStage
                      ? ` · slowest: ${m.slowestStage.status === 'APPLIED' ? 'waiting for screening' : stageLabel(m.slowestStage.status)}`
                      : ''}
                  </p>
                </div>
                <JourneyStageBar stages={j.stages} slowest={m.slowestStage} />
              </section>

              {/* Application profile */}
              <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileSearch className="w-3.5 h-3.5 text-blue-600" /> At application
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {INTAKE_LABELS[cand?.intakeSource] || cand?.intakeSource} · {fmtDate(app.appliedAt)} · {emp.job?.title}
                    </p>
                  </div>
                  {cand && <ResumeButton candidateId={cand.id} available={cand.hasResume} candidateName={cand.fullName} />}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  {[
                    ['ATS', app.atsScore],
                    ['Skill', app.skillsScore],
                    ['Experience', app.expScore],
                    ['Education', app.eduScore]
                  ].map(([label, v]: any) => (
                    <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 py-2">
                      <p className={`text-base font-black tabular-nums ${scoreTone(Math.round(v || 0))}`}>{Math.round(v || 0)}%</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                    </div>
                  ))}
                  <div className="rounded-xl bg-slate-50 border border-slate-100 py-2">
                    <p className="text-base font-black text-amber-600 flex items-center justify-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {app.scorecardRating || '—'}
                    </p>
                    <p className="text-[10px] text-slate-500">Rating</p>
                  </div>
                </div>
                {(app.matchedKeywords?.length > 0 || app.missingKeywords?.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {app.matchedKeywords.map((k: string) => (
                      <span
                        key={k}
                        className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold"
                      >
                        ✓ {k}
                      </span>
                    ))}
                    {app.missingKeywords.map((k: string) => (
                      <span
                        key={k}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold line-through decoration-slate-400"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
                {cand && (
                  <p className="text-[11px] text-slate-500">
                    {[cand.headline, cand.currentCompany, `${cand.totalExperienceYrs || 0} yrs experience`, cand.location]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </section>

              {/* Approvals */}
              {j.approvals.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Approval
                  </h4>
                  {j.approvals.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-start justify-between gap-3 text-[11px] border-t border-slate-100 pt-2 first:border-0 first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="text-slate-800">{r.reason}</p>
                        <p className="text-[10px] text-slate-400">
                          Requested by {shortName(r.requestedBy) || '—'} · {fmtDate(r.createdAt)}
                          {r.decidedBy ? ` · decided by ${shortName(r.decidedBy)} ${fmtDate(r.decidedAt)}` : ''}
                        </p>
                        {r.decisionNote && <p className="text-slate-600 italic">“{r.decisionNote}”</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.status === 'PENDING'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {r.status === 'APPROVED'
                            ? 'Approved'
                            : r.status === 'PENDING'
                              ? 'Pending'
                              : r.status === 'REJECTED'
                                ? 'Rejected'
                                : 'Cancelled'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">{daysText(r.waitDays)}</p>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Timeline */}
              <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Journey details</h4>
                  {m.offerSalary && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Offering IDR {m.offerSalary.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
                <JourneyTimeline
                  stages={j.stages}
                  afterHire={j.afterHire}
                  appliedVia={INTAKE_LABELS[cand?.intakeSource] || 'applied'}
                  joinDate={j.milestones.joinDate}
                />
              </section>

              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Built from the pipeline activity log; activity before the log was enabled is not included.
              </p>
            </>
          )}
        </div>
      </motion.aside>
    </div>
  );
}
