'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, CloudUpload, Code2, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { api } from '@/lib/api';
import { fmtDate } from '../employeeFormat';
import TalentaField, { isRequired, TalentaFieldDef } from './TalentaField';

interface Props {
  employeeId: string;
  onClose: () => void;
  /** Called after a save / send so the list can refresh its badge */
  onChanged: (message: string, tone: 'success' | 'error') => void;
}

/** HR form for the Talenta "Add Employee" payload + send */
export default function TalentaSyncDrawer({ employeeId, onClose, onChanged }: Props) {
  const [view, setView] = useState<any | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<'load' | 'save' | 'send' | 'masters' | null>('load');
  const [error, setError] = useState('');
  const [showPayload, setShowPayload] = useState(false);

  const apply = (data: any) => {
    setView(data);
    setValues(data.values || {});
    setDirty(false);
  };

  const load = useCallback(async () => {
    setBusy('load');
    try {
      const res = await api.getEmployeeTalenta(employeeId);
      apply(res.data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  const fields: TalentaFieldDef[] = useMemo(() => view?.fields || [], [view]);
  const missing = useMemo(
    () => fields.filter((f) => f.type !== 'checkbox' && isRequired(f, values) && String(values[f.key] ?? '').trim() === ''),
    [fields, values]
  );

  const set = (key: string, v: any) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setDirty(true);
  };

  const save = async () => {
    setBusy('save');
    setError('');
    try {
      const res = await api.saveEmployeeTalenta(employeeId, values);
      apply(res.data);
      onChanged(res.message, 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    setBusy('send');
    setError('');
    try {
      const res = await api.syncEmployeeTalenta(employeeId, values);
      apply(res.data);
      onChanged(res.message, 'success');
    } catch (err: any) {
      setError(err.message);
      onChanged(err.message, 'error');
      // Reload to show the stored failure (Talenta's error list) and keep the saved input
      try {
        const res = await api.getEmployeeTalenta(employeeId);
        apply(res.data);
      } catch {}
    } finally {
      setBusy(null);
    }
  };

  const refreshMasters = async () => {
    setBusy('masters');
    try {
      await api.getTalentaMasters(true);
      const res = await api.getEmployeeTalenta(employeeId);
      setView(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const cfg = view?.config;
  const sync = view?.sync;
  const sent = !!sync?.sentHere;
  const serverErrors: string[] = view?.check?.errors || [];
  const locked = sent || busy === 'send';

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
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">Kirim ke Talenta</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {view ? `${view.employee.fullName} · ${view.employee.employeeNo} · ${view.employee.email}` : 'Memuat…'}
            </p>
          </div>
          {cfg && (
            <span
              className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                cfg.mode === 'production'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : cfg.mode === 'sandbox'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {cfg.label}
            </span>
          )}
          <button type="button" onClick={onClose} aria-label="Tutup" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cfg?.mode === 'mock' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
              <b>Mode simulasi.</b> Data tidak dikirim ke Talenta sungguhan; respons &amp; error meniru dokumentasi Talenta API. Setelah
              kredensial didapat, isi <code className="font-mono">TALENTA_HMAC_USERNAME</code>, <code className="font-mono">TALENTA_HMAC_SECRET</code> dan{' '}
              <code className="font-mono">TALENTA_MODE=sandbox</code> di <code className="font-mono">backend/.env</code>.
            </div>
          )}
          {cfg && !cfg.ready && cfg.mode !== 'mock' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
              {cfg.mode === 'off' ? 'Integrasi Talenta nonaktif (TALENTA_MODE=off).' : `Kredensial belum diisi: ${cfg.missing.join(', ')}.`}
            </div>
          )}

          {/* Sync state */}
          {sync?.status === 'SENT' && (
            <div className={`rounded-xl border px-4 py-3 flex items-start gap-2.5 ${sent ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${sent ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="text-[11px] text-slate-700">
                <p className="font-bold text-slate-900">
                  {sent ? `Sudah terkirim ke ${cfg?.label}` : `Pernah terkirim ke mode ${sync.mode} — belum ke ${cfg?.label}`}
                </p>
                <p className="mt-0.5">
                  user_id <b className="font-mono">{sync.userId || '-'}</b> · Employee ID <b className="font-mono">{sync.employeeId || '-'}</b> · {fmtDate(sync.syncedAt)}
                </p>
                {sent && <p className="mt-1 text-slate-500">Perubahan data setelah ini dilakukan langsung di Talenta.</p>}
              </div>
            </div>
          )}
          {sync?.status === 'FAILED' && sync.error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-900">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Pengiriman terakhir ditolak Talenta ({fmtDate(sync.syncedAt)})
              </p>
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                {String(sync.error)
                  .split('\n')
                  .map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
              </ul>
            </div>
          )}

          {view?.masterError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800 flex items-center justify-between gap-3">
              <span>Master data Talenta tidak bisa dimuat: {view.masterError}. Isian branch/organisasi/posisi/level diketik manual.</span>
            </div>
          )}

          {busy === 'load' && !view ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            view?.sections?.map((s: any) => (
              <section key={s.key} className="bg-white rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900">{s.label}</h4>
                  {s.key === 'employment' && view.masters && (
                    <button
                      type="button"
                      onClick={refreshMasters}
                      disabled={busy === 'masters'}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${busy === 'masters' ? 'animate-spin' : ''}`} /> Muat ulang master data
                    </button>
                  )}
                </div>
                {s.key === 'employment' && (
                  <p className="text-[10px] text-slate-500 -mt-2 mb-3">Nama harus sama persis dengan master data di Talenta.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fields
                    .filter((f) => f.section === s.key)
                    .map((f) => (
                      <TalentaField
                        key={f.key}
                        field={f}
                        value={values[f.key]}
                        values={values}
                        masters={view.masters}
                        disabled={locked}
                        onChange={(v) => set(f.key, v)}
                      />
                    ))}
                </div>
              </section>
            ))
          )}

          {view && (
            <section className="bg-white rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowPayload((v) => !v)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-600" /> Payload yang dikirim ke Talenta {dirty && <span className="font-normal text-slate-400">(simpan untuk memperbarui)</span>}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showPayload ? 'rotate-180' : ''}`} />
              </button>
              {showPayload && (
                <pre className="mx-4 mb-4 p-3 rounded-xl bg-slate-900 text-slate-100 text-[10px] leading-relaxed overflow-x-auto">
                  {JSON.stringify(view.check.payload, null, 2)}
                </pre>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 space-y-2">
          {!sent && view && (
            <p className={`text-[11px] ${missing.length || (!dirty && serverErrors.length) ? 'text-amber-700' : 'text-emerald-700'}`}>
              {missing.length
                ? `${missing.length} data wajib belum diisi: ${missing.slice(0, 4).map((f) => f.label).join(', ')}${missing.length > 4 ? '…' : ''}`
                : !dirty && serverErrors.length
                ? serverErrors[0]
                : 'Data wajib lengkap — siap dikirim.'}
            </p>
          )}
          {error && (
            <p className="text-[11px] text-amber-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Tutup
            </button>
            {!sent && (
              <>
                <button
                  type="button"
                  onClick={save}
                  disabled={!view || !!busy || !dirty}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Simpan draft
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={!view || !!busy || !cfg?.ready || missing.length > 0}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {busy === 'send' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                  {cfg?.mode === 'mock' ? 'Kirim (simulasi)' : 'Kirim ke Talenta'}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
