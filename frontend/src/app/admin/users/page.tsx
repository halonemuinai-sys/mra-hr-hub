'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UserCog, UserPlus, ShieldCheck, KeyRound, Search, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useCurrentUser, ROLE_LABELS } from '@/lib/permissions';
import { getInitials } from '@/components/pipeline/stages';
import AccessMatrix from '@/components/users/AccessMatrix';
import UserFormModal from '@/components/users/UserFormModal';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

type Tab = 'users' | 'matrix';

export default function UsersPage() {
  const me = useCurrentUser();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ user: any | null } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const notify = (tone: ToastState['tone'], message: string) => setToast({ id: Date.now(), tone, message });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.data || []);
    } catch (err: any) {
      notify('error', 'Gagal memuat user: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    api.getAccessMatrix()
      .then((res: any) => res.success && setMatrix(res.data))
      .catch(() => {});
  }, [loadUsers]);

  const update = async (user: any, data: { role?: string; isActive?: boolean; password?: string }) => {
    setBusyId(user.id);
    try {
      const res = await api.updateUser(user.id, data);
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, ...res.data } : u)));
      notify('success', res.message);
      if (data.isActive === false) loadUsers(); // refresh released-candidate counts
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  const roles = matrix?.roles || Object.keys(ROLE_LABELS).map((k) => ({ key: k, label: ROLE_LABELS[k], description: '' }));
  const roleCounts = users.reduce((acc: Record<string, number>, u) => {
    if (u.isActive) acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            User & Hak Akses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola akun CMS, role, dan status aktif. Perubahan role berlaku langsung pada request berikutnya.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ user: null })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Tambah User
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r: any) => (
          <div key={r.key} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{r.label}</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums mt-1">{loading ? '…' : roleCounts[r.key] || 0}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{r.description}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-white border border-slate-200/80 rounded-xl p-1 shadow-xs">
        {[
          { key: 'users' as Tab, label: 'Daftar User', icon: UserCog },
          { key: 'matrix' as Tab, label: 'Matriks Hak Akses', icon: ShieldCheck }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'matrix' ? (
        matrix ? (
          <AccessMatrix roles={matrix.roles} permissions={matrix.permissions} rolePermissions={matrix.rolePermissions} />
        ) : (
          <div className="h-40 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / email…"
                className="pl-8 pr-3 py-2 w-full border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <button type="button" onClick={loadUsers} className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50" title="Muat ulang">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 font-bold">User</th>
                  <th className="px-4 py-2.5 font-bold">Role</th>
                  <th className="px-4 py-2.5 font-bold text-center">Kandidat Aktif</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Memuat user…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Tidak ada user yang cocok.</td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const self = u.id === me?.id;
                    const busy = busyId === u.id;
                    return (
                      <tr key={u.id} className={`border-t border-slate-100 ${u.isActive ? '' : 'bg-slate-50/70'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                u.isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {getInitials(u.name.replace(/\s*\(.*\)\s*$/, ''))}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold truncate ${u.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                                {u.name}
                                {self && <span className="ml-1.5 text-[10px] font-bold text-blue-600">(Anda)</span>}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            disabled={self || busy}
                            onChange={(e) => update(u, { role: e.target.value })}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            title={self ? 'Tidak dapat mengubah role sendiri' : 'Ubah role'}
                          >
                            {roles.map((r: any) => (
                              <option key={r.key} value={r.key}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900 tabular-nums">{u.activeCandidates || 0}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={self || busy}
                            onClick={() => {
                              if (
                                u.isActive &&
                                !confirm(
                                  `Nonaktifkan ${u.name}?` +
                                    (u.activeCandidates ? `\n${u.activeCandidates} kandidat aktif miliknya akan dikembalikan ke antrean.` : '')
                                )
                              )
                                return;
                              update(u, { isActive: !u.isActive });
                            }}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold disabled:cursor-not-allowed ${
                              u.isActive
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                            }`}
                            title={self ? 'Tidak dapat menonaktifkan akun sendiri' : u.isActive ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {u.isActive ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setModal({ user: u })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <UserFormModal
            user={modal.user}
            roles={roles}
            onCancel={() => setModal(null)}
            onSubmit={async (data) => {
              if (modal.user) {
                const res = await api.updateUser(modal.user.id, { password: data.password });
                notify('success', res.message);
              } else {
                const res = await api.createUser(data as any);
                notify('success', res.message);
                loadUsers();
              }
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}
      </AnimatePresence>
    </div>
  );
}
