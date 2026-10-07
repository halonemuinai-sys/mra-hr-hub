/**
 * Talenta (Mekari HRIS) sync for registered employees — HR only (employee.sync).
 *
 *   GET  /api/talenta/status                 → mode / readiness (employee.view)
 *   GET  /api/talenta/master-data?refresh=1  → branches, organizations, positions, levels (employee.sync)
 *   GET  /api/talenta/employees/:id          → form values, field definitions, payload check, sync state
 *   PUT  /api/talenta/employees/:id          → save the personal & payroll data (draft)
 *   POST /api/talenta/employees/:id/sync     → send to Talenta (POST /v2/talenta/v3/employee)
 *
 * A record counts as sent only for the mode it was sent to, so simulator runs (mock) never block
 * the real send once sandbox / production credentials are configured.
 */
const prisma = require('../api/db');
const { talentaConfig } = require('../config/talenta');
const { talentaRequest, TalentaError } = require('../services/talenta/talentaClient');
const { getMasterData } = require('../services/talenta/talentaMasterData');
const {
  SECTIONS,
  clientFields,
  sanitizeTalentaData,
  defaultTalentaData,
  buildEmployeePayload,
  maskPayload
} = require('../services/talenta/talentaEmployeePayload');

const SENDING_TIMEOUT_MS = 2 * 60 * 1000;
// PT's default Talenta branch prefills the Branch field
const WITH_COMPANY = { company: { select: { name: true, talentaBranch: true } } };

const publicConfig = (cfg) => ({ mode: cfg.mode, label: cfg.label, ready: cfg.ready, missing: cfg.missing });

function syncState(emp, cfg) {
  const current = emp.talentaMode === cfg.mode;
  return {
    status: emp.talentaStatus || null,
    mode: emp.talentaMode || null,
    userId: emp.talentaUserId,
    employeeId: emp.talentaEmployeeId,
    syncedAt: emp.talentaSyncedAt,
    error: emp.talentaError,
    // Sent to the currently configured Talenta → no second send
    sentHere: emp.talentaStatus === 'SENT' && current
  };
}

/** Offered salary from the stage-gate form when the card moved to Offering */
async function offerSalaryOf(applicationId) {
  if (!applicationId) return null;
  const act = await prisma.applicationActivity.findFirst({
    where: { applicationId, action: 'STAGE_CHANGE', toStatus: 'OFFERING' },
    orderBy: { createdAt: 'desc' },
    select: { stageData: true }
  });
  const v = act && act.stageData && act.stageData.offerSalary;
  return v ? Number(v) || null : null;
}

async function mastersOrError() {
  try {
    return { masters: await getMasterData() };
  } catch (err) {
    return { masters: null, masterError: err.message };
  }
}

async function getStatus(req, res) {
  return res.json({ success: true, data: publicConfig(talentaConfig()) });
}

async function getMasters(req, res) {
  try {
    const data = await getMasterData({ refresh: req.query.refresh === '1' });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.status || 502).json({ success: false, message: error.message });
  }
}

async function loadEmployee(id) {
  return prisma.employee.findUnique({ where: { id: String(id) }, include: WITH_COMPANY });
}

async function buildView(emp) {
  const cfg = talentaConfig();
  const { masters, masterError } = cfg.mode === 'off' ? { masters: null } : await mastersOrError();
  const values = { ...defaultTalentaData(emp, { offerSalary: await offerSalaryOf(emp.applicationId), companyBranch: emp.company?.talentaBranch, masters }), ...(emp.talentaData || {}) };
  const { payload, errors } = buildEmployeePayload(emp, values, masters);
  return {
    employee: {
      id: emp.id,
      employeeNo: emp.employeeNo,
      fullName: emp.fullName,
      email: emp.workEmail || emp.personalEmail,
      position: emp.position,
      department: emp.department,
      division: emp.division,
      workLocation: emp.workLocation,
      joinDate: emp.joinDate
    },
    saved: !!emp.talentaData,
    values,
    sections: SECTIONS,
    fields: clientFields(),
    masters,
    masterError: masterError || null,
    check: { payload: maskPayload(payload), errors },
    sync: syncState(emp, cfg),
    config: publicConfig(cfg)
  };
}

