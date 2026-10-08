'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Ban, Check, CheckCircle2, Copy, Download, ExternalLink, FileSignature, Loader2, Mail, MessageCircle, Pencil, Send, X, XCircle } from 'lucide-react';
import { api, fetchOfferPdf } from '@/lib/api';
import OfferPreview from './OfferPreview';
import { daysUntil, fmtDay, idr, OFFER_STATUS_META, shareMessage, shortName } from './offerFormat';

interface Props {
  offerId: string;
  onClose: () => void;
  onEdit: (letter: any) => void;
  /** After a status change, so the list refreshes */
  onChanged: (message: string) => void;
}

const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

/** 08xx / +62 → 62xx for wa.me links */
const waNumber = (p?: string | null) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.startsWith('0') ? '62' + d.slice(1) : d;
};

export default function OfferDrawer({ offerId, onClose, onEdit, onChanged }: Props) {
  const [letter, setLetter] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [ask, setAsk] = useState<null | 'DECLINED' | 'ACCEPTED' | 'CANCEL'>(null);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getOffer(offerId);
      setLetter(res.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [offerId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<any>) => {
    setBusy(key);
    setError('');
    try {
      const res = await fn();
      setAsk(null);
      setNote('');
      await load();
      onChanged(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const openPdf = async () => {
    setBusy('pdf');
    setError('');
    try {
      const blob = await fetchOfferPdf(offerId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      setError('Could not open the PDF: ' + err.message);
    } finally {
      setBusy('');
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage(letter));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Clipboard is not available in this browser.');
    }
  };

  const st = letter ? OFFER_STATUS_META[letter.displayStatus] || OFFER_STATUS_META.DRAFT : null;
  const left = letter ? daysUntil(letter.validUntil) : null;
  const a = letter?.actions || {};
  const btn = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-60';
  const msg = letter ? shareMessage(letter) : '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative w-full max-w-3xl h-full bg-slate-50 shadow-2xl flex flex-col"
      >
        <div className="bg-slate-900 text-white px-6 pt-5 pb-4 relative">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600" />
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
              <FileSignature className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 font-mono">{letter?.letterNo || 'Offer letter'}</p>
              <h3 className="text-base font-black truncate">{letter?.candidateName || 'Loading…'}</h3>
              {letter && (
                <p className="text-[11px] text-slate-300 truncate">
                  {letter.positionTitle} · {letter.company?.name || 'No PT'} · {letter.language === 'en' ? 'English' : 'Bahasa Indonesia'}
                </p>
              )}
            </div>
            {st && <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${st.cls}`}>{st.label}</span>}
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {letter && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                ['Base salary', idr(letter.baseSalary)],
                ['Start date', fmtDay(letter.startDate)],
                [
                  'Valid until',
                  `${fmtDay(letter.validUntil)}${letter.status === 'SENT' && left !== null ? (left < 0 ? ` · expired` : left === 0 ? ' · today' : ` · ${left}d left`) : ''}`
                ]
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{k}</p>
                  <p className="text-xs font-bold tabular-nums truncate">{v}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{error}</p>}
          {!letter ? (
            <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ) : (
            <>
              {/* Actions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={openPdf} disabled={busy === 'pdf'} className={`${btn} bg-slate-900 text-white hover:bg-slate-800`}>
                    {busy === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                  </button>
                  {a.edit && (
                    <button type="button" onClick={() => onEdit(letter)} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {a.send && (
                    <button type="button" onClick={() => run('send', () => api.sendOffer(letter.id))} disabled={!!busy} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
                      {busy === 'send' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Mark as sent
                    </button>
                  )}
                  {a.respond && (
                    <>
                      <button type="button" onClick={() => setAsk('ACCEPTED')} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                      </button>
                      <button type="button" onClick={() => setAsk('DECLINED')} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
                        <XCircle className="w-3.5 h-3.5" /> Declined
                      </button>
                    </>
                  )}
                  {a.cancel && (
                    <button type="button" onClick={() => setAsk('CANCEL')} className={`${btn} text-slate-500 hover:bg-slate-100 ml-auto`}>
                      <Ban className="w-3.5 h-3.5" /> Cancel letter
                    </button>
                  )}
                </div>

                {ask && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <p className="text-xs font-bold text-slate-800">
                      {ask === 'ACCEPTED' ? 'Record that the candidate accepted' : ask === 'DECLINED' ? 'Record that the candidate declined' : `Cancel ${letter.letterNo}`}
                    </p>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={ask === 'DECLINED' ? 'Reason (required) — e.g. accepted another offer, salary expectation' : ask === 'ACCEPTED' ? 'Optional — e.g. signed copy received by email' : 'Optional reason — e.g. terms changed, a new letter follows'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                    {ask === 'ACCEPTED' && <p className="text-[11px] text-slate-500">Next: move the candidate to Hired in the pipeline (signed offer + join date).</p>}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setAsk(null)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-200">
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!!busy || (ask === 'DECLINED' && !note.trim())}
                        onClick={() =>
                          run(ask, () => (ask === 'CANCEL' ? api.cancelOffer(letter.id, note) : api.respondOffer(letter.id, ask, note)))
                        }
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50 inline-flex items-center gap-1 ${
                          ask === 'ACCEPTED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {busy === ask && <Loader2 className="w-3 h-3 animate-spin" />}
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                {['DRAFT', 'SENT'].includes(letter.status) && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Send to the candidate</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={copyMessage} className={`${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy message'}
                      </button>
                      {letter.candidateEmail && (
                        <a
                          href={`mailto:${letter.candidateEmail}?subject=${encodeURIComponent((letter.language === 'en' ? 'Offer of Employment — ' : 'Surat Penawaran Kerja — ') + letter.positionTitle)}&body=${encodeURIComponent(msg)}`}
                          className={`${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                      )}
                      {letter.candidatePhone && (
                        <a
                          href={`https://wa.me/${waNumber(letter.candidatePhone)}?text=${encodeURIComponent(msg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">Attach the downloaded PDF, then mark the letter as sent so the validity is tracked.</p>
                  </div>
                )}
              </div>

              {/* History */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">History</p>
                <ol className="space-y-1.5 text-xs">
                  <li className="text-slate-700">
                    <b>Draft created</b> by {shortName(letter.createdBy?.name) || '—'} <span className="text-slate-400">· {fmtTime(letter.createdAt)}</span>
                  </li>
                  {letter.sentAt && (
                    <li className="text-slate-700">
                      <b className="text-blue-700">Sent</b> to the candidate <span className="text-slate-400">· {fmtTime(letter.sentAt)}</span>
                    </li>
                  )}
                  {letter.respondedAt && (
                    <li className="text-slate-700">
                      <b className={letter.status === 'ACCEPTED' ? 'text-emerald-700' : 'text-slate-900'}>{letter.status === 'ACCEPTED' ? 'Accepted' : 'Declined'}</b>
                      <span className="text-slate-400"> · {fmtTime(letter.respondedAt)}</span>
                    </li>
                  )}
                  {letter.status === 'CANCELLED' && (
                    <li className="text-slate-700">
                      <b>Cancelled</b> <span className="text-slate-400">· {fmtTime(letter.updatedAt)}</span>
                    </li>
                  )}
                  {letter.responseNote && <li className="text-slate-600 italic">“{letter.responseNote}”</li>}
                </ol>
                <Link
                  href={`/admin/pipeline?jobId=${letter.application?.job?.id || ''}`}
                  className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-3 h-3" /> Open in pipeline
                </Link>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Letter</p>
                <OfferPreview doc={letter.document} />
              </div>
            </>
          )}
        </div>
      </motion.aside>
    </div>
  );
}
