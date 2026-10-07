/**
 * After the hire: register HIRED applications as employees, take them off the pipeline board
 * ("release"), and announce new colleagues on the internal board.
 *
 *   GET    /api/employees                       → registered employees (employee.view)
 *   GET    /api/employees/pending               → HIRED applications not registered yet (employee.view)
 *   GET    /api/employees/export.xlsx           → employees workbook for HRIS / payroll (employee.view)
 *   GET    /api/employees/:id/journey           → CV received → hired → onboarding timeline (employee.view)
 *   GET    /api/employees/prefill/:applicationId → suggested form values (employee.manage)
 *   POST   /api/employees                       → register (+ release, optional announce) (employee.manage)
 *   PATCH  /api/employees/:id                   → edit (employee.manage)
 *   POST   /api/employees/:id/announce          → publish / update the announcement (employee.manage)
 *   DELETE /api/employees/:id/announce          → withdraw it (employee.manage)
 *   POST   /api/employees/release               → take HIRED cards off the board (employee.manage)
 *   POST   /api/employees/restore               → put a released, unregistered hire back (employee.manage)
 *   GET    /api/announcements                   → announcement board (dashboard.view)
 *
 * Recruiters act only on hires they own (same rule as moving a card); TA Leads on any.
 */
const ExcelJS = require('exceljs');
const prisma = require('../api/db');
const { hasPermission } = require('../config/permissions');
const { PENDING } = require('../services/stageMoveService');
const { jobScope, applicationScope, canAccessJob } = require('../services/hiringManagerScope');
const { buildJourney } = require('../services/journeyService');
const { sanitizeEmployeeInput, suggestEmployeeNo } = require('../services/employeeInput');

const STATUS_FROM_JOB_TYPE = { contract: 'CONTRACT', internship: 'INTERNSHIP', magang: 'INTERNSHIP', kontrak: 'CONTRACT' };
const STATUS_LABELS = { PROBATION: 'Probation', CONTRACT: 'Kontrak', PERMANENT: 'Tetap', INTERNSHIP: 'Magang' };
const MAX_MESSAGE = 1000;

const isLead = (user) => hasPermission(user, 'pipeline.move.any');

/** May this user register / release this hire? */
function canHandleHire(user, app) {
  if (!hasPermission(user, 'employee.manage')) return false;
  return isLead(user) || (!!app.assignedRecruiterId && app.assignedRecruiterId === user.id);
}

/** May this user edit / announce this employee? */
function canEditEmployee(user, emp) {
  if (!hasPermission(user, 'employee.manage')) return false;
  if (isLead(user)) return true;
  return emp.createdById === user.id || (emp.application && emp.application.assignedRecruiterId === user.id);
}

/** Drop HR-only Talenta data; keep only the sync status for the list */
const publicEmployee = ({ talentaData, ...e }, user) => ({ ...e, canEdit: canEditEmployee(user, e) });

const dayString = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

/** Confirmed join date captured by the stage gate when the card moved to HIRED */
const HIRE_MOVE = {
  where: { action: 'STAGE_CHANGE', toStatus: 'HIRED' },
  orderBy: { createdAt: 'desc' },
  take: 1,
  select: { stageData: true, createdAt: true }
};
const joinDateOf = (app) => {
  const d = app.activities && app.activities[0] && app.activities[0].stageData && app.activities[0].stageData.joinDate;
  return d || null;
};

const EMPLOYEE_INCLUDE = {
  job: { select: { id: true, title: true } },
  createdBy: { select: { id: true, name: true } },
  announcedBy: { select: { id: true, name: true } },
  application: { select: { id: true, assignedRecruiterId: true, assignedRecruiter: { select: { id: true, name: true } } } }
};

function employeeWhere(req) {
  const { search, status, announced } = req.query;
  const where = {};
  const scope = jobScope(req.user);
  if (scope) where.job = scope;
  if (status && STATUS_LABELS[status]) where.employmentStatus = status;
  if (announced === 'yes') where.announcedAt = { not: null };
  if (announced === 'no') where.announcedAt = null;
  if (search && String(search).trim()) {
    const q = String(search).trim();
    where.OR = ['fullName', 'employeeNo', 'position', 'department', 'division', 'personalEmail'].map((f) => ({
      [f]: { contains: q, mode: 'insensitive' }
    }));
  }
  return where;
}

