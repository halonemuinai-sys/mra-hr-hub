'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Stage, isStale } from './stages';

interface Props {
  stage: Stage;
  items: any[];
  loading: boolean;
  selectedCount: number;
  onToggleSelectAll: () => void;
  onDropIds: (ids: string[]) => void;
  children: React.ReactNode;
}

export default function PipelineColumn({
  stage,
  items,
  loading,
  selectedCount,
  onToggleSelectAll,
  onDropIds,
  children
}: Props) {
  const [isOver, setIsOver] = useState(false);

  const avgScore = items.length
    ? Math.round(items.reduce((n, a) => n + (a.atsScore || 0), 0) / items.length)
    : 0;
  const staleCount = items.filter(isStale).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const raw = e.dataTransfer.getData('application/x-hrhub-ids');
        if (!raw) return;
        try {
          onDropIds(JSON.parse(raw));
        } catch {}
      }}
      className={`w-64 shrink-0 flex flex-col rounded-2xl border border-t-4 ${stage.accent} transition-colors ${
        isOver ? 'bg-blue-50 border-blue-300' : 'bg-slate-100/70 border-slate-200'
      }`}
    >
      <div className="px-3 pt-2.5 pb-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              disabled={items.length === 0}
              onChange={onToggleSelectAll}
              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
              aria-label={`Select all in ${stage.label}`}
            />
            <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
            {stage.label}
          </label>
          <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 tabular-nums">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 h-4">
          {items.length > 0 && <span>Avg ATS <b className="text-slate-700">{avgScore}%</b></span>}
          {staleCount > 0 && (
            <span className="flex items-center gap-0.5 font-semibold text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              {staleCount} stalled
            </span>
          )}
        </div>
      </div>

      <div className="px-2 pb-2 space-y-2 min-h-[120px] max-h-[calc(100vh-360px)] overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="h-24 rounded-xl bg-white/60 animate-pulse" />
        ) : items.length === 0 ? (
          <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400">
            Drop candidates here
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
