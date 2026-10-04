'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Briefcase,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  RefreshCw,
  KanbanSquare,
  UserCog,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { can, CurrentUserProvider, Permission, ROLE_LABELS } from '@/lib/permissions';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // If this is the login page, render children directly without dashboard sidebar
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecking(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hr_hub_token');
      const savedUser = localStorage.getItem('hr_hub_user');

      if (!token) {
        // Not authenticated -> redirect to CMS login
        router.replace('/admin/login');
        return;
      }

      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {}
      }

      // Verify token with backend
      api.getMe()
        .then((res: any) => {
          if (res.success && res.user) {
            setCurrentUser(res.user);
            localStorage.setItem('hr_hub_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Token invalid or expired
          localStorage.removeItem('hr_hub_token');
          localStorage.removeItem('hr_hub_user');
          router.replace('/admin/login');
        })
        .finally(() => {
          setAuthChecking(false);
        });
    }
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    if (confirm('Keluar dari CMS MRA HR HUB?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hr_hub_token');
        localStorage.removeItem('hr_hub_user');
      }
      api.logout().catch(() => {});
      router.replace('/admin/login');
    }
  };

  // 1. If currently on /admin/login, bypass dashboard shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 2. If checking authentication, show elegant spinner
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <p className="text-xs text-slate-400 font-medium">Memverifikasi otentikasi CMS...</p>
      </div>
    );
  }

  const allNavigation: { name: string; href: string; icon: React.ElementType; permission: Permission }[] = [
    { name: 'Dashboard Eksekutif', href: '/admin', icon: LayoutDashboard, permission: 'dashboard.view' },
    { name: 'Pipeline Pelamar', href: '/admin/pipeline', icon: KanbanSquare, permission: 'pipeline.view' },
    { name: 'Database & Profiling', href: '/admin/candidates', icon: Users, permission: 'candidate.view' },
    { name: 'Template & Bulk Ingest', href: '/admin/templates', icon: FileSpreadsheet, permission: 'candidate.import' },
    { name: 'Kelola Lowongan ATS', href: '/admin/jobs', icon: Briefcase, permission: 'jobs.manage' },
    { name: 'User & Hak Akses', href: '/admin/users', icon: UserCog, permission: 'users.manage' }
  ];
  const navigation = allNavigation.filter((item) => can(currentUser, item.permission));

  // Route guard: the most specific nav entry matching the current path decides access
  const routeItem = [...allNavigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')));
  const accessDenied = !!routeItem && !can(currentUser, routeItem.permission);

  const getInitials = (name?: string) => {
    if (!name) return 'HR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white">HR HUB</h1>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">
                Recruiter Cockpit
              </span>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Sidebar with User Monogram & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          Buka Portal Publik
        </Link>

        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              {getInitials(currentUser?.name)}
            </div>
            <div className="text-[11px] min-w-0 truncate">
              <p className="font-bold text-white truncate" title={currentUser?.name}>
                {currentUser?.name || 'HR Administrator'}
              </p>
              <p className="text-[10px] text-blue-400 font-semibold truncate">
                {ROLE_LABELS[currentUser?.role] || currentUser?.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Keluar dari CMS"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col justify-between border-r border-slate-800 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Off-Canvas Drawer Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-72 max-w-[82vw] bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 z-10 h-full shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="hidden sm:inline">MRA Group HR CMS</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-blue-600 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">ATS Cockpit</span> Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="http://localhost:5006/api/templates/download"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Master</span> Template (.xlsx)
            </a>

            {/* Quick Header Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Keluar dari CMS"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <CurrentUserProvider user={currentUser}>
            {accessDenied ? (
              <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-4">Akses Dibatasi</h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  Role <b>{ROLE_LABELS[currentUser?.role] || currentUser?.role}</b> tidak memiliki izin untuk membuka{' '}
                  <b>{routeItem?.name}</b>. Hubungi Super Admin bila Anda memerlukan akses.
                </p>
                {navigation[0] && (
                  <Link
                    href={navigation[0].href}
                    className="inline-flex mt-5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Kembali ke {navigation[0].name}
                  </Link>
                )}
              </div>
            ) : (
              children
            )}
          </CurrentUserProvider>
        </main>
      </div>
    </div>
  );
}
