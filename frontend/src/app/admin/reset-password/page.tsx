'use client';

import Link from 'next/link';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import AuthSidePanel from '@/components/auth/AuthSidePanel';

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'A letter and a number', test: (p: string) => /[A-Za-z]/.test(p) && /\d/.test(p) }
];

/** Step 2 of the password reset: choose a new password from the e-mailed link */
function ResetPasswordForm() {
  const token = useSearchParams().get('token') || '';
  const [check, setCheck] = useState<'loading' | 'ok' | 'invalid'>(token ? 'loading' : 'invalid');
  const [who, setWho] = useState<{ name: string; email: string } | null>(null);
  const [invalidReason, setInvalidReason] = useState('This reset link is not valid.');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .checkResetToken(token)
      .then((res) => {
        setWho(res.data);
        setCheck('ok');
      })
      .catch((err) => {
        setInvalidReason(err.message);
        setCheck('invalid');
      });
  }, [token]);

  const rulesOk = RULES.every((r) => r.test(password));
  const matches = password.length > 0 && password === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulesOk || !matches) return;
    setSaving(true);
    setError(null);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full pl-11 pr-11 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium';

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-sm flex-shrink-0 p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mra_logo.png" alt="MRA Group Logo" className="max-w-full max-h-full object-contain" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Choose a new password</h2>
          <p className="text-sm text-gray-400 mt-0.5">{who ? `For ${who.name} (${who.email})` : 'HR HUB account'}</p>
        </div>
      </div>

      {check === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking the link…
        </p>
      )}

      {check === 'invalid' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <AlertCircle className="w-4 h-4" /> {invalidReason}
          </p>
          <Link href="/admin/forgot-password" className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
            Request a new reset link →
          </Link>
        </div>
      )}

      {check === 'ok' && done && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4" /> Your password has been changed
          </p>
          <p className="text-sm text-emerald-900/80">Sign in with your new password. A confirmation was sent to your e-mail.</p>
          <Link href="/admin/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">
            Sign in
          </Link>
        </motion.div>
      )}

      {check === 'ok' && !done && (
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-semibold text-gray-700">
              New password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 pointer-events-none" />
              <input
                id="new-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
                required
                className={inputCls}
              />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {RULES.map((r) => {
                const ok = r.test(password);
                return (
                  <li key={r.label} className={`flex items-center gap-1 text-xs ${ok ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">
              Repeat new password
            </label>
            <div className="relative group">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 pointer-events-none" />
              <input
                id="confirm-password"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                className={inputCls}
              />
            </div>
            {confirm.length > 0 && !matches && <p className="text-xs text-amber-700">The passwords do not match.</p>}
          </div>
          <button
            type="submit"
            disabled={saving || !rulesOk || !matches}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save new password
          </button>
        </form>
      )}

      <div className="text-center">
        <Link href="/admin/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex bg-white font-sans h-screen overflow-hidden">
      <AuthSidePanel />
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-white overflow-y-auto h-full">
        <Suspense fallback={<Loader2 className="w-5 h-5 animate-spin text-slate-400" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
