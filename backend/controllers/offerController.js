/**
 * Offer letters (surat penawaran kerja).
 *   GET   /api/offers                       → letters + candidates in Offering without a letter + summary
 *   GET   /api/offers/prefill/:applicationId → starting values (candidate, job, Offering stage data)
 *   POST  /api/offers/preview               → document model for the live preview (nothing saved)
 *   POST  /api/offers                       → create a draft
 *   GET   /api/offers/:id                   → letter + document model + allowed actions
 *   PATCH /api/offers/:id                   → edit a draft
 *   POST  /api/offers/:id/send              → mark as sent to the candidate
 *   POST  /api/offers/:id/respond           → ACCEPTED / DECLINED (note required to decline)
 *   POST  /api/offers/:id/cancel            → withdraw a draft or sent letter
 *   GET   /api/offers/:id/pdf               → PDF
 *   POST  /api/offers/:id/email             → e-mail the PDF to the candidate (a draft becomes SENT)
 * Viewing: pipeline.view (Hiring Managers: their jobs). Writing: the candidate's PIC or a TA Lead.
 */
const prisma = require('../api/db');
const { applicationScope, canAccessJob } = require('../services/hiringManagerScope');
const { companyError, companyFilterValue } = require('./companyController');
const { sanitizeOffer, nextLetterNo, canManageOffer, displayStatus, actionsFor, prefillOffer } = require('../services/offerLetter/offerRules');
const { buildOfferDocument } = require('../services/offerLetter/offerDocument');
const { renderOfferPdf } = require('../services/offerLetter/offerPdf');
const { PassThrough } = require('stream');
const mailCfg = require('../config/mail');
const { sendOfferLetter } = require('../services/mail/applicantMail');

const OPEN = ['DRAFT', 'SENT', 'ACCEPTED'];
const COMPANY = { select: { id: true, code: true, name: true, address: true, npwp: true } };
const APP_SELECT = {
  id: true,
  status: true,
  assignedRecruiterId: true,
  releasedAt: true,
  candidate: { select: { id: true, fullName: true, email: true, phone: true, location: true } },
  job: {
    select: {
      id: true, title: true, department: true, location: true, employmentType: true, companyId: true, hiringManagerId: true,
      company: COMPANY, hiringManager: { select: { name: true } }
    }
  },
  assignedRecruiter: { select: { id: true, name: true } }
};
const LETTER_INCLUDE = { company: COMPANY, createdBy: { select: { id: true, name: true } }, application: { select: APP_SELECT } };

const shape = (user, l) => ({
  ...l,
  baseSalary: Number(l.baseSalary),
  displayStatus: displayStatus(l),
  actions: actionsFor(user, l, l.application)
});

/** Offer terms from the stage gate (latest move into Offering) */
async function offerStageData(applicationId) {
  const act = await prisma.applicationActivity.findFirst({
    where: { applicationId, action: 'STAGE_CHANGE', toStatus: 'OFFERING' },
    orderBy: { createdAt: 'desc' },
    select: { stageData: true }
  });
  return (act && act.stageData) || {};
}

