/**
 * Manpower requests (permintaan rekrutmen).
 *   GET  /api/manpower                 → list (+ counts per status, fulfillment)        manpower.view
 *   GET  /api/manpower/:id             → detail (+ job prefill when it can be opened)    manpower.view
 *   POST /api/manpower                 → submit a request                               manpower.request
 *   PATCH /api/manpower/:id            → edit while pending (requester or approver)     manpower.view + rule
 *   POST /api/manpower/:id/decide      → APPROVE / REJECT (note required to reject)     manpower.approve
 *   POST /api/manpower/:id/cancel      → withdraw (pending, or approved without a job)  manpower.view + rule
 * Opening the job: POST /api/jobs with manpowerRequestId (jobController.createJob) links the two.
 * Visibility: TA team and approvers see every request, Hiring Managers their own (services/manpowerRules.js).
 */
const prisma = require('../api/db');
const { companyError, companyFilterValue } = require('./companyController');
const {
  STATUSES,
  sanitizeManpowerInput,
  seesAll,
  canView,
  canDecide,
  canEdit,
  canCancel,
  actionsFor,
  nextRequestNo,
  jobPrefill
} = require('../services/manpowerRules');

const INCLUDE = {
  requestedBy: { select: { id: true, name: true, role: true } },
  decidedBy: { select: { id: true, name: true } },
  company: { select: { id: true, code: true, name: true } },
  job: { select: { id: true, title: true, isActive: true } }
};

/** Applicants / active / hired of the jobs opened from these requests */
async function fulfillment(rows) {
  const jobIds = rows.map((r) => r.jobId).filter(Boolean);
  if (!jobIds.length) return new Map();
  const grouped = await prisma.jobApplication.groupBy({ by: ['jobId', 'status'], where: { jobId: { in: jobIds } }, _count: { _all: true } });
  const map = new Map();
  grouped.forEach((g) => {
    const f = map.get(g.jobId) || { applicants: 0, active: 0, hired: 0 };
    f.applicants += g._count._all;
    if (g.status === 'HIRED') f.hired += g._count._all;
    else if (!['REJECTED', 'TALENT_POOL'].includes(g.status)) f.active += g._count._all;
    map.set(g.jobId, f);
  });
  return map;
}

const shape = (user, r, fill) => ({
  ...r,
  salaryMin: r.salaryMin == null ? null : Number(r.salaryMin),
  salaryMax: r.salaryMax == null ? null : Number(r.salaryMax),
  fulfillment: r.jobId ? fill.get(r.jobId) || { applicants: 0, active: 0, hired: 0 } : null,
  actions: actionsFor(user, r)
});

