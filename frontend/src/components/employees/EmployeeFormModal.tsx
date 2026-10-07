'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Loader2, Megaphone, X } from 'lucide-react';
import { api } from '@/lib/api';
import { announcementDraft, EMPLOYMENT_STATUSES } from './employeeFormat';

type Values = Record<string, string>;

interface Props {
  /** Register mode: the HIRED application to turn into an employee */
  applicationId?: string;
  /** Edit mode: an existing employee */
  employee?: any;
  onClose: () => void;
  onSaved: (employee: any, message: string) => void;
}

const FIELDS: { key: string; label: string; required?: boolean; type?: string; span?: boolean; placeholder?: string }[] = [
  { key: 'employeeNo', label: 'NIK karyawan', required: true, placeholder: 'MRA-2026-0001' },
  { key: 'joinDate', label: 'Tanggal bergabung', required: true, type: 'date' },
  { key: 'fullName', label: 'Nama lengkap', required: true, span: true },
  { key: 'position', label: 'Jabatan', required: true },
  { key: 'department', label: 'Departemen', required: true },
  { key: 'division', label: 'Divisi / unit bisnis', required: true },
  { key: 'workLocation', label: 'Lokasi kerja', required: true },
  { key: 'managerName', label: 'Atasan langsung' },
  { key: 'phone', label: 'No. HP' },
  { key: 'personalEmail', label: 'Email pribadi', required: true, type: 'email' },
  { key: 'workEmail', label: 'Email kantor', type: 'email', placeholder: 'nama@mragroup.co.id' }
];

const fromEmployee = (e: any): Values => ({
  employeeNo: e.employeeNo || '',
  joinDate: e.joinDate ? String(e.joinDate).slice(0, 10) : '',
  fullName: e.fullName || '',
  position: e.position || '',
  department: e.department || '',
  division: e.division || '',
  workLocation: e.workLocation || '',
  managerName: e.managerName || '',
  phone: e.phone || '',
  personalEmail: e.personalEmail || '',
  workEmail: e.workEmail || '',
  employmentStatus: e.employmentStatus || 'PROBATION',
  notes: e.notes || ''
});

export default function EmployeeFormModal({ applicationId, employee, onClose, onSaved }: Props) {
  const editing = !!employee;
  const [values, setValues] = useState<Values | null>(editing ? fromEmployee(employee) : null);
  const [context, setContext] = useState<{ candidate?: any; job?: any } | null>(null);
  const [loadError, setLoadError] = useState('');
  const [announce, setAnnounce] = useState(true);
  const [message, setMessage] = useState('');
  const [messageEdited, setMessageEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing || !applicationId) return;
    api.getEmployeePrefill(applicationId)
      .then((res: any) => {
        setValues(res.data.values);
        setContext({ candidate: res.data.candidate, job: res.data.job });
      })
      .catch((err: any) => setLoadError(err.message));
  }, [applicationId, editing]);

  // Keep the announcement in step with the form until the user writes their own
  useEffect(() => {
    if (values && !messageEdited) setMessage(announcementDraft(values));
  }, [values, messageEdited]);

  const set = (key: string, v: string) => setValues((prev) => (prev ? { ...prev, [key]: v } : prev));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setSaving(true);
    setError('');
    try {
      const res = editing
        ? await api.updateEmployee(employee.id, values)
        : await api.registerEmployee({ ...values, applicationId, announce, announcementMessage: announce ? message : '' });
      onSaved(res.data, res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const input =
    'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onSubmit={submit}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl"
      >
        <div className="flex items-start gap-3 p-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">{editing ? 'Ubah data karyawan' : 'Daftarkan sebagai karyawan'}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {editing
                ? `${employee.fullName} · ${employee.employeeNo}`
                : context
                ? `${context.candidate?.fullName} · diterima untuk ${context.job?.title}`
                : 'Memuat data kandidat…'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loadError ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{loadError}</p>
          ) : !values ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {!editing && (
                <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  Data diisi otomatis dari profil kandidat, lowongan, dan tanggal join saat konfirmasi Hired. Setelah disimpan,
                  kartu kandidat keluar dari pipeline.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FIELDS.map((f) => (
                  <label key={f.key} className={`space-y-1 ${f.span ? 'sm:col-span-2' : ''}`}>
                    <span className="text-[11px] font-bold text-slate-600">
                      {f.label}
                      {f.required && <span className="text-amber-600"> *</span>}
                    </span>
                    <input
                      type={f.type || 'text'}
                      value={values[f.key] || ''}
                      required={f.required}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                      className={input}
                    />
                  </label>
                ))}
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600">Status kepegawaian</span>
                  <select value={values.employmentStatus} onChange={(e) => set('employmentStatus', e.target.value)} className={input}>
                    {EMPLOYMENT_STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-600">Catatan onboarding</span>
                  <textarea
                    value={values.notes || ''}
                    onChange={(e) => set('notes', e.target.value)}
                    rows={2}
                    placeholder="Mis. perlengkapan kerja, akses sistem, jadwal orientasi…"
                    className={`${input} resize-none`}
                  />
                </label>
              </div>

              {!editing && (
                <div className={`rounded-xl border p-3 space-y-2 ${announce ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'}`}>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={announce}
                      onChange={(e) => setAnnounce(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                    />
                    <Megaphone className="w-3.5 h-3.5 text-blue-600" />
                    Umumkan di papan &quot;Selamat Bergabung&quot;
                  </label>
                  {announce && (
                    <>
                      <textarea
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          setMessageEdited(true);
                        }}
                        rows={3}
                        maxLength={1000}
                        className={`${input} resize-none bg-white`}
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Tampil untuk semua user HR HUB, tanpa data kontak.</span>
                        {messageEdited && (
                          <button
                            type="button"
                            onClick={() => setMessageEdited(false)}
                            className="font-bold text-blue-600 hover:text-blue-800"
                          >
                            Pakai teks otomatis
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-amber-700 min-w-0 truncate" role="alert">
            {error}
          </p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={!values || saving}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editing ? 'Simpan perubahan' : announce ? 'Daftarkan & umumkan' : 'Daftarkan'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
