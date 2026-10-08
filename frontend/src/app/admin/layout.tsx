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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  RefreshCw,
  KanbanSquare,
  UserCog,
  Lock,
  Activity,
  BadgeCheck,
  Megaphone,
  History,
  Building2,
  ClipboardList,
  CalendarDays,
  ListChecks,
  FileSignature,
  UserSearch
} from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { api } from '@/lib/api';
import { can, CurrentUserProvider, Permission, ROLE_LABELS } from '@/lib/permissions';
import NotificationBell from '@/components/notifications/NotificationBell';
import IdentityToggle from '@/components/privacy/IdentityToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // If this is the login page, render children directly without dashboard sidebar
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    try {
      setSidebarHidden(localStorage.getItem('hr_hub_sidebar_hidden') === 'true');
    } catch {
      // Navigation remains available when browser storage is disabled.
    }
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeMobileSidebar = () => {
      if (desktop.matches) setSidebarOpen(false);
    };
    desktop.addEventListener('change', closeMobileSidebar);
    return () => desktop.removeEventListener('change', closeMobileSidebar);
  }, []);

  const toggleDesktopSidebar = () => {
    const hidden = !sidebarHidden;
    setSidebarHidden(hidden);
    try {
      localStorage.setItem('hr_hub_sidebar_hidden', String(hidden));
    } catch {
      // Saving the preference is optional.
    }
  };

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
  }, [isLoginPage, router]);

  const handleLogout = () => {
    if (confirm('Log out of MRA HR HUB CMS?')) {
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
        <p className="text-xs text-slate-400 font-medium">Verifying CMS authentication...</p>
      </div>
    );
  }

  const allNavigation: { name: string; href: string; icon: React.ElementType; permission: Permission }[] = [
    { name: 'Recruitment Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'dashboard.view' },
    { name: 'Applicant Pipeline', href: '/admin/pipeline', icon: KanbanSquare, permission: 'pipeline.view' },
    { name: 'Database & Profiles', href: '/admin/candidates', icon: Users, permission: 'candidate.view' },
    { name: 'Templates & Bulk Import', href: '/admin/templates', icon: FileSpreadsheet, permission: 'candidate.import' },
    { name: 'Manage ATS Jobs', href: '/admin/jobs', icon: Briefcase, permission: 'jobs.manage' },
    { name: 'Talent Pool Matching', href: '/admin/talent-pool', icon: UserSearch, permission: 'pipeline.claim' },
    { name: 'Interview Calendar', href: '/admin/interviews', icon: CalendarDays, permission: 'pipeline.view' },
    { name: 'Offer Letters', href: '/admin/offers', icon: FileSignature, permission: 'pipeline.view' },
    { name: 'Manpower Requests', href: '/admin/manpower', icon: ClipboardList, permission: 'manpower.view' },
    { name: 'New Employees', href: '/admin/employees', icon: BadgeCheck, permission: 'employee.view' },
    { name: 'Onboarding', href: '/admin/onboarding', icon: ListChecks, permission: 'employee.view' },
    { name: 'Announcements', href: '/admin/announcements', icon: Megaphone, permission: 'dashboard.view' },
    { name: 'TA Team Performance', href: '/admin/team', icon: Activity, permission: 'team.monitor' },
    { name: 'Team Activity Log', href: '/admin/activity', icon: History, permission: 'team.monitor' },
    { name: 'Users & Access', href: '/admin/users', icon: UserCog, permission: 'users.manage' },
    { name: 'Companies (PT)', href: '/admin/companies', icon: Building2, permission: 'company.manage' }
  ];
  const navigation = allNavigation.filter((item) => can(currentUser, item.permission));

  // Route guard: the most specific nav entry matching the current path decides access
  const routeItem = [...allNavigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')));
  // A user object without a permissions list comes from an outdated backend or a stale session —
  // don't present that as "no access"
  const permissionsMissing = !!currentUser && !Array.isArray(currentUser.permissions);
  const accessDenied = !permissionsMissing && !!routeItem && !can(currentUser, routeItem.permission);

  const getInitials = (name?: string) => {
    if (!name) return 'HR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navigationGroups = [
    { label: 'Recruitment', paths: ['/admin', '/admin/pipeline', '/admin/candidates', '/admin/jobs', '/admin/talent-pool', '/admin/interviews', '/admin/offers', '/admin/manpower'] },
    { label: 'People', paths: ['/admin/employees', '/admin/onboarding', '/admin/announcements', '/admin/team', '/admin/activity'] },
    { label: 'Administration', paths: ['/admin/templates', '/admin/users', '/admin/companies'] }
  ];

  const renderSidebar = (mobile = false) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5">
        <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400" aria-label="HR Hub home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/15 text-blue-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-white">HR HUB</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">MRA Group</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={mobile ? () => setSidebarOpen(false) : toggleDesktopSidebar}
          aria-label={mobile ? 'Close navigation' : 'Hide sidebar'}
          title={mobile ? 'Close navigation' : 'Hide sidebar'}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          {mobile ? <X className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {navigationGroups.map((group) => {
          const items = navigation.filter((item) => group.paths.includes(item.href));
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{group.label}</p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = routeItem?.href === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 ${
                          isActive
                            ? 'bg-blue-500/15 text-blue-100 ring-1 ring-inset ring-blue-400/20'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                        }`}
                      >
                        {isActive && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-blue-400" />}
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <span className="flex-1 leading-relaxed">{item.name}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-400" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-4 border-t border-white/10 p-4">
        <Link href="/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-blue-400">
          Open Public Portal
          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
        </Link>
        <div className="flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xs font-semibold text-slate-200">
            {getInitials(currentUser?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-100" title={currentUser?.name}>{currentUser?.name || 'HR Administrator'}</p>
            <p className="mt-0.5 truncate text-[10px] text-slate-400" title={ROLE_LABELS[currentUser?.role] || currentUser?.role}>{ROLE_LABELS[currentUser?.role] || currentUser?.role}</p>
          </div>
          <button type="button" onClick={handleLogout} aria-label="Log out of CMS" title="Log out of CMS" className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-blue-400">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh bg-slate-100 overflow-hidden">
      {/* Desktop navigation is fully removed from the tab order when hidden. */}
      <aside id="desktop-sidebar" aria-label="Sidebar" className={`${sidebarHidden ? 'hidden' : 'hidden md:flex'} w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-white`}>
        {renderSidebar()}
      </aside>

      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 md:hidden">
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            id="mobile-sidebar"
            className="h-full w-80 max-w-[88vw] bg-slate-900 text-white shadow-2xl transition duration-200 ease-out data-[closed]:-translate-x-full motion-reduce:transition-none"
          >
            <DialogTitle className="sr-only">Main navigation</DialogTitle>
            {renderSidebar(true)}
          </DialogPanel>
        </div>
      </Dialog>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={toggleDesktopSidebar}
              aria-label={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
              title={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
              aria-expanded={!sidebarHidden}
              aria-controls="desktop-sidebar"
              className="hidden rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-500 md:inline-flex"
            >
              {sidebarHidden ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <div className="hidden sm:block">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Workspace</p>
              <p className="text-xs font-semibold text-slate-800">{routeItem?.name || 'HR Hub'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <IdentityToggle />
            {!permissionsMissing && <NotificationBell userId={currentUser?.id} pathname={pathname} />}
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
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Log out of CMS"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
              <span className="hidden md:inline">Log out</span>
            </button>
          </div>
        </header>

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <CurrentUserProvider user={currentUser}>
            {permissionsMissing ? (
              <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-4">Session Refresh Required</h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  Your account permissions have not loaded. Make sure the backend server is up to date, then log in again.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('hr_hub_token');
                    localStorage.removeItem('hr_hub_user');
                    router.replace('/admin/login');
                  }}
                  className="inline-flex mt-5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Log In Again
                </button>
              </div>
            ) : accessDenied ? (
              <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-4">Access Restricted</h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  Role <b>{ROLE_LABELS[currentUser?.role] || currentUser?.role}</b> does not have permission to access{' '}
                  <b>{routeItem?.name}</b>. Contact a Super Admin if you need access.
                </p>
                {navigation[0] && (
                  <Link
                    href={navigation[0].href}
                    className="inline-flex mt-5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Back to {navigation[0].name}
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
