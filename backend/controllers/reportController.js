/**
 * GET /api/reports/recruitment.xlsx?from=YYYY-MM-DD&to=YYYY-MM-DD  (team.monitor)
 * Recruitment report workbook for a period (defaults to the current month).
 * Contains candidate names and emails, hence the Super Admin / TA Lead permission.
 */
const ExcelJS = require('exceljs');
const prisma = require('../api/db');
const { CLOSED } = require('../config/stageRules');

const DAY = 86400000;
const STAGE_ID = {
  APPLIED: 'Baru Masuk', ATS_SCREENED: 'Lolos ATS', SHORTLISTED: 'Shortlisted', INTERVIEW_HR: 'Interview HR',
  INTERVIEW_USER: 'Interview User', OFFERING: 'Offering', HIRED: 'Diterima', REJECTED: 'Ditolak', TALENT_POOL: 'Talent Pool'
};
const SOURCE_ID = { ATS_RESUME_UPLOAD: 'Upload CV', EXCEL_TEMPLATE: 'Template Excel', MANUAL_INPUT: 'Input manual' };

const avg = (xs) => (xs.length ? Math.round((xs.reduce((n, x) => n + x, 0) / xs.length) * 10) / 10 : null);
const shortName = (n) => String(n || '').replace(/\s*\(.*\)\s*$/, '');

