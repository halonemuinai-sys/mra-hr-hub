'use client';

import React from 'react';
import { Briefcase, MapPin, Star, Clock, Loader2, ChevronsRight, Check, AlertTriangle, Lock, Hand, UserRound, ShieldCheck } from 'lucide-react';
import { getScoreBadge } from '@/lib/utils';
import {
  ALL_STAGES,
  stageLabel,
  daysSince,
  getInitials,
  nextStage,
  isStale,
  stageSince,
  STALE_CRITICAL_DAYS
} from './stages';
import { shortName } from './ownership';

interface Props {
  app: any;
  selected: boolean;
  selectionMode: boolean;
  dragging: boolean;
  busy: boolean;
  /** Current user may change this card's stage */
  movable: boolean;
  /** Current user may claim this (unassigned) card */
  claimable: boolean;
  currentUserId?: string;
  onClaim: () => void;
  onToggleSelect: (shiftKey: boolean) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onMove: (status: string) => void;
}

export default function PipelineCard({
  app,
  selected,
  selectionMode,
  dragging,
  busy,
  movable,
  claimable,
  currentUserId,
  onClaim,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onOpen,
  onMove
}: Props) {
  const score = Math.round(app.atsScore || 0);
  const badge = getScoreBadge(score);
  const days = daysSince(stageSince(app));
  const stale = isStale(app);
  const critical = stale && days >= STALE_CRITICAL_DAYS;
  const next = nextStage(app.status);
  const c = app.candidate || {};
  const owner = app.assignedRecruiter;
  const mine = !!owner && owner.id === currentUserId;

  return (
    <div
      draggable={!busy && movable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => (selectionMode ? onToggleSelect(e.shiftKey) : onOpen())}
      className={`group relative bg-white rounded-xl border p-3 shadow-xs cursor-pointer transition-all ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/25'
          : critical
          ? 'border-amber-400 hover:border-amber-500'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
      } ${dragging ? 'opacity-40' : ''}`}
    >
      {busy && (
        <div className="absolute inset-0 rounded-xl bg-white/70 flex items-center justify-center z-10">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {/* Avatar doubles as selection checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(e.shiftKey);
          }}
          aria-label={selected ? 'Deselect' : 'Select candidate'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
            selected
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-white group-hover:bg-slate-700'
          }`}
        >
          {selected ? (
            <Check className="w-4 h-4" />
          ) : (
            <>
              <span className="group-hover:hidden">{getInitials(c.fullName)}</span>
              <span className="hidden group-hover:block w-3.5 h-3.5 rounded border-2 border-white/80" />
            </>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 truncate" title={c.fullName}>
            {c.fullName}
          </p>
          <p className="text-[11px] text-slate-500 truncate" title={c.headline}>
            {c.headline || c.email}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600">
        <Briefcase className="w-3 h-3 text-blue-600 shrink-0" />
        <span className="truncate">{app.job?.title || '-'}</span>
      </div>
      {c.location && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{c.location}</span>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${badge.class}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          ATS {score}%
        </span>
        <div className="flex items-center gap-2 text-[10px]">
          {app.scorecardRating ? (
            <span className="flex items-center gap-0.5 font-bold text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {app.scorecardRating}
            </span>
          ) : null}
          <span
            className={`flex items-center gap-0.5 font-semibold rounded px-1 py-0.5 ${
              critical
                ? 'bg-amber-500 text-white'
                : stale
                ? 'bg-amber-50 text-amber-700'
                : 'text-slate-500'
            }`}
            title={stale ? `No movement for ${days} days — needs follow-up` : 'Days in this stage'}
          >
            {stale ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {days}d
          </span>
        </div>
      </div>

      {app.pendingRequest && (
        <div
          className="mt-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700"
          title={`Requested by ${app.pendingRequest.requestedBy?.name || '—'}`}
        >
          <ShieldCheck className="w-3 h-3 shrink-0" />
          <span className="truncate">Awaiting approval → {stageLabel(app.pendingRequest.toStatus)}</span>
        </div>
      )}

      {/* PIC (Talent Acquisition owner) */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px]">
        {owner ? (
          <span
            className={`inline-flex items-center gap-1 min-w-0 px-1.5 py-0.5 rounded-md font-bold ${
              mine ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
            title={`Owner: ${owner.name}`}
          >
            {movable ? <UserRound className="w-3 h-3 shrink-0" /> : <Lock className="w-3 h-3 shrink-0" />}
            <span className="truncate">{mine ? 'Owner: Me' : shortName(owner.name)}</span>
          </span>
        ) : (
          <span className="text-slate-400 font-semibold">Unassigned</span>
        )}
        {claimable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClaim();
            }}
            className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 font-bold flex items-center gap-1 transition-colors"
          >
            <Hand className="w-3 h-3" />
            Claim
          </button>
        )}
      </div>

      {/* Actions: quick advance + move select (keyboard / touch fallback) */}
      {movable && (
        <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <select
            value={app.status}
            onChange={(e) => onMove(e.target.value)}
            aria-label="Move stage"
            className="min-w-0 flex-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {ALL_STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          {next && (
            <button
              type="button"
              onClick={() => onMove(next.key)}
              title={`Advance to ${next.label}`}
              className="shrink-0 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-[11px] font-bold flex items-center gap-0.5 transition-colors"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
