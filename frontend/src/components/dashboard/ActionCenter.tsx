'use client';

import React from 'react';
import { BellRing } from 'lucide-react';
import { useReminders } from '@/components/notifications/useReminders';
import ReminderList from '@/components/notifications/ReminderList';
import DashboardCard from './DashboardCard';

/** Dashboard twin of the header bell — same reminders, always visible */
export default function ActionCenter({ userId }: { userId?: string }) {
  const { items, loading } = useReminders(userId);
  const critical = items.filter((r) => r.severity === 'critical').length;

  return (
    <DashboardCard
      title="Action Center"
      subtitle={items.length ? `${items.length} hal perlu ditindaklanjuti${critical ? ` · ${critical} mendesak` : ''}` : 'Pengingat tindakan Anda'}
      icon={BellRing}
      className="h-full"
    >
      <div className="max-h-[300px] overflow-y-auto -mr-1 pr-1">
        <ReminderList items={items} loading={loading} />
      </div>
    </DashboardCard>
  );
}