/** Parse ?from/&to (inclusive dates); default = current calendar month */
function resolvePeriod(query) {
  const now = new Date();
  const from = query.from ? new Date(`${query.from}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = query.to ? new Date(`${query.to}T23:59:59.999`) : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
  if (to - from > 366 * DAY) return null;
  return { from, to };
}

function styleSheet(ws, widths) {
  ws.columns.forEach((c, i) => (c.width = widths[i] || 16));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  header.alignment = { vertical: 'middle' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
}

async function downloadRecruitmentReport(req, res) {
  try {
    const period = resolvePeriod(req.query);
    if (!period) return res.status(400).json({ success: false, message: 'Periode tidak valid (maksimal 1 tahun, format YYYY-MM-DD).' });
    const { from, to } = period;

    const [apps, moves, claims] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { appliedAt: { gte: from, lte: to } },
        orderBy: { appliedAt: 'asc' },
        select: {
          id: true,
          status: true,
          atsScore: true,
          appliedAt: true,
          jobId: true,
          candidate: { select: { fullName: true, email: true, phone: true, intakeSource: true } },
          job: { select: { title: true, division: true, isActive: true } },
          assignedRecruiter: { select: { name: true } }
        }
      }),
      prisma.applicationActivity.findMany({
        where: { action: 'STAGE_CHANGE', createdAt: { gte: from, lte: to } },
        select: {
          toStatus: true,
          createdAt: true,
          actor: { select: { id: true, name: true } },
          application: {
            select: {
              id: true,
              appliedAt: true,
              candidate: { select: { fullName: true, email: true } },
              job: { select: { title: true } },
              assignedRecruiter: { select: { name: true } }
            }
          }
        }
      }),
      prisma.applicationActivity.findMany({
        where: { action: 'CLAIM', createdAt: { gte: from, lte: to } },
        select: { createdAt: true, actor: { select: { id: true, name: true } }, application: { select: { appliedAt: true } } }
      })
    ]);

    const hires = moves.filter((m) => m.toStatus === 'HIRED');
    const rejections = moves.filter((m) => m.toStatus === 'REJECTED');
    const daysToHire = (m) => Math.round(((new Date(m.createdAt) - new Date(m.application.appliedAt)) / DAY) * 10) / 10;

    const wb = new ExcelJS.Workbook();
    wb.creator = 'MRA HR HUB';
    wb.created = new Date();
    const fmt = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    // 1. Summary
    const sum = wb.addWorksheet('Ringkasan');
    sum.columns = [{ header: 'Metrik', key: 'k' }, { header: 'Nilai', key: 'v' }];
    const rows = [
      ['Periode', `${fmt(from)} – ${fmt(to)}`],
      ['Lamaran masuk', apps.length],
      ['Lowongan yang menerima lamaran', new Set(apps.map((a) => a.jobId)).size],
      ['Kandidat diterima (Hired) di periode', hires.length],
      ['Kandidat ditolak di periode', rejections.length],
      ['Rata-rata waktu lamar → Hired (hari)', avg(hires.map(daysToHire)) ?? '—'],
      ['Rata-rata skor ATS lamaran masuk', avg(apps.map((a) => a.atsScore || 0)) ?? '—'],
      ['Lamaran masuk yang masih aktif', apps.filter((a) => !CLOSED.includes(a.status)).length],
      ['Lamaran masuk yang belum diambil recruiter', apps.filter((a) => !a.assignedRecruiter && !CLOSED.includes(a.status)).length],
      [],
      ['Sumber pelamar', ''],
      ...Object.entries(SOURCE_ID).map(([k, label]) => [`  ${label}`, apps.filter((a) => a.candidate.intakeSource === k).length]),
      [],
      ['Posisi tahap saat ini (lamaran periode ini)', ''],
      ...Object.entries(STAGE_ID).map(([k, label]) => [`  ${label}`, apps.filter((a) => a.status === k).length])
    ];
    rows.forEach((r) => sum.addRow(r));
    styleSheet(sum, [46, 28]);

    // 2. Per job
    const perJob = wb.addWorksheet('Per Lowongan');
    perJob.columns = [
      { header: 'Lowongan', key: 'title' }, { header: 'Divisi', key: 'division' }, { header: 'Status', key: 'state' },
      { header: 'Pelamar', key: 'n' }, { header: 'Aktif', key: 'active' }, { header: 'Interview', key: 'interview' },
      { header: 'Offering', key: 'offering' }, { header: 'Diterima', key: 'hired' }, { header: 'Ditolak', key: 'rejected' },
      { header: 'Rata-rata ATS', key: 'ats' }
    ];
    const byJob = new Map();
    apps.forEach((a) => byJob.set(a.jobId, [...(byJob.get(a.jobId) || []), a]));
    [...byJob.values()]
      .sort((x, y) => y.length - x.length)
      .forEach((list) => {
        const j = list[0].job;
        perJob.addRow({
          title: j.title,
          division: j.division,
          state: j.isActive ? 'Aktif' : 'Ditutup',
          n: list.length,
          active: list.filter((a) => !CLOSED.includes(a.status)).length,
          interview: list.filter((a) => ['INTERVIEW_HR', 'INTERVIEW_USER'].includes(a.status)).length,
          offering: list.filter((a) => a.status === 'OFFERING').length,
          hired: list.filter((a) => a.status === 'HIRED').length,
          rejected: list.filter((a) => a.status === 'REJECTED').length,
          ats: avg(list.map((a) => a.atsScore || 0))
        });
      });
    styleSheet(perJob, [44, 34, 10, 10, 9, 10, 10, 10, 10, 13]);

    // 3. Per recruiter
    const perRec = wb.addWorksheet('Per Recruiter');
    perRec.columns = [
      { header: 'Recruiter', key: 'name' }, { header: 'Kandidat diambil', key: 'claims' }, { header: 'Pindah tahap', key: 'moves' },
      { header: 'Diterima', key: 'hired' }, { header: 'Ditolak', key: 'rejected' }, { header: 'Rata-rata kecepatan ambil (jam)', key: 'speed' }
    ];
    const actors = new Map();
    const bump = (actor, key, val = 1) => {
      if (!actor) return;
      const row = actors.get(actor.id) || { name: shortName(actor.name), claims: 0, moves: 0, hired: 0, rejected: 0, speeds: [] };
      if (key === 'speeds') row.speeds.push(val);
      else row[key] += val;
      actors.set(actor.id, row);
    };
    claims.forEach((c) => {
      bump(c.actor, 'claims');
      bump(c.actor, 'speeds', (new Date(c.createdAt) - new Date(c.application.appliedAt)) / 3600000);
    });
    moves.forEach((m) => {
      bump(m.actor, 'moves');
      if (m.toStatus === 'HIRED') bump(m.actor, 'hired');
      if (m.toStatus === 'REJECTED') bump(m.actor, 'rejected');
    });
    [...actors.values()]
      .sort((x, y) => y.moves - x.moves)
      .forEach((r) => perRec.addRow({ ...r, speed: avg(r.speeds) }));
    styleSheet(perRec, [30, 16, 14, 10, 10, 28]);

    // 4. Hires
    const hired = wb.addWorksheet('Diterima');
    hired.columns = [
      { header: 'Kandidat', key: 'name' }, { header: 'Email', key: 'email' }, { header: 'Lowongan', key: 'job' },
      { header: 'Tanggal lamar', key: 'applied' }, { header: 'Tanggal diterima', key: 'hired' }, { header: 'Hari ke Hired', key: 'days' },
      { header: 'PIC', key: 'pic' }
    ];
    hires.forEach((m) =>
      hired.addRow({
        name: m.application.candidate.fullName,
        email: m.application.candidate.email,
        job: m.application.job.title,
        applied: new Date(m.application.appliedAt),
        hired: new Date(m.createdAt),
        days: daysToHire(m),
        pic: shortName(m.application.assignedRecruiter?.name) || '—'
      })
    );
    styleSheet(hired, [28, 34, 40, 14, 16, 13, 24]);

    // 5. Applicants
    const list = wb.addWorksheet('Pelamar');
    list.columns = [
      { header: 'Kandidat', key: 'name' }, { header: 'Email', key: 'email' }, { header: 'Telepon', key: 'phone' },
      { header: 'Lowongan', key: 'job' }, { header: 'Sumber', key: 'source' }, { header: 'Tahap saat ini', key: 'stage' },
      { header: 'Skor ATS', key: 'ats' }, { header: 'Tanggal lamar', key: 'applied' }, { header: 'PIC', key: 'pic' }
    ];
    apps.forEach((a) =>
      list.addRow({
        name: a.candidate.fullName,
        email: a.candidate.email,
        phone: a.candidate.phone,
        job: a.job.title,
        source: SOURCE_ID[a.candidate.intakeSource] || a.candidate.intakeSource,
        stage: STAGE_ID[a.status] || a.status,
        ats: Math.round(a.atsScore || 0),
        applied: new Date(a.appliedAt),
        pic: shortName(a.assignedRecruiter?.name) || 'Belum diambil'
      })
    );
    styleSheet(list, [28, 34, 16, 40, 16, 16, 10, 14, 24]);
    [hired.getColumn('applied'), hired.getColumn('hired'), list.getColumn('applied')].forEach((c) => (c.numFmt = 'dd mmm yyyy'));

    // Local calendar date (toISOString() would shift WIB midnight to the previous UTC day)
    const stamp = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-rekrutmen_${stamp(from)}_${stamp(to)}.xlsx"`);
    await wb.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Error building recruitment report:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { downloadRecruitmentReport, resolvePeriod };