async function listEmployees(req, res) {
  try {
    const rows = await prisma.employee.findMany({
      where: employeeWhere(req),
      orderBy: [{ joinDate: 'desc' }, { createdAt: 'desc' }],
      include: EMPLOYEE_INCLUDE
    });
    return res.json({ success: true, data: rows.map((e) => publicEmployee(e, req.user)) });
  } catch (error) {
    console.error('Error listing employees:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function listPendingHires(req, res) {
  try {
    const rows = await prisma.jobApplication.findMany({
      where: { status: 'HIRED', employee: null, ...applicationScope(req.user) },
      orderBy: { stageChangedAt: 'desc' },
      select: {
        id: true,
        status: true,
        releasedAt: true,
        stageChangedAt: true,
        assignedRecruiterId: true,
        candidate: { select: { id: true, fullName: true, email: true, headline: true } },
        job: { select: { id: true, title: true, department: true, division: true, location: true } },
        assignedRecruiter: { select: { id: true, name: true } },
        activities: HIRE_MOVE
      }
    });
    const data = rows.map(({ activities, ...a }) => ({
      ...a,
      joinDate: joinDateOf({ activities }),
      canRegister: canHandleHire(req.user, a)
    }));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error listing pending hires:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Load a HIRED application for registration; returns { app } or { status, message } */
async function loadHire(user, applicationId) {
  const app = await prisma.jobApplication.findUnique({
    where: { id: String(applicationId || '') },
    include: {
      candidate: { select: { id: true, fullName: true, email: true, phone: true } },
      job: {
        select: {
          id: true, title: true, department: true, division: true, location: true, employmentType: true,
          hiringManager: { select: { name: true } }
        }
      },
      employee: { select: { id: true } },
      stageRequests: { where: { status: PENDING }, select: { id: true }, take: 1 },
      activities: HIRE_MOVE
    }
  });
  if (!app) return { status: 404, message: 'Lamaran tidak ditemukan.' };
  if (app.status !== 'HIRED') return { status: 409, message: 'Hanya kandidat berstatus Hired yang bisa didaftarkan sebagai karyawan.' };
  if (app.employee) return { status: 409, message: 'Kandidat ini sudah terdaftar sebagai karyawan.' };
  if (!canHandleHire(user, app)) return { status: 403, message: 'Hanya PIC kandidat ini atau TA Lead yang dapat mendaftarkannya.' };
  return { app };
}

async function prefillEmployee(req, res) {
  try {
    const { app, status, message } = await loadHire(req.user, req.params.applicationId);
    if (!app) return res.status(status).json({ success: false, message });

    const year = new Date().getFullYear();
    const used = await prisma.employee.findMany({ where: { employeeNo: { startsWith: `MRA-${year}-` } }, select: { employeeNo: true } });
    const job = app.job || {};
    const c = app.candidate || {};
    return res.json({
      success: true,
      data: {
        applicationId: app.id,
        candidate: { id: c.id, fullName: c.fullName },
        job: { id: job.id, title: job.title },
        values: {
          employeeNo: suggestEmployeeNo(used.map((u) => u.employeeNo), year),
          fullName: c.fullName || '',
          personalEmail: c.email || '',
          workEmail: '',
          phone: c.phone || '',
          position: job.title || '',
          department: job.department || '',
          division: job.division || '',
          workLocation: job.location || '',
          employmentStatus: STATUS_FROM_JOB_TYPE[String(job.employmentType || '').toLowerCase()] || 'PROBATION',
          joinDate: dayString(joinDateOf(app)) || '',
          managerName: (job.hiringManager && job.hiringManager.name) || '',
          notes: ''
        }
      }
    });
  } catch (error) {
    console.error('Error preparing employee form:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

function cleanMessage(v) {
  const m = typeof v === 'string' ? v.trim() : '';
  return m.slice(0, MAX_MESSAGE);
}

const duplicateNo = (error) => error && error.code === 'P2002';

async function registerEmployee(req, res) {
  try {
    const { app, status, message } = await loadHire(req.user, req.body && req.body.applicationId);
    if (!app) return res.status(status).json({ success: false, message });
    if (app.stageRequests.length) {
      return res.status(409).json({ success: false, message: 'Masih ada approval yang menunggu untuk kandidat ini.' });
    }

    const { data, errors } = sanitizeEmployeeInput(req.body);
    const announce = !!req.body.announce;
    const announcementMessage = cleanMessage(req.body.announcementMessage);
    if (announce && !announcementMessage) errors.push('Isi pesan pengumuman, atau matikan opsi umumkan.');
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

    const now = new Date();
    const employee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          ...data,
          applicationId: app.id,
          candidateId: app.candidateId,
          jobId: app.jobId,
          createdById: req.user.id,
          ...(announce ? { announcedAt: now, announcedById: req.user.id, announcementMessage } : {})
        },
        include: EMPLOYEE_INCLUDE
      });
      if (!app.releasedAt) await tx.jobApplication.update({ where: { id: app.id }, data: { releasedAt: now } });
      const log = [{ applicationId: app.id, actorId: req.user.id, action: 'EMPLOYEE_REGISTERED', note: `NIK ${data.employeeNo}` }];
      if (announce) log.push({ applicationId: app.id, actorId: req.user.id, action: 'EMPLOYEE_ANNOUNCED' });
      await tx.applicationActivity.createMany({ data: log });
      return emp;
    });

    return res.status(201).json({
      success: true,
      message: `${employee.fullName} terdaftar sebagai karyawan (${employee.employeeNo})${announce ? ' dan sudah diumumkan' : ''}.`,
      data: publicEmployee(employee, req.user)
    });
  } catch (error) {
    if (duplicateNo(error)) return res.status(409).json({ success: false, message: 'NIK karyawan sudah dipakai. Gunakan nomor lain.' });
    console.error('Error registering employee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function loadEditable(user, id) {
  const emp = await prisma.employee.findUnique({ where: { id: String(id) }, include: EMPLOYEE_INCLUDE });
  if (!emp) return { status: 404, message: 'Data karyawan tidak ditemukan.' };
  if (!canEditEmployee(user, emp)) return { status: 403, message: 'Anda tidak dapat mengubah data karyawan ini.' };
  return { emp };
}

async function updateEmployee(req, res) {
  try {
    const { emp, status, message } = await loadEditable(req.user, req.params.id);
    if (!emp) return res.status(status).json({ success: false, message });
    const { data, errors } = sanitizeEmployeeInput(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
    if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'Tidak ada perubahan.' });

    const updated = await prisma.employee.update({ where: { id: emp.id }, data, include: EMPLOYEE_INCLUDE });
    return res.json({ success: true, message: 'Data karyawan diperbarui.', data: publicEmployee(updated, req.user) });
  } catch (error) {
    if (duplicateNo(error)) return res.status(409).json({ success: false, message: 'NIK karyawan sudah dipakai. Gunakan nomor lain.' });
    console.error('Error updating employee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function announceEmployee(req, res) {
  try {
    const { emp, status, message } = await loadEditable(req.user, req.params.id);
    if (!emp) return res.status(status).json({ success: false, message });
    const text = cleanMessage(req.body && req.body.message);
    if (!text) return res.status(400).json({ success: false, message: 'Pesan pengumuman wajib diisi.' });

    const first = !emp.announcedAt;
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.employee.update({
        where: { id: emp.id },
        // Editing the text keeps the original publish time (and its place on the board)
        data: first ? { announcedAt: new Date(), announcedById: req.user.id, announcementMessage: text } : { announcementMessage: text },
        include: EMPLOYEE_INCLUDE
      });
      if (first && emp.applicationId) {
        await tx.applicationActivity.create({ data: { applicationId: emp.applicationId, actorId: req.user.id, action: 'EMPLOYEE_ANNOUNCED' } });
      }
      return u;
    });
    return res.json({ success: true, message: first ? `${emp.fullName} sudah diumumkan.` : 'Pengumuman diperbarui.', data: publicEmployee(updated, req.user) });
  } catch (error) {
    console.error('Error announcing employee:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function withdrawAnnouncement(req, res) {
  try {
    const { emp, status, message } = await loadEditable(req.user, req.params.id);
    if (!emp) return res.status(status).json({ success: false, message });
    if (!emp.announcedAt) return res.status(409).json({ success: false, message: 'Karyawan ini belum diumumkan.' });
    const updated = await prisma.employee.update({
      where: { id: emp.id },
      data: { announcedAt: null, announcedById: null },
      include: EMPLOYEE_INCLUDE
    });
    return res.json({ success: true, message: 'Pengumuman ditarik.', data: publicEmployee(updated, req.user) });
  } catch (error) {
    console.error('Error withdrawing announcement:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Whole recruitment journey behind an employee record */
async function getEmployeeJourney(req, res) {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: String(req.params.id) },
      include: {
        ...EMPLOYEE_INCLUDE,
        job: { select: { id: true, title: true, department: true, division: true, location: true, hiringManagerId: true, hiringManager: { select: { name: true } } } }
      }
    });
    if (!emp || !canAccessJob(req.user, emp.job)) return res.status(404).json({ success: false, message: 'Data karyawan tidak ditemukan.' });

    const app = emp.applicationId
      ? await prisma.jobApplication.findUnique({
          where: { id: emp.applicationId },
          select: {
            id: true,
            status: true,
            appliedAt: true,
            atsScore: true,
            skillsScore: true,
            expScore: true,
            eduScore: true,
            matchedKeywords: true,
            missingKeywords: true,
            scorecardRating: true,
            releasedAt: true,
            assignedRecruiter: { select: { id: true, name: true } },
            candidate: {
              select: {
                id: true, fullName: true, email: true, headline: true, location: true, currentCompany: true,
                totalExperienceYrs: true, intakeSource: true, rawResumePath: true
              }
            },
            activities: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { id: true, name: true } } } },
            stageRequests: {
              orderBy: { createdAt: 'asc' },
              include: { requestedBy: { select: { id: true, name: true } }, decidedBy: { select: { id: true, name: true } } }
            }
          }
        })
      : null;

    const { hiringManagerId, ...job } = emp.job || {};
    const base = { employee: publicEmployee({ ...emp, job: emp.job ? job : null }, req.user) };
    if (!app) return res.json({ success: true, data: { ...base, application: null, journey: null } });

    const { activities, stageRequests, candidate, ...application } = app;
    const { rawResumePath, ...candidatePublic } = candidate || {};
    return res.json({
      success: true,
      data: {
        ...base,
        application,
        candidate: candidate ? { ...candidatePublic, hasResume: !!rawResumePath } : null,
        journey: buildJourney({ application: app, activities, requests: stageRequests, employee: emp })
      }
    });
  } catch (error) {
    console.error('Error building employee journey:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Take HIRED cards off the board without registering them here */
async function releaseHires(req, res) {
  try {
    const ids = Array.isArray(req.body && req.body.applicationIds) ? [...new Set(req.body.applicationIds.filter(Boolean).map(String))] : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'Select at least one application.' });

    const apps = await prisma.jobApplication.findMany({
      where: { id: { in: ids } },
      select: {
        id: true, status: true, releasedAt: true, assignedRecruiterId: true,
        stageRequests: { where: { status: PENDING }, select: { id: true }, take: 1 }
      }
    });
    const ok = apps.filter((a) => a.status === 'HIRED' && !a.releasedAt && !a.stageRequests.length && canHandleHire(req.user, a)).map((a) => a.id);
    const deniedIds = ids.filter((id) => !ok.includes(id));
    if (!ok.length) {
      return res.status(403).json({ success: false, message: 'Only Hired candidates you own (or any, for a TA Lead) can be released.', data: { releasedIds: [], deniedIds } });
    }

    await prisma.$transaction([
      prisma.jobApplication.updateMany({ where: { id: { in: ok }, releasedAt: null }, data: { releasedAt: new Date() } }),
      prisma.applicationActivity.createMany({ data: ok.map((id) => ({ applicationId: id, actorId: req.user.id, action: 'HIRE_RELEASED' })) })
    ]);
    return res.json({
      success: true,
      message: `${ok.length} hire(s) released from the pipeline.${deniedIds.length ? ` ${deniedIds.length} skipped.` : ''}`,
      data: { releasedIds: ok, deniedIds }
    });
  } catch (error) {
    console.error('Error releasing hires:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Undo a release (only while the hire is not registered as an employee) */
async function restoreHire(req, res) {
  try {
    const app = await prisma.jobApplication.findUnique({
      where: { id: String((req.body && req.body.applicationId) || '') },
      select: { id: true, status: true, releasedAt: true, assignedRecruiterId: true, employee: { select: { id: true } } }
    });
    if (!app) return res.status(404).json({ success: false, message: 'Lamaran tidak ditemukan.' });
    if (!app.releasedAt) return res.status(409).json({ success: false, message: 'Kandidat ini masih ada di pipeline.' });
    if (app.employee) return res.status(409).json({ success: false, message: 'Sudah terdaftar sebagai karyawan — tidak bisa dikembalikan ke pipeline.' });
    if (!canHandleHire(req.user, app)) return res.status(403).json({ success: false, message: 'Hanya PIC kandidat ini atau TA Lead yang dapat mengembalikannya.' });

    await prisma.$transaction([
      prisma.jobApplication.update({ where: { id: app.id }, data: { releasedAt: null } }),
      prisma.applicationActivity.create({ data: { applicationId: app.id, actorId: req.user.id, action: 'HIRE_RESTORED' } })
    ]);
    return res.json({ success: true, message: 'Dikembalikan ke kolom Hired di pipeline.' });
  } catch (error) {
    console.error('Error restoring hire:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Internal board: no contact details, visible to every CMS user */
async function listAnnouncements(req, res) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    const rows = await prisma.employee.findMany({
      where: { announcedAt: { not: null } },
      orderBy: { announcedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        fullName: true,
        position: true,
        department: true,
        division: true,
        workLocation: true,
        employmentStatus: true,
        joinDate: true,
        managerName: true,
        announcementMessage: true,
        announcedAt: true,
        announcedBy: { select: { id: true, name: true } }
      }
    });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listing announcements:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function exportEmployees(req, res) {
  try {
    const rows = await prisma.employee.findMany({
      where: employeeWhere(req),
      orderBy: [{ joinDate: 'desc' }, { createdAt: 'desc' }],
      include: { createdBy: { select: { name: true } } }
    });
    const wb = new ExcelJS.Workbook();
    wb.creator = 'MRA HR HUB';
    const ws = wb.addWorksheet('Karyawan Baru');
    ws.columns = [
      { header: 'NIK', key: 'employeeNo', width: 16 },
      { header: 'Nama Lengkap', key: 'fullName', width: 28 },
      { header: 'Jabatan', key: 'position', width: 30 },
      { header: 'Departemen', key: 'department', width: 22 },
      { header: 'Divisi / Unit', key: 'division', width: 20 },
      { header: 'Lokasi Kerja', key: 'workLocation', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Bergabung', key: 'joinDate', width: 16 },
      { header: 'Atasan Langsung', key: 'managerName', width: 22 },
      { header: 'Email Pribadi', key: 'personalEmail', width: 28 },
      { header: 'Email Kantor', key: 'workEmail', width: 28 },
      { header: 'No. HP', key: 'phone', width: 16 },
      { header: 'Didaftarkan Oleh', key: 'createdBy', width: 20 },
      { header: 'Catatan', key: 'notes', width: 30 }
    ];
    rows.forEach((e) => ws.addRow({
      ...e,
      status: STATUS_LABELS[e.employmentStatus] || e.employmentStatus,
      createdBy: e.createdBy ? e.createdBy.name : ''
    }));
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
    ws.getColumn('joinDate').numFmt = 'dd mmm yyyy';

    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="karyawan-baru_${stamp}.xlsx"`);
    await wb.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Error exporting employees:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  canHandleHire,
  listEmployees,
  listPendingHires,
  getEmployeeJourney,
  prefillEmployee,
  registerEmployee,
  updateEmployee,
  announceEmployee,
  withdrawAnnouncement,
  releaseHires,
  restoreHire,
  listAnnouncements,
  exportEmployees
};