async function listOffers(req, res) {
  try {
    const user = req.user;
    const scope = applicationScope(user);
    const where = Object.keys(scope).length ? { application: scope } : {};
    const pt = companyFilterValue(req.query.companyId);
    if (pt !== undefined) where.companyId = pt;
    const q = String(req.query.search || '').trim();
    if (q) where.OR = ['letterNo', 'candidateName', 'positionTitle'].map((f) => ({ [f]: { contains: q, mode: 'insensitive' } }));

    const [letters, ready] = await Promise.all([
      prisma.offerLetter.findMany({ where, orderBy: { createdAt: 'desc' }, include: LETTER_INCLUDE }),
      prisma.jobApplication.findMany({
        where: { ...scope, status: 'OFFERING', releasedAt: null, offerLetters: { none: { status: { in: OPEN } } } },
        orderBy: { stageChangedAt: 'asc' },
        select: { ...APP_SELECT, stageChangedAt: true }
      })
    ]);
    const all = letters.map((l) => shape(user, l));
    const count = (s) => all.filter((l) => l.displayStatus === s).length;
    const status = String(req.query.status || '');
    return res.json({
      success: true,
      data: status ? all.filter((l) => l.displayStatus === status) : all,
      ready: ready.map((a) => ({ ...a, canCreate: canManageOffer(user, a) })),
      summary: { draft: count('DRAFT'), sent: count('SENT'), expired: count('EXPIRED'), accepted: count('ACCEPTED'), declined: count('DECLINED'), cancelled: count('CANCELLED'), ready: ready.length }
    });
  } catch (error) {
    console.error('Error listing offer letters:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function loadApp(user, applicationId) {
  const app = await prisma.jobApplication.findUnique({ where: { id: String(applicationId || '') }, select: APP_SELECT });
  if (!app || !canAccessJob(user, app.job)) return null;
  return app;
}

async function getPrefill(req, res) {
  try {
    const app = await loadApp(req.user, req.params.applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (!['OFFERING', 'HIRED'].includes(app.status)) return res.status(409).json({ success: false, message: 'Offer letters are written for candidates in Offering.' });
    if (!canManageOffer(req.user, app)) return res.status(403).json({ success: false, message: 'Only the candidate’s PIC or a TA Lead can write the offer letter.' });
    const lang = req.query.language === 'en' ? 'en' : 'id';
    return res.json({
      success: true,
      data: {
        applicationId: app.id,
        companyId: app.job.companyId || '',
        values: prefillOffer(app, await offerStageData(app.id), req.user, new Date(), lang)
      }
    });
  } catch (error) {
    console.error('Error preparing offer letter:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function preview(req, res) {
  try {
    const body = req.body || {};
    const { data } = sanitizeOffer(body.values || {});
    const company = body.companyId ? await prisma.company.findUnique({ where: { id: String(body.companyId) }, select: COMPANY.select }) : null;
    const doc = buildOfferDocument({ ...data, baseSalary: data.baseSalary || 0, letterNo: body.letterNo || null }, company);
    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error previewing offer letter:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createOffer(req, res) {
  try {
    const app = await loadApp(req.user, req.body && req.body.applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (!['OFFERING', 'HIRED'].includes(app.status)) return res.status(409).json({ success: false, message: 'Offer letters are written for candidates in Offering.' });
    if (!canManageOffer(req.user, app)) return res.status(403).json({ success: false, message: 'Only the candidate’s PIC or a TA Lead can write the offer letter.' });
    const open = await prisma.offerLetter.findFirst({ where: { applicationId: app.id, status: { in: OPEN } }, select: { letterNo: true, status: true } });
    if (open) return res.status(409).json({ success: false, message: `${open.letterNo} is still ${open.status.toLowerCase()} — cancel it before writing a new letter.` });

    const { data, errors } = sanitizeOffer(req.body.values || {});
    const companyId = String(req.body.companyId || app.job.companyId || '');
    if (!companyId) errors.push('Choose the company (PT) issuing the letter.');
    const ptError = companyId ? await companyError(companyId) : null;
    if (ptError) errors.push(ptError);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { code: true } });
    for (let attempt = 0; attempt < 3; attempt++) {
      const year = new Date().getFullYear();
      const used = await prisma.offerLetter.findMany({ where: { letterNo: { contains: `/OL-${company.code}/HR/`, endsWith: `/${year}` } }, select: { letterNo: true } });
      try {
        const letter = await prisma.$transaction(async (tx) => {
          const l = await tx.offerLetter.create({
            data: { ...data, applicationId: app.id, companyId, createdById: req.user.id, letterNo: nextLetterNo(used.map((u) => u.letterNo), company.code) },
            include: LETTER_INCLUDE
          });
          await tx.applicationActivity.create({ data: { applicationId: app.id, actorId: req.user.id, action: 'OFFER_LETTER_CREATED', toStatus: app.status, note: l.letterNo } });
          return l;
        });
        return res.status(201).json({ success: true, message: `Draft ${letter.letterNo} created.`, data: shape(req.user, letter) });
      } catch (err) {
        if (err.code !== 'P2002' || attempt === 2) throw err;
      }
    }
  } catch (error) {
    console.error('Error creating offer letter:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function loadLetter(user, id) {
  const l = await prisma.offerLetter.findUnique({ where: { id: String(id) }, include: LETTER_INCLUDE });
  if (!l || !canAccessJob(user, l.application.job)) return null;
  return l;
}

async function getOffer(req, res) {
  try {
    const l = await loadLetter(req.user, req.params.id);
    if (!l) return res.status(404).json({ success: false, message: 'Offer letter not found.' });
    return res.json({ success: true, data: { ...shape(req.user, l), document: buildOfferDocument(l, l.company), emailMode: mailCfg.mode } });
  } catch (error) {
    console.error('Error loading offer letter:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateOffer(req, res) {
  try {
    const l = await loadLetter(req.user, req.params.id);
    if (!l) return res.status(404).json({ success: false, message: 'Offer letter not found.' });
    if (!actionsFor(req.user, l, l.application).edit) return res.status(403).json({ success: false, message: 'Only drafts can be edited, by the PIC or a TA Lead.' });
    const { data, errors } = sanitizeOffer(req.body.values || {});
    const companyId = req.body.companyId ? String(req.body.companyId) : l.companyId;
    if (companyId !== l.companyId) {
      const ptError = await companyError(companyId);
      if (ptError) errors.push(ptError);
    }
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
    // The number stays — it was issued for this PT; a different PT gets its own number on a new letter
    const updated = await prisma.offerLetter.update({ where: { id: l.id }, data: { ...data, companyId }, include: LETTER_INCLUDE });
    return res.json({ success: true, message: `${l.letterNo} saved.`, data: shape(req.user, updated) });
  } catch (error) {
    console.error('Error updating offer letter:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Status change guarded by the expected current status (no double clicks / races) */
async function transition(req, res, { allowed, from, to, action, needNote = false, verb }) {
  try {
    const l = await loadLetter(req.user, req.params.id);
    if (!l) return res.status(404).json({ success: false, message: 'Offer letter not found.' });
    if (!actionsFor(req.user, l, l.application)[allowed]) return res.status(403).json({ success: false, message: `This letter cannot be ${verb} now.` });
    const note = String((req.body && req.body.note) || '').trim().slice(0, 2000);
    if (needNote && !note) return res.status(400).json({ success: false, message: 'Add a note (for example the reason the candidate declined).' });
    const now = new Date();
    const data = { status: to, ...(to === 'SENT' ? { sentAt: now } : {}), ...(['ACCEPTED', 'DECLINED'].includes(to) ? { respondedAt: now } : {}), ...(note ? { responseNote: note } : {}) };
    const done = await prisma.offerLetter.updateMany({ where: { id: l.id, status: { in: from } }, data });
    if (!done.count) return res.status(409).json({ success: false, message: 'The letter changed in the meantime — reload and try again.' });
    await prisma.applicationActivity.create({ data: { applicationId: l.applicationId, actorId: req.user.id, action, toStatus: l.application.status, note: [l.letterNo, note].filter(Boolean).join(' — ') } });
    const fresh = await prisma.offerLetter.findUnique({ where: { id: l.id }, include: LETTER_INCLUDE });
    return res.json({ success: true, message: `${l.letterNo} ${verb}.`, data: shape(req.user, fresh) });
  } catch (error) {
    console.error('Error changing offer letter status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

const sendOffer = (req, res) => transition(req, res, { allowed: 'send', from: ['DRAFT'], to: 'SENT', action: 'OFFER_LETTER_SENT', verb: 'marked as sent' });
const cancelOffer = (req, res) => transition(req, res, { allowed: 'cancel', from: ['DRAFT', 'SENT'], to: 'CANCELLED', action: 'OFFER_LETTER_CANCELLED', verb: 'cancelled' });
function respondOffer(req, res) {
  const accepted = String((req.body && req.body.response) || '').toUpperCase() === 'ACCEPTED';
  const declined = String((req.body && req.body.response) || '').toUpperCase() === 'DECLINED';
  if (!accepted && !declined) return res.status(400).json({ success: false, message: 'Response must be ACCEPTED or DECLINED.' });
  return transition(req, res, {
    allowed: 'respond',
    from: ['SENT'],
    to: accepted ? 'ACCEPTED' : 'DECLINED',
    action: accepted ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED',
    needNote: declined,
    verb: accepted ? 'recorded as accepted' : 'recorded as declined'
  });
}

async function downloadPdf(req, res) {
  try {
    const l = await loadLetter(req.user, req.params.id);
    if (!l) return res.status(404).json({ success: false, message: 'Offer letter not found.' });
    const name = `${l.letterNo.replace(/\//g, '-')}_${l.candidateName.replace(/[^A-Za-z0-9]+/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${name}"`);
    renderOfferPdf(buildOfferDocument(l, l.company), res);
  } catch (error) {
    console.error('Error rendering offer letter PDF:', error);
    if (!res.headersSent) return res.status(500).json({ success: false, message: error.message });
  }
}

/** PDF as a Buffer (for e-mail attachments) */
function pdfBuffer(model) {
  return new Promise((resolve, reject) => {
    const sink = new PassThrough();
    const chunks = [];
    sink.on('data', (c) => chunks.push(c));
    sink.on('end', () => resolve(Buffer.concat(chunks)));
    sink.on('error', reject);
    renderOfferPdf(model, sink);
  });
}

async function emailOffer(req, res) {
  try {
    const l = await loadLetter(req.user, req.params.id);
    if (!l) return res.status(404).json({ success: false, message: 'Offer letter not found.' });
    const a = actionsFor(req.user, l, l.application);
    const resend = l.status === 'SENT' && a.respond;
    if (!a.send && !resend) return res.status(403).json({ success: false, message: 'Only drafts or sent letters can be e-mailed, by the PIC or a TA Lead.' });
    if (!l.candidateEmail) return res.status(400).json({ success: false, message: 'The letter has no candidate e-mail — add it with Edit first.' });
    if (mailCfg.mode === 'off') return res.status(409).json({ success: false, message: 'E-mail is not configured (MAIL_MODE=off or SMTP missing).' });

    const pdf = await pdfBuffer(buildOfferDocument(l, l.company));
    const result = await sendOfferLetter(l, pdf, { actorId: req.user.id, replyTo: req.user.email });
    if (result.status === 'failed') return res.status(502).json({ success: false, message: `E-mail could not be sent: ${result.reason}` });
    if (result.status === 'skipped') return res.status(409).json({ success: false, message: result.reason });

    if (l.status === 'DRAFT') {
      const done = await prisma.offerLetter.updateMany({ where: { id: l.id, status: 'DRAFT' }, data: { status: 'SENT', sentAt: new Date() } });
      if (done.count) {
        await prisma.applicationActivity.create({
          data: { applicationId: l.applicationId, actorId: req.user.id, action: 'OFFER_LETTER_SENT', toStatus: l.application.status, note: `${l.letterNo} — e-mailed to ${result.to}` }
        });
      }
    }
    const fresh = await prisma.offerLetter.findUnique({ where: { id: l.id }, include: LETTER_INCLUDE });
    const message = result.status === 'logged'
      ? `${l.letterNo} prepared for ${result.to} (log only — MAIL_MODE=log, nothing was delivered).`
      : `${l.letterNo} e-mailed to ${result.to}.`;
    return res.json({ success: true, message, data: shape(req.user, fresh), email: { status: result.status, to: result.to } });
  } catch (error) {
    console.error('Error e-mailing offer letter:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listOffers, getPrefill, preview, createOffer, getOffer, updateOffer, sendOffer, emailOffer, respondOffer, cancelOffer, downloadPdf };
