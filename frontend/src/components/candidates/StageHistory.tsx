'use client';

import React, { useEffect, useState } from 'react';
import { History, CalendarClock } from 'lucide-react';
import { api } from '@/lib/api';
import { stageLabel } from '@/components/pipeline/stages';
import { FIELD_LABELS, formatValue, describeActivity } from './activityFormat';

/** Upcoming interview from the most recent move into an interview stage */
function nextInterview(rows: any[], currentStatus?: string) {
  const move = rows.find((a) => a.action === 'STAGE_CHANGE' && a.toStatus === currentStatus && a.stageData?.interviewAt);
  if (!move) return null;
  const at = new Date(move.stageData.interviewAt);
  return at.getTime() > Date.now() - 2 * 3600000 ? { at, data: move.stageData } : null;
}

export default function StageHistory({ applicationId, currentStatus }: { applicationId?: string; currentStatus?: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    api.getApplicationActivity(applicationId)
      .then((res: any) => res.success && setRows(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (!applicationId) return null;
  const upcoming = nextInterview(rows, currentStatus);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <History className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Riwayat Tahapan & Data Seleksi</h3>
          <p className="text-[11px] text-slate-500">Jadwal, penawaran, feedback, dan alasan dari setiap perpindahan tahap</p>
        </div>
      </div>

      {upcoming && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-600 text-white">
          <CalendarClock className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Interview {stageLabel(currentStatus || '')}: {formatValue('interviewAt', upcoming.at.toISOString())}</p>
            <p className="text-blue-100 mt-0.5">
              {[upcoming.data.interviewer || upcoming.data.hiringManager, upcoming.data.interviewMode].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Belum ada riwayat tahapan untuk lamaran ini.</p>
      ) : (
        <ol className="relative border-l-2 border-slate-100 ml-3 space-y-4">
          {rows.map((a) => {
            const d = describeActivity(a);
            const fields = Object.entries(a.stageData || {}).filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && !v.length));
            return (
              <li key={a.id} className="pl-5 relative">
                <span className={`absolute -left-[13px] top-0 w-6 h-6 rounded-lg border flex items-center justify-center ${d.tone}`}>
                  <d.Icon className="w-3 h-3" />
                </span>
                <p className="text-xs text-slate-800">{d.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {d.who} · {new Date(a.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                {a.note && <p className="mt-1 text-[11px] text-slate-600 italic">“{a.note}”</p>}
                {fields.length > 0 && (
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    {fields.map(([k, v]) => (
                      <div key={k} className={k === 'hmFeedback' || k === 'skills' ? 'col-span-2' : ''}>
                        <dt className="text-[10px] text-slate-400">{FIELD_LABELS[k] || k}</dt>
                        <dd className="text-[11px] font-semibold text-slate-800 break-words">{formatValue(k, v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
