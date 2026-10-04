/**
 * Applies a stage move: updates the application and writes the activity log.
 * Every stage change in the system goes through applyStageChange.
 */
const prisma = require('../api/db');

const PENDING = 'PENDING';

/** Load an application with what the gate needs */
function loadApplicationForGate(id) {
  return prisma.jobApplication.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, salaryMax: true } },
      candidate: { select: { id: true, fullName: true } },
      stageRequests: { where: { status: PENDING }, select: { id: true, toStatus: true }, take: 1 }
    }
  });
}

/**
 * @param {object} tx        prisma client or transaction client
 * @param {object} p
 * @param {object} p.app     application (id, status, recruiterNotes)
 * @param {string} p.toStatus
 * @param {string} p.actorId
 * @param {string} [p.note]       free-text reason (stored on the activity; appended to notes on rejection)
 * @param {object} [p.stageData]  validated form values
 */
async function applyStageChange(tx, { app, toStatus, actorId, note, stageData }) {
  const trimmed = typeof note === 'string' ? note.trim() : '';
  const data = { status: toStatus, stageChangedAt: new Date() };

  if (stageData && stageData.rating) data.scorecardRating = parseInt(stageData.rating, 10);
  if (toStatus === 'REJECTED' && trimmed) {
    const stamp = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const entry = `[${stamp} • REJECTED] ${trimmed}`;
    data.recruiterNotes = app.recruiterNotes ? `${app.recruiterNotes.trim()}\n${entry}` : entry;
  }

  await tx.jobApplication.update({ where: { id: app.id }, data });
  await tx.applicationActivity.create({
    data: {
      applicationId: app.id,
      actorId,
      action: 'STAGE_CHANGE',
      fromStatus: app.status,
      toStatus,
      note: trimmed || null,
      stageData: stageData && Object.keys(stageData).length ? stageData : undefined
    }
  });
}

/** Keep only the gate fields' values (drop anything else the client sent) */
function pickStageData(evaluation) {
  const out = {};
  evaluation.fields.forEach((f) => {
    if (f.key !== 'reason' && evaluation.values[f.key] !== null && evaluation.values[f.key] !== undefined) {
      out[f.key] = evaluation.values[f.key];
    }
  });
  return out;
}

module.exports = { PENDING, loadApplicationForGate, applyStageChange, pickStageData };
