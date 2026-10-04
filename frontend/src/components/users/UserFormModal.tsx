'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, KeyRound, Loader2 } from 'lucide-react';

interface Props {
  /** null = create new user; otherwise reset password for this user */
  user: any | null;
  roles: { key: string; label: string; description: string }[];
  onCancel: () => void;
  onSubmit: (data: { name?: string; email?: string; role?: string; password: string }) => Promise<void>;
}

const inputCls =
  'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

export default function UserFormModal({ user, roles, onCancel, onSubmit }: Props) {
  const isCreate = !user;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RECRUITER');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(isCreate ? { name, email, role, password } : { password });
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const Icon = isCreate ? UserPlus : KeyRound;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{isCreate ? 'Tambah User CMS' : 'Reset Password'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCreate ? 'Akun baru dapat langsung login dengan password di bawah.' : `Password baru untuk ${user.name}.`}
            </p>
          </div>
        </div>

        {isCreate && (
          <>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-700">Nama lengkap</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="mis. Dewi Lestari" />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-700">Email kantor</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="nama@mragroup.co.id" />
            </label>
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700">Role</span>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    className={`text-left p-2.5 rounded-xl border transition-colors ${
                      role === r.key ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-slate-900">{r.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">{r.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-700">{isCreate ? 'Password awal' : 'Password baru'}</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="Minimal 8 karakter"
          />
        </label>

        {error && <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isCreate ? 'Buat User' : 'Simpan Password'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
