/**
 * Hiring Managers only see — and confirm hires for — the jobs they own.
 * Jobs without an assigned Hiring Manager stay visible to every Hiring Manager,
 * so nothing gets stuck while a job is still unassigned.
 * Every other role is unrestricted (returns null / {}).
 */

const isScopedHiringManager = (user) => user && user.role === 'HIRING_MANAGER';

/** Prisma `JobPosting` where-fragment, or null when the user is not restricted */
function jobScope(user) {
  if (!isScopedHiringManager(user)) return null;
  return { OR: [{ hiringManagerId: user.id }, { hiringManagerId: null }] };
}

/** Prisma `JobApplication` where-fragment ({} when unrestricted) */
function applicationScope(user) {
  const scope = jobScope(user);
  return scope ? { job: scope } : {};
}

/** True when the user may act on an application of this job */
function canAccessJob(user, job) {
  if (!isScopedHiringManager(user)) return true;
  return !job || !job.hiringManagerId || job.hiringManagerId === user.id;
}

module.exports = { isScopedHiringManager, jobScope, applicationScope, canAccessJob };
