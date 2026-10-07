'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { BadgeCheck, Download, Hourglass, Loader2, Megaphone, Search, CalendarDays, Users } from 'lucide-react';
import { api, downloadEmployees } from '@/lib/api';
import { can, useCurrentUser } from '@/lib/permissions';
import PendingHiresTable from '@/components/employees/PendingHiresTable';
import EmployeeTable from '@/components/employees/EmployeeTable';
import EmployeeFormModal from '@/components/employees/EmployeeFormModal';
import AnnounceModal from '@/components/employees/AnnounceModal';
import TalentaSyncDrawer from '@/components/employees/talenta/TalentaSyncDrawer';
import EmployeeJourneyDrawer from '@/components/employees/journey/EmployeeJourneyDrawer';
import { EMPLOYMENT_STATUSES } from '@/components/employees/employeeFormat';
import PipelineToast, { ToastState } from '@/components/pipeline/PipelineToast';

type Tab = 'pending' | 'registered';

const matches = (q: string, ...fields: (string | undefined | null)[]) => !q || fields.some((f) => (f || '').toLowerCase().includes(q));

export default function EmployeesPage() {
  const user = useCurrentUser();
  const [pending, setPending] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('pending');
  const [tabChosen, setTabChosen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [registerApp, setRegisterApp] = useState<any | null>(null);
  const [editEmp, setEditEmp] = useState<any | null>(null);
  const [announceEmp, setAnnounceEmp] = useState<any | null>(null);
  const [talentaEmp, setTalentaEmp] = useState<any | null>(null);
  const [journeyEmp, setJourneyEmp] = useState<any | null>(null);
  const [talenta, setTalenta] = useState<{ mode: string; label: string; ready: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = (tone: ToastState['tone'], message: string) => setToast({ id: Date.now(), tone, message });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([api.getPendingHires(), api.getEmployees()]);
      setPending(p.data || []);
      setEmployees(e.data || []);
    } catch (err: any) {
      setToast({ id: Date.now(), tone: 'error', message: 'Gagal memuat data: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api
      .getTalentaStatus()
      .then((res: any) => setTalenta(res.data))
      .catch(() => {});
  }, [load]);

  // Open on the tab that has work, unless the user already picked one
  useEffect(() => {
    if (!loading && !tabChosen && pending.length === 0 && employees.length > 0) setTab('registered');
  }, [loading, tabChosen, pending.length, employees.length]);

  const q = search.trim().toLowerCase();
  const pendingRows = useMemo(
    () => pending.filter((a) => matches(q, a.candidate?.fullName, a.candidate?.email, a.job?.title, a.job?.division)),
    [pending, q]
  );
  const employeeRows = useMemo(
    () =>
      employees.filter(
        (e) =>
          (!status || e.employmentStatus === status) &&
          matches(q, e.fullName, e.employeeNo, e.position, e.department, e.division, e.personalEmail)
      ),
    [employees, q, status]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const upcoming = employees.filter((e) => {
      const d = new Date(e.joinDate).getTime();
      return d >= today && d <= today + 30 * 86400000;
    }).length;
    return {
      pending: pending.length,
      registered: employees.length,
      upcoming,
      unannounced: employees.filter((e) => !e.announcedAt).length
    };
  }, [pending, employees]);

  const restore = async (app: any) => {
    setBusyId(app.id);
    try {
      const res = await api.restoreHire(app.id);
      notify('success', res.message);
      await load();
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      const blob = await downloadEmployees(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = new Date();
      a.href = url;
      a.download = `karyawan-baru_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setExporting(false);
    }
  };

  const tiles = [
    { label: 'Menunggu registrasi', value: stats.pending, icon: Hourglass, cls: 'text-amber-600' },
    { label: 'Karyawan terdaftar', value: stats.registered, icon: Users, cls: 'text-slate-900' },
    { label: 'Bergabung 30 hari ke depan', value: stats.upcoming, icon: CalendarDays, cls: 'text-emerald-600' },
    { label: 'Belum diumumkan', value: stats.unannounced, icon: Megaphone, cls: 'text-blue-600' }
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-blue-600" />
            Karyawan Baru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kandidat Hired didaftarkan sebagai karyawan, keluar dari pipeline, lalu diumumkan di papan{' '}
            <Link href="/admin/announcements" className="font-bold text-blue-600 hover:text-blue-800">
              Selamat Bergabung
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {talenta && can(user, 'employee.sync') && (
            <span
              className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold ${
                talenta.mode === 'production'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : talenta.mode === 'sandbox'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title="Mode integrasi Talenta (backend/.env)"
            >
              Talenta: {talenta.label}
            </span>
          )}
          <button
            type="button"
            onClick={exportXlsx}
            disabled={exporting || !employees.length}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel (HRIS)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <t.icon className={`w-4 h-4 ${t.cls}`} />
            </div>
            <div>
              <p className={`text-xl font-black tabular-nums ${t.cls}`}>{loading ? '…' : t.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="p-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-100 rounded-xl p-1" role="tablist">
            {(
              [
                ['pending', 'Menunggu Registrasi', stats.pending],
                ['registered', 'Terdaftar', stats.registered]
              ] as [Tab, string, number][]
            ).map(([key, label, n]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => {
                  setTab(key);
                  setTabChosen(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  tab === key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
                <span
                  className={`min-w-5 px-1 rounded-md text-[10px] tabular-nums ${
                    key === 'pending' && n ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {n}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'pending' ? 'Cari nama, email, atau posisi…' : 'Cari nama, NIK, jabatan, departemen…'}
              className="pl-8 pr-3 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          {tab === 'registered' && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter status kepegawaian"
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Semua status</option>
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {tab === 'pending' ? (
          <PendingHiresTable rows={pendingRows} loading={loading} busyId={busyId} onRegister={setRegisterApp} onRestore={restore} />
        ) : (
          <EmployeeTable
            rows={employeeRows}
            loading={loading}
            onEdit={setEditEmp}
            onAnnounce={setAnnounceEmp}
            canSync={can(user, 'employee.sync')}
            talentaMode={talenta?.mode || null}
            onTalenta={setTalentaEmp}
            onJourney={setJourneyEmp}
          />
        )}
      </div>

      {!can(user, 'employee.manage') && (
        <p className="text-[11px] text-slate-500">Anda dapat melihat data ini; pendaftaran dilakukan oleh tim Talent Acquisition.</p>
      )}

      <AnimatePresence>
        {(registerApp || editEmp) && (
          <EmployeeFormModal
            applicationId={registerApp?.id}
            employee={editEmp || undefined}
            onClose={() => {
              setRegisterApp(null);
              setEditEmp(null);
            }}
            onSaved={(_, message) => {
              const registered = !!registerApp;
              setRegisterApp(null);
              setEditEmp(null);
              notify('success', message);
              if (registered) {
                setTab('registered');
                setTabChosen(true);
              }
              load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {announceEmp && (
          <AnnounceModal
            employee={announceEmp}
            onClose={() => setAnnounceEmp(null)}
            onSaved={(emp, message) => {
              setAnnounceEmp(null);
              setEmployees((list) => list.map((e) => (e.id === emp.id ? emp : e)));
              notify('success', message);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {journeyEmp && <EmployeeJourneyDrawer employeeId={journeyEmp.id} onClose={() => setJourneyEmp(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {talentaEmp && (
          <TalentaSyncDrawer
            employeeId={talentaEmp.id}
            onClose={() => setTalentaEmp(null)}
            onChanged={(message, tone) => {
              notify(tone, message);
              load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <PipelineToast key={toast.id} toast={toast} onDismiss={dismissToast} />}</AnimatePresence>
    </div>
  );
}
