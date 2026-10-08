'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, FilePen, FileSignature, Hourglass, Plus, Search, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { getInitials } from '@/components/pipeline/stages';
import CompanySelect from '@/components/companies/CompanySelect';
import { useCompanies } from '@/components/companies/useCompanies';
import OfferEditorModal from '@/components/offers/OfferEditorModal';
import OfferDrawer from '@/components/offers/OfferDrawer';
import { daysUntil, fmtDay, idr, OFFER_STATUS_META, OFFER_TABS, shortName } from '@/components/offers/offerFormat';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

const daysSince = (d?: string | null) => (d ? Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000)) : null);

export default function OffersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [ready, setReady] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editor, setEditor] = useState<null | { applicationId: string; letter?: any }>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const readyRef = useRef<HTMLDivElement>(null);
  const { companies } = useCompanies();

  // Deep links from reminders: ?status=SENT|EXPIRED, ?view=ready
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get('status');
    if (s && OFFER_STATUS_META[s]) setStatus(s);
    if (q.get('view') === 'ready') setTimeout(() => readyRef.current?.scrollIntoView({ behavior: 'smooth' }), 600);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (companyId) params.companyId = companyId;
      if (debounced) params.search = debounced;
      const res = await api.getOffers(params);
      setRows(res.data || []);
      setReady(res.ready || []);
      setSummary(res.summary || null);
    } catch (err: any) {
      setToast({ id: Date.now(), tone: 'error', message: 'Failed to load offer letters: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, [status, companyId, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (message: string) => setToast({ id: Date.now(), tone: 'success', message });

  const tiles = [
    { label: 'Ready for a letter', value: summary?.ready, icon: Plus, cls: summary?.ready ? 'text-blue-600' : 'text-slate-900', onClick: () => readyRef.current?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Drafts', value: summary?.draft, icon: FilePen, cls: 'text-slate-900', onClick: () => setStatus('DRAFT') },
    { label: 'Awaiting answer', value: summary?.sent, icon: Send, cls: 'text-blue-600', onClick: () => setStatus('SENT') },
    { label: 'Expired', value: summary?.expired, icon: Hourglass, cls: summary?.expired ? 'text-amber-600' : 'text-slate-900', onClick: () => setStatus('EXPIRED') },
    { label: 'Accepted', value: summary?.accepted, icon: CheckCircle2, cls: 'text-emerald-600', onClick: () => setStatus('ACCEPTED') }
  ];
  const counts: Record<string, number | undefined> = summary
    ? { DRAFT: summary.draft, SENT: summary.sent, EXPIRED: summary.expired, ACCEPTED: summary.accepted, DECLINED: summary.declined, CANCELLED: summary.cancelled }
    : {};

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-blue-600" />
          Offer Letters
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate the offer letter (Surat Penawaran Kerja) from the Offering terms, send it as PDF, and track the candidate&apos;s answer before the offer expires.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <button key={t.label} type="button" onClick={t.onClick} className="text-left bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3 hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <t.icon className={`w-4 h-4 ${t.cls}`} />
            </div>
            <div>
              <p className={`text-xl font-black tabular-nums ${t.cls}`}>{loading && !summary ? '…' : t.value ?? 0}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Candidates in Offering without a letter */}
      <div ref={readyRef} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs scroll-mt-4">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Ready for an offer letter</h2>
            <p className="text-[11px] text-slate-500">Candidates in Offering without an open letter. The PIC or a TA Lead writes it.</p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 tabular-nums">{ready.length}</span>
        </div>
        {!ready.length ? (
          <p className="px-4 py-6 text-xs text-slate-400 text-center">{loading ? 'Loading…' : 'Everyone in Offering has a letter.'}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {ready.map((a) => {
              const waited = daysSince(a.stageChangedAt);
              return (
                <div key={a.id} className="border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{getInitials(a.candidate.fullName)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{a.candidate.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {a.job.company && <span className="mr-1 px-1 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] font-bold">{a.job.company.code}</span>}
                      {a.job.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {waited !== null ? `${waited} day${waited === 1 ? '' : 's'} in Offering` : 'In Offering'} · PIC {shortName(a.assignedRecruiter?.name) || '—'}
                    </p>
                  </div>
                  {a.canCreate && (
                    <button
                      type="button"
                      onClick={() => setEditor({ applicationId: a.id })}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3" /> Letter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="p-3 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search letter no., candidate, position…"
                className="pl-8 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            {companies.length > 0 && <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} allLabel="All companies" className="w-full sm:w-60" />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {OFFER_TABS.map((t) => (
              <button
                key={t.key || 'all'}
                type="button"
                onClick={() => setStatus(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${status === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t.label}
                {t.key && counts[t.key] ? <span className="ml-1 opacity-70 tabular-nums">{counts[t.key]}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {loading && !rows.length ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : !rows.length ? (
          <div className="py-14 text-center">
            <FileSignature className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800 mt-2">No offer letters here</p>
            <p className="text-xs text-slate-500 mt-1">Create one from a candidate in Offering above.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5 font-bold">Letter</th>
                  <th className="px-4 py-2.5 font-bold">Candidate</th>
                  <th className="px-4 py-2.5 font-bold text-right">Base salary</th>
                  <th className="px-4 py-2.5 font-bold">Start</th>
                  <th className="px-4 py-2.5 font-bold">Valid until</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((l) => {
                  const st = OFFER_STATUS_META[l.displayStatus] || OFFER_STATUS_META.DRAFT;
                  const left = daysUntil(l.validUntil);
                  return (
                    <tr key={l.id} onClick={() => setOpenId(l.id)} className="cursor-pointer hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-slate-900">{l.letterNo}</p>
                        <p className="text-[10px] text-slate-400">
                          {l.language === 'en' ? 'EN' : 'ID'} · by {shortName(l.createdBy?.name) || '—'} · {fmtDay(l.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 truncate max-w-[240px]">{l.candidateName}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                          {l.company && <span className="mr-1 px-1 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] font-bold">{l.company.code}</span>}
                          {l.positionTitle}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">{idr(l.baseSalary)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{fmtDay(l.startDate)}</td>
                      <td className="px-4 py-3">
                        <p className="tabular-nums text-slate-700">{fmtDay(l.validUntil)}</p>
                        {l.displayStatus === 'SENT' && left !== null && (
                          <p className={`text-[10px] font-bold ${left <= 2 ? 'text-amber-700' : 'text-slate-400'}`}>{left === 0 ? 'Last day' : `${left} day${left === 1 ? '' : 's'} left`}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {openId && (
          <OfferDrawer
            key={openId}
            offerId={openId}
            onClose={() => setOpenId(null)}
            onEdit={(letter) => setEditor({ applicationId: letter.applicationId, letter })}
            onChanged={(m) => {
              notify(m);
              load();
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editor && (
          <OfferEditorModal
            key={editor.letter?.id || editor.applicationId}
            applicationId={editor.applicationId}
            letter={editor.letter}
            onClose={() => setEditor(null)}
            onSaved={(letter, message) => {
              setEditor(null);
              notify(message);
              load();
              // Reopen the drawer so the new / edited letter can be downloaded and sent right away
              setOpenId(null);
              setTimeout(() => setOpenId(letter.id), 0);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}</AnimatePresence>
    </div>
  );
}
