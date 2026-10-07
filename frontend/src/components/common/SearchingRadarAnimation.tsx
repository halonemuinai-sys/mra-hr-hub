'use client';

import React from 'react';
import { Search, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  title?: string;
  subtitle?: string;
  processing?: boolean;
}

export default function SearchingRadarAnimation({
  title = 'Ready to explore your talent pool?',
  subtitle = 'Set your filters, then click Process Data to load candidate profiles and ATS results.',
  processing = false
}: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <div role="status" aria-live="polite" className="flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
      <div aria-hidden="true" className="relative mb-6 flex h-40 w-40 items-center justify-center">
        {[0, 1, 2].map((ring) => (
          <motion.div key={ring} className="absolute rounded-full border border-blue-200" style={{ inset: ring * 18 }}
            animate={reduceMotion ? { opacity: 0.6 } : { opacity: [0.25, 0.75, 0.25], scale: [1, 1.04, 1] }}
            transition={{ duration: processing ? 1.8 : 4, delay: ring * 0.25, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
        <motion.div className="absolute inset-0 rounded-full"
          style={{ background: 'conic-gradient(from 0deg, transparent 65%, rgb(59 130 246 / 18%) 100%)' }}
          animate={{ rotate: reduceMotion ? 0 : 360 }}
          transition={{ duration: processing ? 2 : 10, repeat: Infinity, ease: 'linear' }} />
        <span className="absolute left-6 top-8 h-2 w-2 rounded-full bg-blue-400 ring-4 ring-blue-50" />
        <span className="absolute bottom-7 right-7 h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-50" />
        <motion.div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-lg shadow-blue-100/70"
          animate={{ y: reduceMotion ? 0 : [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {processing ? <Search className="h-7 w-7" /> : <Users className="h-7 w-7" />}
        </motion.div>
      </div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{subtitle}</p>
      {processing && <div aria-hidden="true" className="mt-5 flex gap-1.5">
        {[0, 1, 2].map((dot) => <motion.span key={dot} className="h-1.5 w-1.5 rounded-full bg-blue-500" animate={{ opacity: reduceMotion ? 1 : [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }} />)}
      </div>}
    </div>
  );
}
