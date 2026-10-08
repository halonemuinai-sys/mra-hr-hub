/**
 * GET /api/reminders — action items for the signed-in user (header bell + dashboard Action Center).
 * Computed on the fly from live data; nothing is stored. "Seen" state is kept per viewer in the browser.
 *
 * Item: { id, severity: 'critical' | 'warning' | 'info', title, detail, count, href }
 * `id` is stable per reminder type so the client can tell new items from seen ones.
 */
const prisma = require('../api/db');
const { hasPermission, PERMISSIONS } = require('../config/permissions');
const { CLOSED } = require('../config/stageRules');
const { jobScope, applicationScope } = require('../services/hiringManagerScope');
const { buildInterviews } = require('../services/interviewService');

const DAY = 86400000;
const STALE_DAYS = 7;
const CRITICAL_DAYS = 14;
const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

async function getReminders(req, res) {
  try {
    const user = req.user;
    const now = Date.now();
    const items = [];
    const isLead = hasPermission(user, 'pipeline.assign');
    const canClaim = hasPermission(user, 'pipeline.claim');

    // 1. Approvals waiting for my decision
    const approvalKeys = PERMISSIONS.filter((p) => p.key.startsWith('approval.') && hasPermission(user, p.key)).map((p) => p.key);
    if (approvalKeys.length) {
      const pending = await prisma.stageRequest.findMany({
        where: {
          status: 'PENDING',
          approvalPermission: { in: approvalKeys },
          ...(jobScope(user) ? { application: { job: jobScope(user) } } : {})
        },
        select: { createdAt: true, toStatus: true }
      });
      if (pending.length) {
        const oldest = Math.max(...pending.map((p) => now - new Date(p.createdAt)));
        items.push({
          id: 'approvals-to-decide',
          severity: 'critical',
          title: `${plural(pending.length, 'approval')} awaiting your decision`,
          detail: `Offer / hire confirmation. Oldest: ${Math.max(1, Math.round(oldest / DAY))} days.`,
          count: pending.length,
          href: '/admin/pipeline?view=approvals'
        });
      }
    }

    // 2. Stalled candidates (mine for recruiters, whole team for leads)
    if (canClaim || isLead) {
      const stale = await prisma.jobApplication.findMany({
        where: {
          status: { notIn: [...CLOSED] },
          stageChangedAt: { lt: new Date(now - STALE_DAYS * DAY) },
          ...(isLead ? {} : { assignedRecruiterId: user.id })
        },
        select: { stageChangedAt: true }
      });
      if (stale.length) {
        const critical = stale.filter((a) => now - new Date(a.stageChangedAt) >= CRITICAL_DAYS * DAY).length;
        items.push({
          id: isLead ? 'stale-team' : 'stale-mine',
          severity: critical ? 'critical' : 'warning',
          title: isLead
            ? `${plural(stale.length, 'candidate')} on the team stalled ≥${STALE_DAYS} days`
            : `${plural(stale.length, 'candidate')} assigned to you stalled ≥${STALE_DAYS} days`,
          detail: critical ? `${critical} have had no progress for ≥${CRITICAL_DAYS} days.` : 'Follow up or move them to the next stage.',
          count: stale.length,
          href: '/admin/pipeline?filter=stale'
        });
      }
    }

    // 3. Unassigned queue
    if (canClaim) {
      const queue = await prisma.jobApplication.findMany({
        where: { assignedRecruiterId: null, status: { notIn: [...CLOSED] } },
        select: { appliedAt: true }
      });
      if (queue.length) {
        const waitingLong = queue.filter((a) => now - new Date(a.appliedAt) >= 2 * DAY).length;
        items.push({
          id: 'unassigned-queue',
          severity: waitingLong ? 'warning' : 'info',
          title: `${plural(queue.length, 'applicant')} unassigned`,
          detail: waitingLong ? `${waitingLong} have been waiting for more than 2 days.` : 'Claim applicants from the queue to start processing.',
          count: queue.length,
          href: '/admin/pipeline?scope=unassigned'
        });
      }
    }

    // 4. Interviews in the next 48 hours (stage-gate schedule, incl. reschedules — services/interviewService.js)
    const interviewApps = await prisma.jobApplication.findMany({
      where: {
        status: { in: ['INTERVIEW_HR', 'INTERVIEW_USER'] },
        ...(isLead || hasPermission(user, 'approval.hire') ? applicationScope(user) : { assignedRecruiterId: user.id })
      },
      select: {
        id: true,
        status: true,
        activities: {
          where: { action: { in: ['STAGE_CHANGE', 'INTERVIEW_SCHEDULED'] } },
          orderBy: { createdAt: 'asc' },
          select: { id: true, action: true, toStatus: true, stageData: true, createdAt: true }
        }
      }
    });
    const upcoming = buildInterviews(interviewApps, new Date(now))
      .events.filter((e) => e.current)
      .map((e) => new Date(e.start).getTime())
      .filter((t) => t >= now - 2 * 3600000 && t <= now + 2 * DAY);
    if (upcoming.length) {
      const next = new Date(Math.min(...upcoming));
      items.push({
        id: 'interviews-48h',
        severity: 'info',
        title: `${plural(upcoming.length, 'interview')} in the next 48 hours`,
        detail: `Next: ${next.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`,
        count: upcoming.length,
        href: '/admin/interviews'
      });
    }

    // 5. My approval requests decided in the last 3 days
    const decided = await prisma.stageRequest.findMany({
      where: { requestedById: user.id, status: { in: ['APPROVED', 'REJECTED'] }, decidedAt: { gte: new Date(now - 3 * DAY) } },
      select: { status: true }
    });
    if (decided.length) {
      const rejected = decided.filter((d) => d.status === 'REJECTED').length;
      items.push({
        id: 'my-requests-decided',
        severity: rejected ? 'warning' : 'info',
        title: `${plural(decided.length, 'approval request')} from you have been reviewed`,
        detail: rejected ? `${rejected} rejected — check the approver's notes.` : 'All approved.',
        count: decided.length,
        href: '/admin/pipeline?view=approvals'
      });
    }

    // 6. New applicants in the last 24 hours (leads)
    if (isLead) {
      const fresh = await prisma.jobApplication.count({ where: { appliedAt: { gte: new Date(now - DAY) } } });
      if (fresh) {
        items.push({
          id: 'new-applicants-24h',
          severity: 'info',
          title: `${plural(fresh, 'application')} received in the last 24 hours`,
          detail: 'Make sure they are assigned to the TA team.',
          count: fresh,
          href: '/admin/pipeline?scope=unassigned'
        });
      }
    }

    // 7. Hires not registered as employees yet (mine for recruiters, all for leads)
    if (hasPermission(user, 'employee.manage')) {
      const unregistered = await prisma.jobApplication.findMany({
        where: { status: 'HIRED', employee: null, ...(isLead ? {} : { assignedRecruiterId: user.id }) },
        select: { stageChangedAt: true }
      });
      if (unregistered.length) {
        const oldest = Math.max(...unregistered.map((a) => now - new Date(a.stageChangedAt)));
        items.push({
          id: 'hires-to-register',
          severity: oldest >= STALE_DAYS * DAY ? 'warning' : 'info',
          title: `${plural(unregistered.length, 'hired candidate')} not yet registered as employees`,
          detail: 'Complete employee IDs and placement details, then announce the new hires.',
          count: unregistered.length,
          href: '/admin/employees'
        });
      }
    }

    // 8. New colleagues announced in the last 7 days (everyone)
    const announced = await prisma.employee.findMany({
      where: { announcedAt: { gte: new Date(now - STALE_DAYS * DAY) } },
      orderBy: { announcedAt: 'desc' },
      select: { fullName: true }
    });
    if (announced.length) {
      const names = announced.slice(0, 2).map((e) => e.fullName).join(', ');
      items.push({
        id: 'new-colleagues',
        severity: 'info',
        title: `Welcome aboard: ${names}${announced.length > 2 ? ` +${announced.length - 2}` : ''}`,
        detail: `${plural(announced.length, 'new employee')} announced this week.`,
        count: announced.length,
        href: '/admin/announcements'
      });
    }

    // 9. Manpower requests waiting for my approval (not my own, except Super Admin)
    if (hasPermission(user, 'manpower.approve')) {
      const pendingMpr = await prisma.manpowerRequest.findMany({
        where: { status: 'PENDING', ...(user.role === 'SUPERADMIN' ? {} : { NOT: { requestedById: user.id } }) },
        select: { priority: true, createdAt: true }
      });
      if (pendingMpr.length) {
        const urgent = pendingMpr.filter((m) => m.priority === 'URGENT').length;
        items.push({
          id: 'manpower-to-approve',
          severity: urgent ? 'critical' : 'warning',
          title: `${plural(pendingMpr.length, 'manpower request')} awaiting your approval`,
          detail: urgent ? `${urgent} marked urgent.` : 'Approve or reject the headcount requests.',
          count: pendingMpr.length,
          href: '/admin/manpower?status=PENDING'
        });
      }
    }

    // 10. Approved requests not opened as a job yet (TA Lead)
    if (hasPermission(user, 'jobs.manage')) {
      const toOpen = await prisma.manpowerRequest.count({ where: { status: 'APPROVED', jobId: null } });
      if (toOpen) {
        items.push({
          id: 'manpower-to-open',
          severity: 'info',
          title: `${plural(toOpen, 'approved manpower request')} without a job posting`,
          detail: 'Open them as job postings to start recruiting.',
          count: toOpen,
          href: '/admin/manpower?status=APPROVED'
        });
      }
    }

    // 11. My requests decided in the last 3 days
    const myDecided = await prisma.manpowerRequest.findMany({
      where: { requestedById: user.id, status: { in: ['APPROVED', 'REJECTED'] }, decidedAt: { gte: new Date(now - 3 * DAY) } },
      select: { status: true }
    });
    if (myDecided.length) {
      const rejectedMpr = myDecided.filter((m) => m.status === 'REJECTED').length;
      items.push({
        id: 'my-manpower-decided',
        severity: rejectedMpr ? 'warning' : 'info',
        title: myDecided.length === 1 ? 'Your manpower request was decided' : `${myDecided.length} of your manpower requests were decided`,
        detail: rejectedMpr ? `${rejectedMpr} rejected — see the approver's note.` : 'Approved.',
        count: myDecided.length,
        href: '/admin/manpower?mine=1'
      });
    }

    // 12. Overdue onboarding tasks (HR & TA: all; Hiring Managers: line-manager tasks of their new hires)
    const canOnboard = hasPermission(user, 'employee.manage');
    if (canOnboard || user.role === 'HIRING_MANAGER') {
      const today = new Date(new Date(now).toISOString().slice(0, 10) + 'T00:00:00Z');
      const overdueTasks = await prisma.onboardingTask.findMany({
        where: {
          status: 'TODO',
          dueDate: { lt: today },
          ...(canOnboard ? {} : { owner: 'MANAGER', employee: { job: jobScope(user) || {} } })
        },
        select: { employeeId: true }
      });
      if (overdueTasks.length) {
        const people = new Set(overdueTasks.map((t) => t.employeeId)).size;
        items.push({
          id: 'onboarding-overdue',
          severity: 'warning',
          title: `${plural(overdueTasks.length, 'onboarding task')} overdue`,
          detail: `For ${plural(people, 'new employee')}.`,
          count: overdueTasks.length,
          href: '/admin/onboarding?filter=overdue'
        });
      }

      // 13. Probation ending within 14 days
      const soon = await prisma.employee.findMany({
        where: {
          employmentStatus: 'PROBATION',
          probationEndDate: { gte: today, lte: new Date(today.getTime() + 14 * DAY) },
          ...(canOnboard ? {} : { job: jobScope(user) || {} })
        },
        select: { fullName: true }
      });
      if (soon.length) {
        items.push({
          id: 'probation-ending',
          severity: 'info',
          title: `Probation ends within 14 days: ${soon.slice(0, 2).map((e) => e.fullName).join(', ')}${soon.length > 2 ? ` +${soon.length - 2}` : ''}`,
          detail: 'Hold the probation review and record the decision.',
          count: soon.length,
          href: '/admin/onboarding?filter=probation'
        });
      }
    }

    items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    return res.json({ success: true, data: { items, generatedAt: new Date(now).toISOString() } });
  } catch (error) {
    console.error('Error building reminders:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getReminders };
