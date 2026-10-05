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

const DAY = 86400000;
const STALE_DAYS = 7;
const CRITICAL_DAYS = 14;
const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

const plural = (n, word) => `${n} ${word}`;

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
        where: { status: 'PENDING', approvalPermission: { in: approvalKeys } },
        select: { createdAt: true, toStatus: true }
      });
      if (pending.length) {
        const oldest = Math.max(...pending.map((p) => now - new Date(p.createdAt)));
        items.push({
          id: 'approvals-to-decide',
          severity: 'critical',
          title: `${plural(pending.length, 'approval')} menunggu keputusan Anda`,
          detail: `Offering / konfirmasi Hired. Tertua ${Math.max(1, Math.round(oldest / DAY))} hari.`,
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
            ? `${plural(stale.length, 'kandidat')} tim tertahan ≥${STALE_DAYS} hari`
            : `${plural(stale.length, 'kandidat')} Anda tertahan ≥${STALE_DAYS} hari`,
          detail: critical ? `${critical} di antaranya sudah ≥${CRITICAL_DAYS} hari tanpa pergerakan.` : 'Tindak lanjuti atau pindahkan tahapnya.',
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
          title: `${plural(queue.length, 'pelamar')} belum diambil`,
          detail: waitingLong ? `${waitingLong} sudah menunggu lebih dari 2 hari.` : 'Ambil dari antrean untuk mulai memproses.',
          count: queue.length,
          href: '/admin/pipeline?scope=unassigned'
        });
      }
    }

    // 4. Interviews in the next 48 hours (schedule comes from the stage-gate form)
    const interviewApps = await prisma.jobApplication.findMany({
      where: {
        status: { in: ['INTERVIEW_HR', 'INTERVIEW_USER'] },
        ...(isLead || hasPermission(user, 'approval.hire') ? {} : { assignedRecruiterId: user.id })
      },
      select: {
        id: true,
        status: true,
        activities: {
          where: { action: 'STAGE_CHANGE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { toStatus: true, stageData: true }
        }
      }
    });
    const upcoming = interviewApps
      .map((a) => {
        const last = a.activities[0];
        const at = last && last.toStatus === a.status && last.stageData && last.stageData.interviewAt;
        return at ? new Date(at).getTime() : null;
      })
      .filter((t) => t && t >= now - 2 * 3600000 && t <= now + 2 * DAY);
    if (upcoming.length) {
      const next = new Date(Math.min(...upcoming));
      items.push({
        id: 'interviews-48h',
        severity: 'info',
        title: `${plural(upcoming.length, 'interview')} dalam 48 jam`,
        detail: `Berikutnya ${next.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`,
        count: upcoming.length,
        href: '/admin/pipeline'
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
        title: `${plural(decided.length, 'permintaan approval')} Anda sudah diputuskan`,
        detail: rejected ? `${rejected} ditolak — cek catatan approver.` : 'Semua disetujui.',
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
          title: `${plural(fresh, 'lamaran')} baru dalam 24 jam`,
          detail: 'Pastikan sudah dibagikan ke tim TA.',
          count: fresh,
          href: '/admin/pipeline?scope=unassigned'
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
