'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';

interface Props {
  roles: { key: string; label: string; description: string }[];
  permissions: { key: string; group: string; label: string }[];
  rolePermissions: Record<string, string[]>;
}

export default function AccessMatrix({ roles, permissions, rolePermissions }: Props) {
  const groups = [...new Set(permissions.map((p) => p.group))];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left font-bold text-slate-700 px-4 py-3 min-w-[240px]">Hak Akses</th>
              {roles.map((r) => (
                <th key={r.key} className="px-3 py-3 text-center min-w-[120px]" title={r.description}>
                  <span className="block font-bold text-slate-900">{r.label}</span>
                  <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">{r.key}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <React.Fragment key={group}>
                <tr className="bg-slate-50/60">
                  <td colSpan={roles.length + 1} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {group}
                  </td>
                </tr>
                {permissions
                  .filter((p) => p.group === group)
                  .map((p) => (
                    <tr key={p.key} className="border-t border-slate-100">
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-slate-800">{p.label}</span>
                        <code className="ml-2 text-[10px] text-slate-400">{p.key}</code>
                      </td>
                      {roles.map((r) => {
                        const ok = rolePermissions[r.key]?.includes(p.key);
                        return (
                          <td key={r.key} className="px-3 py-2.5 text-center">
                            {ok ? (
                              <span className="inline-flex w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 items-center justify-center">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-slate-300 inline" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-500">
        Matrix ini ditetapkan di <code className="text-slate-700">backend/config/permissions.js</code>. Untuk memberi
        akses ke seseorang, ubah role-nya di tab User.
      </p>
    </div>
  );
}
