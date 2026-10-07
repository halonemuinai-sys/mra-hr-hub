'use client';

import { useEffect } from 'react';

/** Refresh visible job lists after returning from another tab and while open. */
export function useJobRefresh(load: () => Promise<void>) {
  useEffect(() => {
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try { await load(); } finally { pending = false; }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);
}
