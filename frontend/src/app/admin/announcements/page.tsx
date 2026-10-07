'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Megaphone, PartyPopper } from 'lucide-react';
import { api } from '@/lib/api';
import { can, useCurrentUser } from '@/lib/permissions';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';

const WEEK = 7 * 86400000;

export default function AnnouncementsPage() {
  const user = useCurrentUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAnnouncements(60)
      .then((res: any) => setItems(res.data || []))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const cutoff = Date.now() - WEEK;
    return [
      { title: 'This week', rows: items.filter((i) => new Date(i.announcedAt).getTime() >= cutoff) },
      { title: 'Earlier', rows: items.filter((i) => new Date(i.announcedAt).getTime() < cutoff) }
    ].filter((g) => g.rows.length);
  }, [items]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            Welcome Aboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">New employees hired through MRA Group recruitment.</p>
        </div>
        {can(user, 'employee.manage') && (
          <Link
            href="/admin/employees"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto"
          >
            Manage new employees
          </Link>
        )}
      </div>

      {error && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{error}</p>}

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : !items.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <PartyPopper className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800 mt-2">No announcements yet</p>
          <p className="text-xs text-slate-500 mt-1">New employees appear here once the TA team registers and announces them.</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.title} className="space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {g.title} <span className="text-slate-400">· {g.rows.length}</span>
            </h2>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {g.rows.map((item) => (
                <AnnouncementCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
