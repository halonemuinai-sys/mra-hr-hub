'use client';

import { useRef, useState } from 'react';

/**
 * Multi-select for board cards: click toggles, Shift+click selects a range within the
 * same column, a column checkbox toggles the whole column. Callers pass the column's cards,
 * so the hook can be declared before the board data is derived.
 */
export function usePipelineSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClicked = useRef<string | null>(null);

  const toggleSelect = (app: any, shiftKey: boolean, column: any[]) => {
    // Read the anchor now: React runs the updater later, after lastClicked has moved on
    const anchor = lastClicked.current;
    lastClicked.current = app.id;
    setSelected((prev) => {
      const next = new Set(prev);
      const anchorIdx = anchor ? column.findIndex((a) => a.id === anchor) : -1;
      if (shiftKey && anchorIdx >= 0) {
        const idx = column.findIndex((a) => a.id === app.id);
        const [from, to] = anchorIdx < idx ? [anchorIdx, idx] : [idx, anchorIdx];
        column.slice(from, to + 1).forEach((a) => next.add(a.id));
      } else if (next.has(app.id)) {
        next.delete(app.id);
      } else {
        next.add(app.id);
      }
      return next;
    });
  };

  const toggleSelectColumn = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const all = ids.every((id) => next.has(id));
      ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  return { selected, setSelected, toggleSelect, toggleSelectColumn };
}
