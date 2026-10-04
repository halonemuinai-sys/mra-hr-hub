'use client';

import React from 'react';
import { Sparkles, Search } from 'lucide-react';

interface Props {
  title?: string;
  subtitle?: string;
}

export default function SearchingRadarAnimation({
  title = 'Data Belum Diproses',
  subtitle = 'Atur parameter pencarian di atas, lalu tekan tombol "Proses & Filter Data" untuk memuat daftar kandidat.'
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs my-6 min-h-[320px]">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        {/* Animated concentric circles */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping opacity-75" />
        <div className="absolute inset-2 rounded-full border border-blue-500/40 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-blue-50 flex items-center justify-center shadow-inner">
          <Search className="w-8 h-8 text-blue-600 animate-bounce" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}
