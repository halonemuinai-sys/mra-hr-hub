'use client';

import React from 'react';
import { UserRound, Inbox, Users, AlertTriangle } from 'lucide-react';
import { OwnerScope, shortName } from './ownership';
import { getInitials } from './stages';

interface Props {
  scope: OwnerScope;
  onScopeChange: (s: OwnerScope) => void;
  ownerCounts: { me: number; unassigned: number; all: number };
  /** Hide "My Candidates" for roles that can't hold candidates (e.g. Hiring Manager) */
  showMine: boolean;
  /** TA Lead only: team workload; clicking a member filters the board to their PIC */
  recruiters: any[] | null;
  focusRecruiterId: string;
  onFocusRecruiter: (id: string) => void;
}

const TABS: { key: OwnerScope; label: string; icon: React.ElementType }[] = [
  { key: 'me', label: 'My Candidates', icon: UserRound },
  { key: 'unassigned', label: 'Unassigned', icon: Inbox },
  { key: 'all', label: 'Whole Team', icon: Users }
];

export default function OwnerScopeBar({
  scope,
  onScopeChange,
  ownerCounts,
  showMine,
  recruiters,
  focusRecruiterId,
  onFocusRecruiter
}: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="inline-flex bg-white border border-slate-200/80 rounded-xl p-1 shadow-xs self-start">
        {TABS.filter((t) => showMine || t.key !== 'me').map((t) => {
          const Icon = t.icon;
          const active = scope === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onScopeChange(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span
                className={`tabular-nums px-1.5 rounded-md text-[10px] ${
                  active
                    ? 'bg-white/15'
                    : t.key === 'unassigned' && ownerCounts.unassigned > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100'
                }`}
              >
                {ownerCounts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {recruiters && scope === 'all' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Team workload</span>
          {recruiters.map((r) => {
            const active = focusRecruiterId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onFocusRecruiter(active ? '' : r.id)}
                title={`${r.name}: ${r.activeCount} active, ${r.staleCount} stalled`}
                className={`shrink-0 flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border text-[11px] transition-colors ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    active ? 'bg-white/20' : 'bg-slate-900 text-white'
                  }`}
                >
                  {getInitials(shortName(r.name))}
                </span>
                <span className="font-semibold">{shortName(r.name).split(' ')[0]}</span>
                <span className="font-black tabular-nums">{r.activeCount}</span>
                {r.staleCount > 0 && (
                  <span
                    className={`flex items-center gap-0.5 font-bold ${active ? 'text-amber-200' : 'text-amber-600'}`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {r.staleCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
