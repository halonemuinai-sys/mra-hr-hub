'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

export type Reminder = {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  count: number;
  href: string;
};

const POLL_MS = 60_000;
const seenKey = (userId?: string) => `hr_hub_reminders_seen_${userId || 'anon'}`;

// A reminder counts as "seen" for a given id + count; a higher count makes it new again
const signature = (r: Reminder) => `${r.id}:${r.count}`;

function readSeen(userId?: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(seenKey(userId)) || '[]');
  } catch {
    return [];
  }
}

/** Polls /api/reminders; tracks seen state per viewer (browser-only convenience) */
export function useReminders(userId?: string, refreshKey?: string) {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [seen, setSeen] = useState<string[]>([]);

  useEffect(() => setSeen(readSeen(userId)), [userId]);

  const load = useCallback(async () => {
    try {
      const res = await api.getReminders();
      if (res.success) setItems(res.data.items || []);
    } catch {
      // Keep the last known list; the bell must never break the layout
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [userId, load, refreshKey]);

  const unseen = useMemo(() => items.filter((r) => !seen.includes(signature(r))), [items, seen]);

  const markAllSeen = useCallback(() => {
    const next = items.map(signature);
    setSeen(next);
    try {
      localStorage.setItem(seenKey(userId), JSON.stringify(next));
    } catch {}
  }, [items, userId]);

  return {
    items,
    loading,
    reload: load,
    unseenCount: unseen.length,
    isUnseen: (r: Reminder) => !seen.includes(signature(r)),
    markAllSeen
  };
}
