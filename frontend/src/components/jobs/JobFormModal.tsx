'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import SkillTagInput from './SkillTagInput';
import { DIVISIONS, EMPLOYMENT_TYPES, EDUCATION_LEVELS, EMPTY_JOB, JobForm, toForm } from './jobOptions';

interface Props {
  /** null = create a new job */
  job: any | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const inputCls =
  'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-slate-700">
        {label}
        {required && <span className="text-amber-600"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
    </label>
  );
}

export default function JobFormModal({ job, onClose, onSaved }: Props) {
  const isEdit = !!job;
  const [form, setForm] = useState<JobForm>(() => (job ? toForm(job) : EMPTY_JOB));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<JobForm>) => setForm((f) => ({ ...f, ...patch }));

  const divisionOptions = DIVISIONS.includes(form.division) ? DIVISIONS : [form.division, ...DIVISIONS];
  const salaryInvalid = form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salaryInvalid) return setError('Gaji minimum tidak boleh melebihi gaji maksimum.');
    if (!form.mustHaveSkills.length) return setError('Tambahkan minimal satu must-have keyword — ini acuan utama skor ATS.');
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
        salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax)
      };
      const res = isEdit ? await api.updateJob(job.id, payload) : await api.createJob(payload);
      onSaved(res.message);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const money = (v: string) => (v ? Number(v).toLocaleString('id-ID') : '');
  const parseMoney = (v: string) => v.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Lowongan & Kriteria ATS' : 'Tambah Lowongan & Kriteria ATS'}</h3>
            {isEdit && <p className="text-[11px] text-slate-500">Perubahan keyword berlaku untuk penilaian ATS lamaran berikutnya.</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Informasi posisi</p>
            <Field label="Judul posisi" required>
              <input required value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} placeholder="mis. Senior React Developer" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Departemen" required>
                <input required value={form.department} onChange={(e) => set({ department: e.target.value })} className={inputCls} placeholder="mis. Technology & Digital" />
              </Field>
              <Field label="Divisi / unit bisnis">
                <select value={form.division} onChange={(e) => set({ division: e.target.value })} className={inputCls}>
                  {divisionOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Lokasi">
                <input value={form.location} onChange={(e) => set({ location: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Tipe kerja">
                <select value={form.employmentType} onChange={(e) => set({ employmentType: e.target.value })} className={inputCls}>
                  {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kriteria ATS</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min. pengalaman (tahun)">
                <input type="number" min={0} value={form.minExperience} onChange={(e) => set({ minExperience: Math.max(0, parseInt(e.target.value, 10) || 0) })} className={inputCls} />
              </Field>
              <Field label="Min. pendidikan">
                <select value={form.minEducation} onChange={(e) => set({ minEducation: e.target.value })} className={inputCls}>
                  {(EDUCATION_LEVELS.includes(form.minEducation) ? EDUCATION_LEVELS : [form.minEducation, ...EDUCATION_LEVELS]).map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Must-have keywords" required hint="Enter atau koma untuk menambah. Bobot terbesar dalam skor kecocokan ATS.">
              <SkillTagInput value={form.mustHaveSkills} onChange={(v) => set({ mustHaveSkills: v })} placeholder="mis. React, TypeScript, REST API" />
            </Field>
            <Field label="Nice-to-have keywords" hint="Nilai tambah, tidak wajib.">
              <SkillTagInput value={form.niceToHaveSkills} onChange={(v) => set({ niceToHaveSkills: v })} placeholder="mis. Docker, Prisma" tone="slate" />
            </Field>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kompensasi</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gaji minimum (Rp / bulan)">
                <input inputMode="numeric" value={money(form.salaryMin)} onChange={(e) => set({ salaryMin: parseMoney(e.target.value) })} className={`${inputCls} tabular-nums`} placeholder="0" />
              </Field>
              <Field label="Gaji maksimum (Rp / bulan)" hint="Juga batas budget: offering di atasnya butuh approval TA Lead.">
                <input inputMode="numeric" value={money(form.salaryMax)} onChange={(e) => set({ salaryMax: parseMoney(e.target.value) })} className={`${inputCls} tabular-nums ${salaryInvalid ? 'border-amber-500' : ''}`} placeholder="0" />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Konten lowongan</p>
            <Field label="Deskripsi pekerjaan">
              <textarea rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
            <Field label="Persyaratan" hint="Satu persyaratan per baris — tampil sebagai checklist di portal karier.">
              <textarea rows={4} value={form.requirements} onChange={(e) => set({ requirements: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
          </section>

          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
            <span>
              <span className="block text-xs font-bold text-slate-900">Tampilkan di portal karier</span>
              <span className="block text-[11px] text-slate-500">Nonaktifkan untuk menutup lowongan tanpa menghapus riwayat lamaran.</span>
            </span>
            <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
          </label>

          {error && <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            {form.mustHaveSkills.length} must-have · {form.niceToHaveSkills.length} nice-to-have
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Simpan Perubahan' : 'Terbitkan Lowongan'}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
