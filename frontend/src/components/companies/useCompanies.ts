'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type Company = {
  id: string;
  code: string;
  name: string;
  npwp?: string | null;
  address?: string | null;
  talentaBranch?: string | null;
  isActive: boolean;
  _count?: { jobs: number; employees: number };
};

/** MRA Group legal entities (PT) for selects and filters */
export function useCompanies(activeOnly = false) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCompanies(activeOnly);
      setCompanies(res.data || []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { companies, loading, reload };
}
