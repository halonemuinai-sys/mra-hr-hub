'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  Trash2,
  DollarSign,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

export default function JobsManagementPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New job state
  const [form, setForm] = useState({
    title: '',
    department: '',
    division: 'MRA Corporate / Shared Service',
    location: 'Jakarta',
    employmentType: 'Full-time',
    minExperience: 2,
    minEducation: 'S1',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
    mustHaveSkills: 'React, Next.js, TypeScript',
    niceToHaveSkills: 'Docker, Prisma, Tailwind CSS'
  });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({ activeOnly: false });
      if (res.success && res.data) setJobs(res.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        minExperience: parseInt(String(form.minExperience), 10) || 0,
        salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : null,
        mustHaveSkills: form.mustHaveSkills.split(',').map((s) => s.trim()).filter(Boolean),
        niceToHaveSkills: form.niceToHaveSkills.split(',').map((s) => s.trim()).filter(Boolean)
      };

      const res = await api.createJob(payload);
      if (res.success) {
        alert('Lowongan pekerjaan berhasil ditambahkan!');
        setShowAddModal(false);
        loadJobs();
      }
    } catch (err: any) {
      alert('Gagal membuat lowongan: ' + err.message);
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!confirm(`Hapus lowongan "${title}"?`)) return;
    try {
      await api.deleteJob(id);
      loadJobs();
    } catch (err: any) {
      alert('Gagal menghapus lowongan: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Manajemen Lowongan & Kriteria Bobot ATS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi kata kunci keahlian (must-have keywords) yang menjadi acuan penilaian otomatis ATS
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-500/25 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Lowongan Baru
        </button>
      </div>

      {/* Grid Lowongan */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-100">
                    {job.department}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${job.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {job.isActive ? 'Aktif' : 'Draft'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{job.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{job.division}</p>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location} • Min. {job.minExperience} Tahun
                  </p>
                  {job.salaryMin && (
                    <p className="font-semibold text-emerald-700 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatRupiah(job.salaryMin)} - {formatRupiah(job.salaryMax)}
                    </p>
                  )}
                </div>

                {/* Must Have ATS Keywords */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-blue-900 flex items-center gap-1 mb-1.5">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    Must-Have Keywords ATS:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(job.mustHaveSkills || []).map((k: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{job._count?.applications || 0} Pelamar Terdaftar</span>
                <button
                  type="button"
                  onClick={() => handleDeleteJob(job.id, job.title)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus Lowongan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Lowongan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Tambah Lowongan & Kriteria ATS</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Posisi *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Senior React Developer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departemen *</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Technology"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Divisi Perusahaan</label>
                  <select
                    value={form.division}
                    onChange={(e) => setForm({ ...form, division: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="MRA Corporate / Shared Service">MRA Corporate</option>
                    <option value="MRA Retail (BVLGARI / Mogems)">MRA Retail</option>
                    <option value="GLC MRA Holding">GLC MRA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min. Pengalaman (Tahun)</label>
                  <input
                    type="number"
                    value={form.minExperience}
                    onChange={(e) => setForm({ ...form, minExperience: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-blue-900 mb-1">
                  Must-Have Skills Keywords ATS (Dipisah koma):
                </label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Next.js, REST API"
                  value={form.mustHaveSkills}
                  onChange={(e) => setForm({ ...form, mustHaveSkills: e.target.value })}
                  className="w-full p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Terbitkan Lowongan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
