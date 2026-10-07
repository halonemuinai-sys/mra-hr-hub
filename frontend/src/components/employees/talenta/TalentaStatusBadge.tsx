'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, CircleDashed, Loader2 } from 'lucide-react';

/** Talenta sync state of an employee. `currentMode` = mode the backend is configured for now */
export default function TalentaStatusBadge({ emp, currentMode }: { emp: any; currentMode?: string | null }) {
  const status = emp.talentaStatus;
  const otherMode = status === 'SENT' && currentMode && emp.talentaMode !== currentMode;
  const simulated = emp.talentaMode === 'mock';

  if (status === 'SENT' && !otherMode) {
    return (
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold"
        title={`user_id ${emp.talentaUserId || '-'} · ${emp.talentaEmployeeId || ''}`}
      >
        <CheckCircle2 className="w-3 h-3" /> {simulated ? 'Terkirim (simulasi)' : 'Di Talenta'}
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold"
        title={emp.talentaError || ''}
      >
        <AlertTriangle className="w-3 h-3" /> Gagal kirim
      </span>
    );
  }
  if (status === 'SENDING') {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
        <Loader2 className="w-3 h-3 animate-spin" /> Mengirim…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold" title={otherMode ? 'Hanya pernah terkirim ke mode simulasi' : undefined}>
      <CircleDashed className="w-3 h-3" /> Belum dikirim
    </span>
  );
}
