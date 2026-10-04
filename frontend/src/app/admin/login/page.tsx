'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Key
} from 'lucide-react';
import { api } from '@/lib/api';

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
function LeftPanel() {
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

// Main Login Page (Matching GLC Layout & Flow)
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect to /admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hr_hub_token');
      if (token) {
        router.replace('/admin');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('hr_hub_token', res.token);
        localStorage.setItem('hr_hub_user', JSON.stringify(res.user));
        router.push('/admin');
      } else {
        setApiError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Login failed. Please check your network and credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (type: 'superadmin' | 'recruiter') => {
    if (type === 'superadmin') {
      setEmail('admin@mragroup.co.id');
      setPassword('Password123!');
    } else {
      setEmail('recruiter@mragroup.co.id');
      setPassword('Password123!');
    }
    setApiError(null);
  };

  const inputCls =
    'w-full pl-11 pr-11 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm ' +
    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ' +
    'focus:border-blue-500 transition-all font-medium';

  return (
    <div className="min-h-screen w-full flex bg-white font-sans h-screen overflow-hidden">
      {/* Decorative left panel */}
      <LeftPanel />

      {/* Right Login form panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-white overflow-y-auto h-full">
        <div className="w-full max-w-md">
          {/* Mobile top logo (shows only on small screens) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm p-1.5">
              <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-900">MRA HR HUB</span>
          </div>

          <div className="space-y-6">
            {/* Form Title & Subtitle Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-sm flex-shrink-0 p-1.5">
                <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Welcome Back</h2>
                <p className="text-sm text-gray-400 mt-0.5">Sign in to your MRA Recruiter account to continue</p>
              </div>
            </div>

            {/* Error notifications */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </motion.div>
            )}

            {/* Credentials Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    required
                    className={inputCls}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={inputCls}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Demo Credentials */}
              <div className="pt-0.5">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-500" />
                  <span>Akun Demo Cepat (One-Click):</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('superadmin')}
                    className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors truncate text-center cursor-pointer"
                  >
                    Director (Superadmin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('recruiter')}
                    className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors truncate text-center cursor-pointer"
                  >
                    Senior Recruiter
                  </button>
                </div>
              </div>

              {/* Sign In Submit Button with Shine Animation Effect (GLC Signature) */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-lg shadow-blue-200 cursor-pointer"
              >
                {/* Shine animation effect overlay */}
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)'
                  }}
                  initial={{ x: '-200%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                />
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer helper */}
            <div className="space-y-2 pt-2 text-center text-sm text-gray-400">
              <p>
                Don't have access?{' '}
                <span className="font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
                  Contact Administrator
                </span>
              </p>
              <div>
                <a href="/" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                  ← Kembali ke Portal Karir Publik
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
