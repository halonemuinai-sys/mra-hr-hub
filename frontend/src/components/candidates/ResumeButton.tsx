'use client';

import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { fetchResumeBlob } from '@/lib/api';

/** Opens the candidate's original CV in a new tab (fetched with the CMS token) */
export default function ResumeButton({ candidateId, available, candidateName }: { candidateId: string; available: boolean; candidateName?: string }) {
  const [busy, setBusy] = useState(false);

  if (!available) {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-slate-400" title="Kandidat ini masuk tanpa file CV (template/manual) atau sebelum fitur ini aktif">
        <FileText className="w-4 h-4" /> CV asli tidak tersedia
      </span>
    );
  }

  const open = async () => {
    // Open the tab synchronously (popup blockers), then point it at the blob
    const tab = window.open('', '_blank');
    setBusy(true);
    try {
      const blob = await fetchResumeBlob(candidateId);
      const url = URL.createObjectURL(blob);
      if (tab) {
        tab.document.title = `CV ${candidateName || ''}`;
        tab.location.href = url;
      } else {
        window.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      tab?.close();
      alert('Gagal membuka CV: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[11px] font-bold"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
      Lihat CV asli
    </button>
  );
}