async function listRequests(req, res) {
  try {
    const user = req.user;
    const visible = seesAll(user) && req.query.mine !== '1' ? {} : { requestedById: user.id };
    const where = { ...visible };
    const pt = companyFilterValue(req.query.companyId);
    if (pt !== undefined) where.companyId = pt;
    const q = String(req.query.search || '').trim();
    if (q) {
      where.OR = ['requestNo', 'positionTitle', 'department', 'division', 'location'].map((f) => ({ [f]: { contains: q, mode: 'insensitive' } }));
    }

    const [rows, grouped] = await Promise.all([
      prisma.manpowerRequest.findMany({
        where: STATUSES.includes(req.query.status) ? { ...where, status: req.query.status } : where,
        orderBy: [{ createdAt: 'desc' }],
        include: INCLUDE
      }),
      prisma.manpowerRequest.groupBy({ by: ['status'], where, _count: { _all: true } })
    ]);
    const fill = await fulfillment(rows);
    const counts = { all: 0 };
    STATUSES.forEach((s) => (counts[s] = 0));
    grouped.forEach((g) => {
      counts[g.status] = g._count._all;
      counts.all += g._count._all;
    });
    return res.json({ success: true, data: rows.map((r) => shape(user, r, fill)), counts });
  } catch (error) {
    console.error('Error listing manpower requests:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function loadVisible(user, id) {
  const row = await prisma.manpowerRequest.findUnique({ where: { id: String(id) }, include: INCLUDE });
  if (!row || !canView(user, row)) return null;
  return row;
}

async function getRequest(req, res) {
  try {
    const row = await loadVisible(req.user, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Manpower request not found.' });
    const fill = await fulfillment([row]);
    const data = shape(req.user, row, fill);
    if (data.actions.openJob) data.jobPrefill = jobPrefill(row);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error loading manpower request:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createRequest(req, res) {
  try {
    const { data, errors } = sanitizeManpowerInput(req.body);
    const ptError = data.companyId ? await companyError(data.companyId) : null;
    if (ptError) errors.push(ptError);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    const year = new Date().getFullYear();
    // Unique number; retry if two requests are submitted at the same moment
    for (let attempt = 0; attempt < 3; attempt++) {
      const used = await prisma.manpowerRequest.findMany({ where: { requestNo: { startsWith: `MPR-${year}-` } }, select: { requestNo: true } });
      try {
        const row = await prisma.manpowerRequest.create({
          data: { ...data, requestNo: nextRequestNo(used.map((u) => u.requestNo), year), requestedById: req.user.id },
          include: INCLUDE
        });
        return res.status(201).json({ success: true, message: `${row.requestNo} submitted for approval.`, data: shape(req.user, row, new Map()) });
      } catch (err) {
        if (err.code !== 'P2002' || attempt === 2) throw err;
      }
    }
  } catch (error) {
    console.error('Error creating manpower request:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateRequest(req, res) {
  try {
    const row = await loadVisible(req.user, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Manpower request not found.' });
    if (!canEdit(req.user, row)) return res.status(403).json({ success: false, message: 'Only pending requests can be edited, by the requester or an approver.' });

    // Validate the merged record so cross-field rules (replacement name, salary range) still hold
    const merged = { ...row, salaryMin: row.salaryMin == null ? '' : Number(row.salaryMin), salaryMax: row.salaryMax == null ? '' : Number(row.salaryMax), ...req.body };
    if (merged.targetStartDate instanceof Date) merged.targetStartDate = merged.targetStartDate.toISOString().slice(0, 10);
    const { data, errors } = sanitizeManpowerInput(merged);
    const ptError = data.companyId && data.companyId !== row.companyId ? await companyError(data.companyId) : null;
    if (ptError) errors.push(ptError);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    const updated = await prisma.manpowerRequest.update({ where: { id: row.id }, data, include: INCLUDE });
    return res.json({ success: true, message: `${updated.requestNo} updated.`, data: shape(req.user, updated, new Map()) });
  } catch (error) {
    console.error('Error updating manpower request:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function decideRequest(req, res) {
  try {
    const row = await loadVisible(req.user, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Manpower request not found.' });
    const decision = String((req.body && req.body.decision) || '').toUpperCase();
    const note = String((req.body && req.body.note) || '').trim().slice(0, 2000);
    if (!['APPROVE', 'REJECT'].includes(decision)) return res.status(400).json({ success: false, message: 'Decision must be APPROVE or REJECT.' });
    if (!canDecide(req.user, row)) {
      const own = row.requestedById === req.user.id;
      return res.status(403).json({
        success: false,
        message: row.status !== 'PENDING' ? 'This request has already been decided.' : own ? 'You cannot approve your own request — another approver must decide.' : 'You are not allowed to decide manpower requests.'
      });
    }
    if (decision === 'REJECT' && !note) return res.status(400).json({ success: false, message: 'Add a note explaining the rejection.' });

    const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const done = await prisma.manpowerRequest.updateMany({
      where: { id: row.id, status: 'PENDING' },
      data: { status, decidedById: req.user.id, decidedAt: new Date(), decisionNote: note || null }
    });
    if (!done.count) return res.status(409).json({ success: false, message: 'This request has already been decided.' });
    const updated = await prisma.manpowerRequest.findUnique({ where: { id: row.id }, include: INCLUDE });
    return res.json({
      success: true,
      message: status === 'APPROVED' ? `${row.requestNo} approved — it can now be opened as a job posting.` : `${row.requestNo} rejected.`,
      data: shape(req.user, updated, new Map())
    });
  } catch (error) {
    console.error('Error deciding manpower request:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function cancelRequest(req, res) {
  try {
    const row = await loadVisible(req.user, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Manpower request not found.' });
    if (!canCancel(req.user, row)) return res.status(403).json({ success: false, message: 'This request can no longer be withdrawn.' });
    const note = String((req.body && req.body.note) || '').trim().slice(0, 2000);
    const done = await prisma.manpowerRequest.updateMany({
      where: { id: row.id, status: row.status, jobId: null },
      data: { status: 'CANCELLED', ...(note ? { decisionNote: note } : {}) }
    });
    if (!done.count) return res.status(409).json({ success: false, message: 'The request changed in the meantime — reload and try again.' });
    const updated = await prisma.manpowerRequest.findUnique({ where: { id: row.id }, include: INCLUDE });
    return res.json({ success: true, message: `${row.requestNo} withdrawn.`, data: shape(req.user, updated, new Map()) });
  } catch (error) {
    console.error('Error cancelling manpower request:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listRequests, getRequest, createRequest, updateRequest, decideRequest, cancelRequest };
