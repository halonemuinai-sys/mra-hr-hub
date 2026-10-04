// Talent Acquisition ownership rules — mirrors backend/controllers/assignmentController.js
import { can, CmsUser } from '@/lib/permissions';

export type { CmsUser };

export type OwnerScope = 'me' | 'unassigned' | 'all';

/** Can move / assign anyone's candidates (TA Lead) */
export const isLead = (u: CmsUser | null) => can(u, 'pipeline.assign');

/** Strict ownership: move.any moves anything; move.own moves own or unassigned (auto-claim) */
export function canMove(user: CmsUser | null, app: any) {
  if (can(user, 'pipeline.move.any')) return true;
  if (!can(user, 'pipeline.move.own')) return false;
  if (!app.assignedRecruiterId) return can(user, 'pipeline.claim');
  return app.assignedRecruiterId === user?.id;
}

export const canClaim = (user: CmsUser | null, app: any) => can(user, 'pipeline.claim') && !app.assignedRecruiterId;

export const canRelease = (user: CmsUser | null, app: any) =>
  !!app.assignedRecruiterId &&
  (can(user, 'pipeline.assign') || (can(user, 'pipeline.claim') && app.assignedRecruiterId === user?.id));

/** Recruiters land on their own candidates; leads & viewers see the whole team */
export const defaultScope = (user: CmsUser | null): OwnerScope =>
  can(user, 'pipeline.claim') && !can(user, 'pipeline.assign') ? 'me' : 'all';

/** Short display name without the "(Title)" suffix used in seeded accounts */
export const shortName = (name?: string) => (name || '').replace(/\s*\(.*\)\s*$/, '');
