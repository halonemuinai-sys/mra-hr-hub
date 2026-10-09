'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// Deterministic particles for the left panel graphic (same as GLC project)
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: ((i * 41 + 11) % 88) + 6,
  top: ((i * 37 + 7) % 82) + 6,
  size: i % 4 === 0 ? 5 : i % 3 === 0 ? 4 : 3,
  duration: 4 + (i % 4),
  delay: (i * 0.4) % 3,
  yOffset: i % 2 === 0 ? -10 : 10,
}));

// Left Panel Component (Identical to GLC MRA OpsSuite)
export default function AuthSidePanel() {
  return (
    <div
      className="hidden lg:flex w-[52%] relative overflow-hidden flex-col items-center justify-center h-screen select-none"
      style={{
        background: 'linear-gradient(140deg, #dde4ff 0%, #e2e8ff 35%, #ebf2fe 65%, #f8fafc 100%)'
      }}
    >
      {/* Circuit SVG lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.22]" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="25%" x2="30%" y2="25%" stroke="#2563eb" strokeWidth="1" />
        <line x1="30%" y1="25%" x2="30%" y2="12%" stroke="#2563eb" strokeWidth="1" />
        <line x1="30%" y1="12%" x2="55%" y2="12%" stroke="#2563eb" strokeWidth="1" />
        <circle cx="30%" cy="25%" r="3" fill="#2563eb" />
        <circle cx="55%" cy="12%" r="3" fill="#2563eb" />

        <line x1="100%" y1="35%" x2="72%" y2="35%" stroke="#2563eb" strokeWidth="1" />
        <line x1="72%" y1="35%" x2="72%" y2="55%" stroke="#2563eb" strokeWidth="1" />
        <line x1="72%" y1="55%" x2="88%" y2="55%" stroke="#2563eb" strokeWidth="1" />
        <circle cx="72%" cy="35%" r="3" fill="#2563eb" />
        <circle cx="72%" cy="55%" r="3" fill="#2563eb" />

        <line x1="0" y1="68%" x2="22%" y2="68%" stroke="#2563eb" strokeWidth="1" />
        <line x1="22%" y1="68%" x2="22%" y2="82%" stroke="#2563eb" strokeWidth="1" />
        <line x1="22%" y1="82%" x2="45%" y2="82%" stroke="#2563eb" strokeWidth="1" />
        <circle cx="22%" cy="68%" r="3" fill="#2563eb" />
        <circle cx="45%" cy="82%" r="3" fill="#2563eb" />

        <line x1="100%" y1="78%" x2="78%" y2="78%" stroke="#2563eb" strokeWidth="1" />
        <line x1="78%" y1="78%" x2="78%" y2="92%" stroke="#2563eb" strokeWidth="1" />
        <circle cx="78%" cy="78%" r="3" fill="#2563eb" />
      </svg>

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-500/50"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
          animate={{ y: [0, p.yOffset, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-14 gap-7">
        {/* Logo Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-28 h-28 rounded-[2rem] bg-white shadow-2xl shadow-blue-200/70 flex items-center justify-center border border-blue-100 p-4"
        >
          <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
        </motion.div>

        {/* Badge Pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 border border-blue-100 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-blue-700">ATS • Talent Profiling • Recruiter Cockpit</span>
        </motion.div>

        {/* Jargon & Titles */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">
            MRA<br />HR HUB
          </h1>
          <p className="text-slate-600 mt-3 text-base font-medium max-w-md leading-relaxed">
            Automated ATS Ingestion. Candidate DNA. Corporate Recruiter Cockpit.
          </p>
        </motion.div>

        {/* Bottom Mockup Widgets (Identical to GLC) */}
        <div className="flex items-end gap-4 mt-2">
          {/* Chart Card */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-white rounded-2xl shadow-xl shadow-blue-100/80 p-4 w-44 border border-blue-50"
          >
            <div className="flex items-center justify-center mb-3">
              <svg viewBox="0 0 64 64" className="w-14 h-14">
                <circle cx="32" cy="32" r="24" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="32"
                  cy="32"
                  r="24"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="10"
                  strokeDasharray="96 55"
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="24"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="10"
                  strokeDasharray="40 111"
                  strokeDashoffset="-96"
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
              </svg>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 bg-blue-100 rounded-full w-full" />
              <div className="h-2 bg-blue-50 rounded-full w-3/4" />
              <div className="h-2 bg-blue-50 rounded-full w-1/2" />
            </div>
          </motion.div>

          {/* Checklist Card */}
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl shadow-blue-100/80 p-4 w-36 border border-blue-50"
          >
            {[true, true, false].map((done, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done ? 'bg-blue-600' : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div className={`h-2 rounded-full flex-1 ${done ? 'bg-slate-300' : 'bg-slate-100'}`} />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
