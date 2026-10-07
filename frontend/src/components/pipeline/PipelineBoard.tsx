'use client';

import React from 'react';
import PipelineColumn from './PipelineColumn';
import PipelineCard from './PipelineCard';
import { Stage } from './stages';
import { canClaim, canMove, CmsUser } from './ownership';

interface Props {
  stages: Stage[];
  grouped: Record<string, any[]>;
  loading: boolean;
  user: CmsUser | null;
  selected: Set<string>;
  draggingIds: string[];
  busyIds: Set<string>;
  /** Ids a drag of a selected card carries (the movable part of the selection) */
  movableSelectedIds: string[];
  onToggleSelect: (app: any, shiftKey: boolean, column: any[]) => void;
  onToggleSelectColumn: (ids: string[]) => void;
  onMove: (ids: string[], status: string) => void;
  onClaim: (id: string) => void;
  onOpen: (app: any) => void;
  onDragStart: (ids: string[]) => void;
  onDragEnd: () => void;
}

/** Kanban columns and cards; all state and actions come from the page */
export default function PipelineBoard({
  stages,
  grouped,
  loading,
  user,
  selected,
  draggingIds,
  busyIds,
  movableSelectedIds,
  onToggleSelect,
  onToggleSelectColumn,
  onMove,
  onClaim,
  onOpen,
  onDragStart,
  onDragEnd
}: Props) {
  const selectionMode = selected.size > 0;

  return (
    <div className={`flex gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 ${selectionMode ? 'pb-24' : 'pb-4'}`}>
      {stages.map((stage) => {
        const items = grouped[stage.key] || [];
        return (
          <PipelineColumn
            key={stage.key}
            stage={stage}
            items={items}
            loading={loading}
            selectedCount={items.filter((a) => selected.has(a.id)).length}
            onToggleSelectAll={() => onToggleSelectColumn(items.map((a) => a.id))}
            onDropIds={(ids) => onMove(ids, stage.key)}
          >
            {items.map((app) => (
              <PipelineCard
                key={app.id}
                app={app}
                selected={selected.has(app.id)}
                selectionMode={selectionMode}
                dragging={draggingIds.includes(app.id)}
                busy={busyIds.has(app.id)}
                movable={canMove(user, app)}
                claimable={canClaim(user, app)}
                currentUserId={user?.id}
                onClaim={() => onClaim(app.id)}
                onToggleSelect={(shift) => onToggleSelect(app, shift, items)}
                onDragStart={(e) => {
                  // Dragging a selected card carries the whole (movable) selection
                  const ids = selected.has(app.id) ? movableSelectedIds : [app.id];
                  e.dataTransfer.setData('application/x-hrhub-ids', JSON.stringify(ids));
                  e.dataTransfer.effectAllowed = 'move';
                  onDragStart(ids);
                }}
                onDragEnd={onDragEnd}
                onOpen={() => onOpen(app)}
                onMove={(status) => onMove([app.id], status)}
              />
            ))}
          </PipelineColumn>
        );
      })}
    </div>
  );
}
