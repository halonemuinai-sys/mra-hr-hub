'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PartyPopper } from 'lucide-react';
import { api } from '@/lib/api';
import DashboardCard from './DashboardCard';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';

/** Latest "Welcome Aboard" announcements */
export default function NewColleagues({ className = '' }: { className?: string }) {
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    api.getAnnouncements(5)
      .then((res: any) => setItems(res.data || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <DashboardCard
      title="Welcome Aboard"
      subtitle="Recently announced new employees"
      icon={PartyPopper}
      className={className}
      action={<Link href="/admin/announcements" className="text-[11px] font-bold text-blue-600 hover:text-blue-800">View all →</Link>}
    >
      {items === null ? (
        <div className="h-[160px] rounded-xl bg-slate-100 animate-pulse" />
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">No new employees have been announced yet.</p>
      ) : (
        <div className="divide-y divide-slate-100 -my-2.5">
          {items.map((i) => (
            <AnnouncementCard key={i.id} item={i} compact />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
