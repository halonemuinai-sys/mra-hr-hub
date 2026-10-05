'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReminders } from './useReminders';
import ReminderList from './ReminderList';

/** Header bell: action reminders for the signed-in user, refreshed every minute and on navigation */
export default function NotificationBell({ userId, pathname }: { userId?: string; pathname: string }) {
  const { items, loading, reload, unseenCount, isUnseen, markAllSeen } = useReminders(userId, pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const critical = items.some((r) => r.severity === 'critical');

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((v) => !v);
    if (!open) markAllSeen();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Pengingat${unseenCount ? ` (${unseenCount} baru)` : ''}`}
        aria-expanded={open}
        className={`relative p-2 rounded-lg border transition-colors ${
          open ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Bell className={`w-4 h-4 ${unseenCount && critical ? 'animate-[wiggle_1s_ease-in-out_2]' : ''}`} />
        {unseenCount > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white tabular-nums ${
              critical ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {unseenCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[min(92vw,380px)] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Pengingat Tindakan</p>
                <p className="text-[11px] text-slate-500">
                  {items.length ? `${items.length} hal perlu ditindaklanjuti` : 'Diperbarui otomatis tiap menit'}
                </p>
              </div>
              <button type="button" onClick={reload} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Muat ulang">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="p-3 max-h-[60vh] overflow-y-auto">
              <ReminderList items={items} loading={loading} isUnseen={isUnseen} onNavigate={() => setOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
