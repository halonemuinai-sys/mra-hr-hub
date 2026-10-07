'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  Users,
  Eye,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function TemplatesManagementPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await api.getJobs({ activeOnly: true });
        if (res.success && res.data) setJobs(res.data);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      }
    };
    loadJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreviewData(null);
    setImportResult(null);
  };

  const handleProcessUpload = async (isPreview = true) => {
    if (!file) {
      alert('Pilih file Excel (.xlsx) terlebih dahulu.');
      return;
    }

    setLoading(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('template', file);
      if (selectedJobId) fd.append('jobId', selectedJobId);

      const res = await api.uploadTemplate(fd, isPreview);
      if (res.success) {
        if (isPreview) {
          setPreviewData(res);
        } else {
          setImportResult(res);
          setPreviewData(null);
          setFile(null);
        }
      }
    } catch (err: any) {
      alert('Gagal memproses file template: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Pusat Template & Bulk Ingestion Excel
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh format template profil terstandar atau unggah ratusan kandidat massal sekaligus tanpa eror
          </p>
        </div>

        <div>
          <a
            href="http://localhost:5006/api/templates/download"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/25 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            Unduh Master Template (.xlsx)
          </a>
        </div>
      </div>

      {/* Template Instructions Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Standar 5-Sheet Template Rekrutmen MRA
          </h3>
          <p className="text-slate-600 leading-relaxed max-w-3xl">
            Template resmi memuat 5 lembar kerja terintegrasi: <strong>Panduan</strong>, <strong>Data Utama</strong>, <strong>Riwayat Pengalaman</strong>, <strong>Pendidikan</strong>, dan <strong>Matriks Keahlian</strong>. Setiap baris dihubungkan secara otomatis melalui alamat email unik.
          </p>
        </div>
        <div className="shrink-0 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-bold text-center">
          Format Wajib: Microsoft Excel (.xlsx)
        </div>
      </div>

      {/* Upload & Ingestion Dropzone Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900">Unggah File Template Kandidat Massal</h3>

        {/* Target Job Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Hubungkan ke Lowongan Pekerjaan (Opsional untuk Kalkulasi Skor ATS):
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="">-- Hanya Simpan ke Talent Pool Umum (Tanpa Lowongan Khusus) --</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mode Eksekusi:</label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  previewMode
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                1. Pratinjau & Validasi Live
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  !previewMode
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                2. Langsung Simpan ke Database
              </button>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors">
          <input
            type="file"
            id="template-admin-upload"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="template-admin-upload" className="cursor-pointer block">
            <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-800">
              {file ? file.name : 'Klik atau seret file template Excel (.xlsx) ke sini'}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Maksimum 25MB per file • Mendukung hingga 500 kandidat per batch ingestion
            </p>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {file && (
            <button
              type="button"
              onClick={() => handleProcessUpload(previewMode)}
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all ${
                previewMode
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
              }`}
            >
              {previewMode ? <Eye className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {loading
                ? 'Sedang Memproses...'
                : previewMode
                ? 'Jalankan Pratinjau & Validasi'
                : 'Impor & Simpan ke Database'}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {importResult && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-emerald-900">Bulk Ingestion Berhasil Dilakukan!</h4>
            <p className="mt-0.5">{importResult.message}</p>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-2 text-amber-700 bg-white p-3 rounded-lg border border-amber-200">
                <p className="font-bold">Peringatan baris bermasalah ({importResult.errors.length}):</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {importResult.errors.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Preview Table */}
      {previewData && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hasil Validasi & Pratinjau ({previewData.total} Kandidat Terdeteksi)
              </h3>
              <p className="text-xs text-slate-500">
                Periksa data sebelum melakukan commit penyimpanan permanen ke database
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleProcessUpload(false)}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-500/25 flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Konfirmasi & Simpan ke Database
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Nama Kandidat</th>
                  <th className="py-2.5 px-3">Email & No HP</th>
                  <th className="py-2.5 px-3">Kelompok & Senioritas</th>
                  <th className="py-2.5 px-3">Pengalaman</th>
                  <th className="py-2.5 px-3">Skor Estimasi ATS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewData.data?.map((cand: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{cand.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{cand.email} ({cand.phone || '-'})</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {cand.jobFamily}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{cand.seniorityLevel}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{cand.totalExperienceYrs} Tahun</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {cand.atsScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
