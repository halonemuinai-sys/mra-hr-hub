'use client';

import React from 'react';
import { Trophy, Zap, LifeBuoy } from 'lucide-react';
import { shortName } from '@/components/pipeline/ownership';
import { formatHours } from './teamFormat';

/** Three quick callouts derived from the member list */
export default function TeamHighlights({ members, onSelect }: { members: any[]; onSelect: (m: any) => void }) {
  const active = members.filter((m) => m.isActive && (m.activeCount || m.period.moves));
  if (!active.length) return null;

  const pick = (fn: (m: any) => number | null, dir: 'max' | 'min') =>
    active
      .filter((m) => fn(m) != null)
      .sort((a, b) => (dir === 'max' ? (fn(b) as number) - (fn(a) as number) : (fn(a) as number) - (fn(b) as number)))[0];

  const topHire = pick((m) => m.period.hired * 100 + m.period.advanced, 'max');
  const fastest = pick((m) => m.period.avgClaimHours, 'min');
  const needsHelp = pick((m) => (m.staleCount ? m.criticalCount * 100 + m.staleCount : null), 'max');

  const cards = [
    topHire && {
      icon: Trophy,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Paling produktif',
      member: topHire,
      value: `${topHire.period.hired} hired · ${topHire.period.advanced} maju tahap`
    },
    fastest && {
      icon: Zap,
      tone: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Tercepat ambil pelamar',
      member: fastest,
      value: `rata-rata ${formatHours(fastest.period.avgClaimHours)}`
    },
    needsHelp && {
      icon: LifeBuoy,
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Butuh bantuan',
      member: needsHelp,
      value: `${needsHelp.staleCount} tertahan${needsHelp.criticalCount ? ` · ${needsHelp.criticalCount} ≥14 hari` : ''}`
    }
  ].filter(Boolean) as any[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {cards.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={() => onSelect(c.member)}
          className="text-left bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3 hover:border-blue-300 transition-colors"
        >
          <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${c.tone}`}>
            <c.icon className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{c.label}</span>
            <span className="block text-sm font-bold text-slate-900 truncate">{shortName(c.member.name)}</span>
            <span className="block text-[11px] text-slate-600">{c.value}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
