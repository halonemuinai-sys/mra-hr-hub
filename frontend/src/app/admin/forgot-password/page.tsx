'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Loader2, Mail, MailCheck, Send } from 'lucide-react';
import { api } from '@/lib/api';
import AuthSidePanel from '@/components/auth/AuthSidePanel';

/** Step 1 of the password reset: request a link by e-mail */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.forgotPassword(email.trim());
      setSent(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium';

  return (
    <div className="min-h-screen w-full flex bg-white font-sans h-screen overflow-hidden">
      <AuthSidePanel />
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-white overflow-y-auto h-full">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-sm flex-shrink-0 p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">Forgot password</h2>
              <p className="text-sm text-gray-400 mt-0.5">We&apos;ll e-mail you a link to choose a new password</p>
            </div>
          </div>

          {sent ? (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                <MailCheck className="w-4 h-4" /> Check your e-mail
              </p>
              <p className="text-sm text-emerald-900/80 leading-relaxed">{sent}</p>
              <p className="text-xs text-emerald-900/70">The link is valid for 30 minutes and can be used once. Nothing arrived? Wait a few minutes, check the spam folder, or try again.</p>
              <button type="button" onClick={() => setSent(null)} className="text-xs font-semibold text-emerald-800 underline underline-offset-2">
                Send again
              </button>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="forgot-email" className="text-sm font-semibold text-gray-700">
                  Work e-mail
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.co.id"
                    required
                    autoFocus
                    className={inputCls}
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-lg shadow-blue-200"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send reset link
              </button>
            </form>
          )}

          <div className="text-center">
            <Link href="/admin/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
