'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Notify = (tone: 'success' | 'error', message: string) => void;

/** Loads stage approvals and exposes decide / cancel actions; `onChanged` refreshes the board */
export function useApprovals(notify: Notify, onChanged: () => void) {
  const [data, setData] = useState<{ toDecide: any[]; myRequests: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getApprovals();
      if (res.success) setData(res.data);
    } catch {
      // Non-critical: the board still works without the approvals panel
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (requestId: string, decision: 'APPROVE' | 'REJECT', note: string) => {
    try {
      const res = await api.decideApproval(requestId, decision, note);
      notify('success', res.message);
    } catch (err: any) {
      notify('error', err.message);
    }
    await load();
    onChanged();
  };

  const cancel = async (requestId: string) => {
    try {
      const res = await api.cancelApproval(requestId);
      notify('success', res.message);
    } catch (err: any) {
      notify('error', err.message);
    }
    await load();
    onChanged();
  };

  return { data, loading, load, decide, cancel, toDecideCount: data?.toDecide.length || 0 };
}
