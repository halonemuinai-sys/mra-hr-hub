'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/permissions';
import { ACTIVE_STAGES, getInitials } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';
import ActivityFeed from './ActivityFeed';
import { formatHours, formatRelative } from './teamFormat';

export default function MemberDetailDrawer({ member, days, onClose }: { member: any; days: number; onClose: () => void }) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getTeamActivity({ recruiterId: member.id, limit: 40 })
      .then((res: any) => res.success && setActivity(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [member.id]);

  const p = member.period;
  const maxStage = Math.max(1, ...ACTIVE_STAGES.map((s) => member.byStage[s.key] || 0));

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
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
              {getInitials(shortName(member.name))}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">{shortName(member.name)}</h2>
              <p className="text-[11px] text-slate-400 truncate">
                {ROLE_LABELS[member.role] || member.role} • {member.email}
              </p>
              <p className="text-[11px] text-blue-300 mt-0.5">Aktif terakhir: {formatRelative(member.lastActiveAt)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Period outcomes */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{days} hari terakhir</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Diambil', value: p.claims },
                { label: 'Pindah tahap', value: p.moves },
                { label: 'Maju tahap', value: p.advanced },
                { label: 'Offering', value: p.offerings },
                { label: 'Diterima', value: p.hired },
                { label: 'Ditolak', value: p.rejected }
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 p-2.5">
                  <p className="text-lg font-black text-slate-900 tabular-nums">{s.value}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="text-[10px] font-semibold text-slate-500">Kecepatan ambil</p>
                <p className="font-bold text-slate-900">{formatHours(p.avgClaimHours)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="text-[10px] font-semibold text-slate-500">Hire rate (dari yang ditutup)</p>
                <p className="font-bold text-slate-900">{p.hireRate === null ? '—' : `${p.hireRate}%`}</p>
              </div>
            </div>
          </section>

          {/* Current holdings by stage */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Kandidat aktif saat ini ({member.activeCount})
              </h3>
              {member.staleCount > 0 && (
                <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {member.staleCount} tertahan ≥7 hari
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {ACTIVE_STAGES.map((s) => {
                const n = member.byStage[s.key] || 0;
                return (
                  <div key={s.key} className="grid grid-cols-[110px_1fr_28px] items-center gap-2 text-xs">
                    <span className="text-slate-600 truncate">{s.label}</span>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.dot}`} style={{ width: `${(n / maxStage) * 100}%` }} />
                    </div>
                    <span className="text-right font-bold text-slate-900 tabular-nums">{n}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Rata-rata {member.avgDaysInStage ?? '—'} hari di tahap saat ini • rata-rata skor ATS{' '}
              {member.avgAtsScore ?? '—'}%
            </p>
          </section>

          {/* Activity */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Riwayat aktivitas</h3>
            <ActivityFeed items={activity} loading={loading} compact />
          </section>
        </div>

        <div className="p-4 border-t border-slate-100">
          <Link
            href="/admin/pipeline"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            Buka Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.aside>
    </div>
  );
}