async function getEmployeeTalenta(req, res) {
  try {
    const emp = await loadEmployee(req.params.id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    return res.json({ success: true, data: await buildView(emp) });
  } catch (error) {
    console.error('Error loading Talenta data:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function saveEmployeeTalenta(req, res) {
  try {
    const emp = await loadEmployee(req.params.id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const data = { ...(emp.talentaData || {}), ...sanitizeTalentaData((req.body && req.body.data) || {}) };
    const updated = await prisma.employee.update({ where: { id: emp.id }, include: WITH_COMPANY, data: { talentaData: data } });
    return res.json({ success: true, message: 'Talenta data saved.', data: await buildView(updated) });
  } catch (error) {
    console.error('Error saving Talenta data:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function syncEmployee(req, res) {
  const cfg = talentaConfig();
  try {
    if (!cfg.ready) {
      return res.status(503).json({
        success: false,
        message: cfg.mode === 'off' ? 'Talenta integration is off.' : `Talenta credentials missing: ${cfg.missing.join(', ')}.`
      });
    }
    let emp = await loadEmployee(req.params.id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });

    // Save what the form sent first, so a failed send keeps the latest input
    if (req.body && req.body.data) {
      emp = await prisma.employee.update({
        where: { id: emp.id }, include: WITH_COMPANY,
        data: { talentaData: { ...(emp.talentaData || {}), ...sanitizeTalentaData(req.body.data) } }
      });
    }

    if (syncState(emp, cfg).sentHere) {
      return res.status(409).json({ success: false, message: `Already sent to ${cfg.label} (user_id ${emp.talentaUserId}).` });
    }

    const { masters } = await mastersOrError();
    const values = { ...defaultTalentaData(emp, { offerSalary: await offerSalaryOf(emp.applicationId), companyBranch: emp.company?.talentaBranch, masters }), ...(emp.talentaData || {}) };
    const { payload, errors } = buildEmployeePayload(emp, values, masters);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    // Claim the send (no double posts from two tabs / double clicks)
    const claimed = await prisma.employee.updateMany({
      where: {
        id: emp.id,
        OR: [
          { talentaStatus: null },
          { talentaStatus: { not: 'SENDING' }, NOT: { talentaStatus: 'SENT', talentaMode: cfg.mode } },
          { talentaStatus: 'SENDING', updatedAt: { lt: new Date(Date.now() - SENDING_TIMEOUT_MS) } }
        ]
      },
      data: { talentaStatus: 'SENDING', talentaMode: cfg.mode, talentaData: values }
    });
    if (!claimed.count) return res.status(409).json({ success: false, message: 'A send is already in progress or finished.' });

    try {
      const result = await talentaRequest('POST', '/v2/talenta/v3/employee', payload, cfg);
      const userId = result && result.data && result.data.user_id;
      let employeeId = payload.employee_id || null;
      if (!employeeId && userId) {
        // Talenta generated the id — read it back
        try {
          const info = await talentaRequest('GET', `/v2/talenta/v2/employee/${userId}`, undefined, cfg);
          employeeId = info?.data?.employee?.employment?.employee_id || null;
        } catch {}
      }
      const updated = await prisma.employee.update({
        where: { id: emp.id }, include: WITH_COMPANY,
        data: {
          talentaStatus: 'SENT',
          talentaUserId: userId || null,
          talentaEmployeeId: employeeId,
          talentaSyncedAt: new Date(),
          talentaError: null
        }
      });
      if (emp.applicationId) {
        await prisma.applicationActivity.create({
          data: { applicationId: emp.applicationId, actorId: req.user.id, action: 'TALENTA_SYNCED', note: `${cfg.label} · user_id ${userId || '-'}` }
        });
      }
      return res.json({
        success: true,
        message: `${emp.fullName} sent to ${cfg.label}${employeeId ? ` (Employee ID ${employeeId})` : ''}.`,
        data: await buildView(updated)
      });
    } catch (err) {
      const errorsList = err instanceof TalentaError && err.errors.length ? err.errors : [err.message];
      const updated = await prisma.employee.update({
        where: { id: emp.id }, include: WITH_COMPANY,
        data: { talentaStatus: 'FAILED', talentaError: errorsList.join('\n').slice(0, 2000), talentaSyncedAt: new Date() }
      });
      if (emp.applicationId) {
        await prisma.applicationActivity.create({
          data: { applicationId: emp.applicationId, actorId: req.user.id, action: 'TALENTA_SYNC_FAILED', note: errorsList[0].slice(0, 300) }
        });
      }
      return res.status(err.status && err.status < 500 ? 422 : 502).json({
        success: false,
        message: `Talenta rejected the data: ${errorsList[0]}`,
        errors: errorsList,
        data: await buildView(updated)
      });
    }
  } catch (error) {
    console.error('Error syncing employee to Talenta:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getStatus, getMasters, getEmployeeTalenta, saveEmployeeTalenta, syncEmployee };
