/**
 * Single-candidate stage moves through the stage gate.
 *   GET  /api/candidates/applications/:applicationId/transition?to=STAGE  → what the move requires
 *   POST /api/candidates/applications/:applicationId/transition           → execute or request approval
 */
const prisma = require('../api/db');
const { evaluateTransition } = require('../services/stageGateService');
const { loadApplicationForGate, applyStageChange, pickStageData } = require('../services/stageMoveService');
const { canMoveApplication, resolveMovePermission } = require('./assignmentController');
const { canAccessJob } = require('../services/hiringManagerScope');
const { later, notifyInterview, INTERVIEW_STAGES } = require('../services/mail/applicantMail');

const OWNERSHIP_BLOCK = 'This candidate is owned by another recruiter — only the owner or a TA Lead can change the stage.';
const PENDING_BLOCK = 'This candidate has a stage move awaiting approval.';

function gateBlocks(app, user, evaluation) {
  const blocks = [...evaluation.blocks];
  if (app.stageRequests.length) blocks.unshift(PENDING_BLOCK);
  if (!canMoveApplication(user, app).allowed) blocks.unshift(OWNERSHIP_BLOCK);
  return blocks;
}

async function previewTransition(req, res) {
  try {
    const app = await loadApplicationForGate(req.params.applicationId);
    if (!app || !canAccessJob(req.user, app.job)) return res.status(404).json({ success: false, message: 'Application not found.' });

    const evaluation = evaluateTransition({ app, toStatus: req.query.to, data: {}, user: req.user });
    return res.json({
      success: true,
      data: {
        ...evaluation,
        errors: [], // nothing submitted yet
        blocks: gateBlocks(app, req.user, evaluation),
        candidate: app.candidate,
        job: app.job
      }
    });
  } catch (error) {
    console.error('Error previewing transition:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function executeTransition(req, res) {
  try {
    const { toStatus, data = {} } = req.body;
    const app = await loadApplicationForGate(req.params.applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    const evaluation = evaluateTransition({ app, toStatus, data, user: req.user });
    const blocks = gateBlocks(app, req.user, evaluation);
    if (blocks.length) return res.status(409).json({ success: false, message: blocks[0], data: { blocks } });
    if (evaluation.errors.length) {
      return res.status(422).json({ success: false, message: evaluation.errors[0], data: { errors: evaluation.errors } });
    }

    // Claims an unassigned card for a recruiter (race-safe); re-checks ownership
    const { deniedIds } = await resolveMovePermission(req.user, [app.id]);
    if (deniedIds.length) return res.status(409).json({ success: false, message: OWNERSHIP_BLOCK });

    const stageData = pickStageData(evaluation);
    const reason = evaluation.values.reason || null;

    if (evaluation.approval) {
      const request = await prisma.$transaction(async (tx) => {
        const created = await tx.stageRequest.create({
          data: {
            applicationId: app.id,
            requestedById: req.user.id,
            fromStatus: app.status,
            toStatus,
            stageData,
            reason,
            approvalPermission: evaluation.approval.permission,
            approvalReason: evaluation.approval.message
          }
        });
        await tx.applicationActivity.create({
          data: {
            applicationId: app.id,
            actorId: req.user.id,
            action: 'APPROVAL_REQUESTED',
            fromStatus: app.status,
            toStatus,
            note: evaluation.approval.message,
            stageData
          }
        });
        return created;
      });
      return res.status(202).json({
        success: true,
        pending: true,
        message: `Sent for approval: ${evaluation.approval.message}`,
        data: { requestId: request.id }
      });
    }

    await prisma.$transaction((tx) =>
      applyStageChange(tx, { app, toStatus, actorId: req.user.id, note: reason, stageData })
    );
    if (INTERVIEW_STAGES.includes(toStatus)) later(() => notifyInterview(app.id, { stage: toStatus, schedule: stageData || {}, actorId: req.user.id }));
    return res.json({ success: true, pending: false, message: `${app.candidate.fullName} moved.` });
  } catch (error) {
    console.error('Error executing transition:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { previewTransition, executeTransition };
