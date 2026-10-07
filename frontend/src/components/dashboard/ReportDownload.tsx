'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, ChevronDown } from 'lucide-react';
import { downloadReport } from '@/lib/api';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function presets() {
  const now = new Date();
  const firstThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastLast = new Date(now.getFullYear(), now.getMonth(), 0);
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
  const monthName = (d: Date) => d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  return [
    { label: `Bulan ini (${monthName(now)})`, from: iso(firstThis), to: iso(now) },
    { label: `Bulan lalu (${monthName(firstLast)})`, from: iso(firstLast), to: iso(lastLast) },
    { label: '30 hari terakhir', from: iso(daysAgo(30)), to: iso(now) },
    { label: '90 hari terakhir', from: iso(daysAgo(90)), to: iso(now) }
  ];
}

/** Recruitment report (.xlsx) for a chosen period — Super Admin / TA Lead */
export default function ReportDownload({ onError }: { onError?: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const download = async (p: { label: string; from: string; to: string }) => {
    setBusy(p.label);
    try {
      const blob = await downloadReport(p.from, p.to);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-rekrutmen_${p.from}_${p.to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err: any) {
      (onError || alert)('Gagal mengunduh laporan: ' + err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
        aria-expanded={open}
      >
        <Download className="w-3.5 h-3.5 text-emerald-600" />
        Unduh Laporan
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1.5">
          <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Laporan rekrutmen (.xlsx)</p>
          {presets().map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={!!busy}
              onClick={() => download(p)}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-2 disabled:opacity-60"
            >
              {p.label}
              {busy === p.label && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
            </button>
          ))}
          <p className="px-2.5 pt-1 pb-1.5 text-[10px] text-slate-400">Ringkasan, per lowongan, per recruiter, daftar diterima & pelamar.</p>
        </div>
      )}
    </div>
  );
}
