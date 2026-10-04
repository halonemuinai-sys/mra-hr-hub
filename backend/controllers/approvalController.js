/**
 * Stage move approvals (offer above budget, hire confirmation).
 *   GET  /api/candidates/approvals                 → { toDecide, myRequests }
 *   POST /api/candidates/approvals/:requestId/decide  { decision: 'APPROVE' | 'REJECT', note }
 *   POST /api/candidates/approvals/:requestId/cancel
 */
const prisma = require('../api/db');
const { hasPermission, PERMISSIONS } = require('../config/permissions');
const { PENDING, applyStageChange } = require('../services/stageMoveService');

const requestInclude = {
  requestedBy: { select: { id: true, name: true } },
  decidedBy: { select: { id: true, name: true } },
  application: {
    select: {
      id: true,
      status: true,
      atsScore: true,
      candidate: { select: { id: true, fullName: true, headline: true } },
      job: { select: { id: true, title: true, salaryMax: true } }
    }
  }
};

const approvalPermissionKeys = PERMISSIONS.filter((p) => p.key.startsWith('approval.')).map((p) => p.key);

async function listApprovals(req, res) {
  try {
    const decidable = approvalPermissionKeys.filter((k) => hasPermission(req.user, k));
    const [toDecide, myRequests] = await Promise.all([
      decidable.length
        ? prisma.stageRequest.findMany({
            where: { status: PENDING, approvalPermission: { in: decidable } },
            orderBy: { createdAt: 'asc' },
            include: requestInclude
          })
        : [],
      prisma.stageRequest.findMany({
        where: { requestedById: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: requestInclude
      })
    ]);
    return res.json({ success: true, data: { toDecide, myRequests } });
  } catch (error) {
    console.error('Error listing approvals:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function decideApproval(req, res) {
  try {
    const { decision, note } = req.body;
    if (!['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be APPROVE or REJECT.' });
    }
    const trimmed = typeof note === 'string' ? note.trim() : '';
    if (decision === 'REJECT' && !trimmed) {
      return res.status(422).json({ success: false, message: 'Add a note explaining the rejection.' });
    }

    const request = await prisma.stageRequest.findUnique({
      where: { id: req.params.requestId },
      include: { application: { select: { id: true, status: true, recruiterNotes: true, candidate: { select: { fullName: true } } } } }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== PENDING) {
      return res.status(409).json({ success: false, message: `This request was already ${request.status.toLowerCase()}.` });
    }
    if (!hasPermission(req.user, request.approvalPermission)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to decide this request.' });
    }

    const app = request.application;
    // The candidate moved elsewhere meanwhile → the request no longer applies
    if (app.status !== request.fromStatus) {
      await prisma.stageRequest.update({
        where: { id: request.id },
        data: { status: 'CANCELLED', decidedById: req.user.id, decidedAt: new Date(), decisionNote: 'Stage changed before decision' }
      });
      return res.status(409).json({ success: false, message: 'The candidate has changed stage since this request — it was cancelled.' });
    }

    const approved = decision === 'APPROVE';
    await prisma.$transaction(async (tx) => {
      // Conditional update guards against two approvers deciding at once
      const claimed = await tx.stageRequest.updateMany({
        where: { id: request.id, status: PENDING },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          decidedById: req.user.id,
          decidedAt: new Date(),
          decisionNote: trimmed || null
        }
      });
      if (!claimed.count) throw Object.assign(new Error('This request was just decided by someone else.'), { status: 409 });

      await tx.applicationActivity.create({
        data: {
          applicationId: app.id,
          actorId: req.user.id,
          action: approved ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
          fromStatus: request.fromStatus,
          toStatus: request.toStatus,
          note: trimmed || null
        }
      });
      if (approved) {
        await applyStageChange(tx, {
          app,
          toStatus: request.toStatus,
          actorId: req.user.id,
          note: request.reason,
          stageData: request.stageData || undefined
        });
      }
    });

    return res.json({
      success: true,
      message: approved
        ? `Approved — ${app.candidate.fullName} moved to ${request.toStatus}.`
        : `Rejected — ${app.candidate.fullName} stays in ${request.fromStatus}.`
    });
  } catch (error) {
    if (error.status === 409) return res.status(409).json({ success: false, message: error.message });
    console.error('Error deciding approval:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function cancelApproval(req, res) {
  try {
    const request = await prisma.stageRequest.findUnique({ where: { id: req.params.requestId } });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== PENDING) return res.status(409).json({ success: false, message: 'Only pending requests can be cancelled.' });
    if (request.requestedById !== req.user.id && !hasPermission(req.user, 'pipeline.assign')) {
      return res.status(403).json({ success: false, message: 'Only the requester or a TA Lead can cancel this request.' });
    }

    await prisma.$transaction([
      prisma.stageRequest.update({
        where: { id: request.id },
        data: { status: 'CANCELLED', decidedById: req.user.id, decidedAt: new Date() }
      }),
      prisma.applicationActivity.create({
        data: {
          applicationId: request.applicationId,
          actorId: req.user.id,
          action: 'APPROVAL_CANCELLED',
          fromStatus: request.fromStatus,
          toStatus: request.toStatus
        }
      })
    ]);
    return res.json({ success: true, message: 'Approval request cancelled.' });
  } catch (error) {
    console.error('Error cancelling approval:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listApprovals, decideApproval, cancelApproval };
