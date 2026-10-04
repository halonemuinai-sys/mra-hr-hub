'use client';

import React, { createContext, useContext } from 'react';

/**
 * Permission keys — resolved per role on the backend (backend/config/permissions.js)
 * and delivered on the user object from /api/auth/login and /api/auth/me.
 */
export type Permission =
  | 'dashboard.view'
  | 'pipeline.view'
  | 'pipeline.claim'
  | 'pipeline.move.own'
  | 'pipeline.move.any'
  | 'pipeline.assign'
  | 'candidate.view'
  | 'candidate.evaluate'
  | 'candidate.import'
  | 'candidate.delete'
  | 'jobs.manage'
  | 'users.manage';

export type CmsUser = {
  id: string;
  name: string;
  email?: string;
  role: string;
  permissions?: Permission[];
};

export function can(user: CmsUser | null | undefined, permission: Permission) {
  return !!user?.permissions?.includes(permission);
}

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  HR_ADMIN: 'TA Lead / HR Admin',
  RECRUITER: 'Talent Acquisition',
  HIRING_MANAGER: 'Hiring Manager'
};

const CurrentUserContext = createContext<CmsUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: CmsUser | null; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

/** Verified CMS user (set by the admin layout auth guard) */
export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
