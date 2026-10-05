'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  tone?: 'blue' | 'slate';
}

/** Keyword chips: Enter or comma adds, Backspace on empty input removes the last one, paste splits by comma */
export default function SkillTagInput({ value, onChange, placeholder, tone = 'blue' }: Props) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    parts.forEach((p) => {
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
    });
    onChange(next);
    setDraft('');
  };

  const chip =
    tone === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div
      className={`flex flex-wrap gap-1.5 p-2 rounded-lg border bg-white focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 ${
        tone === 'blue' ? 'border-blue-200' : 'border-slate-200'
      }`}
    >
      {value.map((s) => (
        <span key={s} className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md border text-[11px] font-semibold ${chip}`}>
          {s}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== s))} className="p-0.5 rounded hover:bg-white/80" aria-label={`Hapus ${s}`}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(',')) add(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? '' : placeholder}
        className="flex-1 min-w-[120px] text-xs outline-none bg-transparent py-0.5"
      />
    </div>
  );
}
