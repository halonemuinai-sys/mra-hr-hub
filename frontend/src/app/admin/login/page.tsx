'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import AuthSidePanel from '@/components/auth/AuthSidePanel';

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

  const inputCls =
    'w-full pl-11 pr-11 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm ' +
    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ' +
    'focus:border-blue-500 transition-all font-medium';

  return (
    <div className="min-h-screen w-full flex bg-white font-sans h-screen overflow-hidden">
      {/* Decorative left panel */}
      <AuthSidePanel />

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
                  <Link href="/admin/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
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
              <p>No access yet? Contact your HR HUB administrator.</p>
              <div>
                <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                  ← Back to the careers portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
