const prisma = require('../api/db');
const { SALARY_MODES, normalizeSalary, publicJob } = require('../services/jobSalary');
const { companyError } = require('./companyController');

const COMPANY = { select: { id: true, code: true, name: true } };

const CLOSED = ['HIRED', 'REJECTED', 'TALENT_POOL'];

/**
 * Whitelist + normalize job fields from a request body.
 * Only these fields can ever be written (no id / slug / timestamps from the client).
 * @returns {{ data?: object, error?: string }}
 */
function sanitizeJobInput(body, { partial }) {
  const data = {};
  const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());
  const list = (v) =>
    (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
      .map((s) => str(s))
      .filter(Boolean)
      .filter((s, i, arr) => arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i);
  const money = (v) => (v === '' || v == null ? null : Number(v));

  for (const key of ['title', 'department', 'division', 'location', 'employmentType', 'minEducation', 'description', 'requirements']) {
    if (body[key] !== undefined) data[key] = str(body[key]);
  }
  if (body.minExperience !== undefined) data.minExperience = Math.max(0, parseInt(body.minExperience, 10) || 0);
  if (body.salaryMin !== undefined) data.salaryMin = money(body.salaryMin);
  if (body.salaryMax !== undefined) data.salaryMax = money(body.salaryMax);
  if (body.salaryVisibility !== undefined) {
    if (!SALARY_MODES.includes(body.salaryVisibility)) return { error: 'Invalid salary visibility.' };
    data.salaryVisibility = body.salaryVisibility;
  }
  if (body.mustHaveSkills !== undefined) data.mustHaveSkills = list(body.mustHaveSkills);
  if (body.niceToHaveSkills !== undefined) data.niceToHaveSkills = list(body.niceToHaveSkills);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.hiringManagerId !== undefined) data.hiringManagerId = body.hiringManagerId ? String(body.hiringManagerId) : null;
  if (body.companyId !== undefined) data.companyId = body.companyId ? String(body.companyId) : null;

  if (!partial && (!data.title || !data.department)) return { error: 'Title and department are required.' };
  if (partial && (data.title === '' || data.department === '')) return { error: 'Title and department cannot be empty.' };
  for (const k of ['salaryMin', 'salaryMax']) {
    if (data[k] != null && (!Number.isFinite(data[k]) || data[k] < 0)) return { error: 'Salary must be a non-negative number.' };
  }
  return { data };
}

/** The assigned Hiring Manager must be an active HIRING_MANAGER user */
async function hiringManagerError(hiringManagerId) {
  if (!hiringManagerId) return null;
  const u = await prisma.user.findUnique({ where: { id: hiringManagerId }, select: { role: true, isActive: true } });
  return u && u.role === 'HIRING_MANAGER' && u.isActive ? null : 'Hiring manager is invalid or inactive.';
}

/** GET /api/jobs/hiring-managers (jobs.manage) — options for the job form */
async function listHiringManagers(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'HIRING_MANAGER', isActive: true },
      select: { id: true, name: true, email: true, _count: { select: { managedJobs: true } } },
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, data: users.map(({ _count, ...u }) => ({ ...u, jobCount: _count.managedJobs })) });
  } catch (error) {
    console.error('Error listing hiring managers:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** salaryMin must not exceed salaryMax (checked against stored values on partial updates) */
function salaryRangeError(min, max) {
  return min != null && max != null && Number(min) > Number(max) ? 'Minimum salary cannot exceed maximum salary.' : null;
}

async function listJobs(req, res) {
  try {
    const { department, division, activeOnly } = req.query;
    const where = {};
    if (department) where.department = department;
    if (division) where.division = division;
    if (activeOnly === 'true' || activeOnly === undefined) where.isActive = true;

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true }
        },
        ...(req.jobsManagement ? { company: COMPANY } : {})
      }
    });

    return res.json({
      success: true,
      data: req.jobsManagement ? jobs : jobs.map(publicJob)
    });
  } catch (error) {
    console.error('Error listing jobs:', error);
    return res.status(500).json({ success: false, message: 'Failed to load jobs.' });
  }
}

/**
 * Public job permalink. Never includes applicants (their profiles are private).
 */
async function getJobById(req, res) {
  try {
    const job = await prisma.jobPosting.findFirst({
      where: { id: req.params.id, isActive: true },
      include: { _count: { select: { applications: true } } }
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    return res.json({ success: true, data: publicJob(job) });
  } catch (error) {
    console.error('Error fetching job detail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/jobs/:id/manage (CMS, jobs.manage) — full job incl. closed ones, plus an applicant summary.
 */
async function getJobForManagement(req, res) {
  try {
    const job = await prisma.jobPosting.findUnique({
      where: { id: req.params.id },
      include: { hiringManager: { select: { id: true, name: true, email: true } }, company: COMPANY }
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    const apps = await prisma.jobApplication.findMany({
      where: { jobId: job.id },
      orderBy: { atsScore: 'desc' },
      select: {
        id: true,
        status: true,
        atsScore: true,
        appliedAt: true,
        candidate: { select: { id: true, fullName: true, headline: true } },
        assignedRecruiter: { select: { name: true } }
      }
    });

    const byStatus = apps.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
    const avgAts = apps.length ? Math.round(apps.reduce((n, a) => n + (a.atsScore || 0), 0) / apps.length) : null;

    return res.json({
      success: true,
      data: {
        job,
        summary: {
          total: apps.length,
          active: apps.filter((a) => !CLOSED.includes(a.status)).length,
          hired: byStatus.HIRED || 0,
          avgAts,
          byStatus,
          lastAppliedAt: apps.reduce((t, a) => (!t || a.appliedAt > t ? a.appliedAt : t), null)
        },
        topCandidates: apps.filter((a) => !['REJECTED'].includes(a.status)).slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error fetching job for management:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createJob(req, res) {
  try {
    const { data, error } = sanitizeJobInput(req.body, { partial: false });
    if (error) return res.status(400).json({ success: false, message: error });
    normalizeSalary(data);
    const rangeError =
      salaryRangeError(data.salaryMin, data.salaryMax) || (await hiringManagerError(data.hiringManagerId)) || (await companyError(data.companyId));
    if (rangeError) return res.status(400).json({ success: false, message: rangeError });
    if (!data.companyId && (await prisma.company.count({ where: { isActive: true } }))) {
      return res.status(400).json({ success: false, message: 'Choose the hiring company (PT).' });
    }

    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;

    const newJob = await prisma.jobPosting.create({
      data: {
        division: 'MRA Group',
        location: 'Jakarta',
        employmentType: 'Full-time',
        minExperience: 0,
        minEducation: 'S1',
        description: '',
        requirements: '',
        mustHaveSkills: [],
        niceToHaveSkills: [],
        ...data,
        slug
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Job published successfully.',
      data: newJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateJob(req, res) {
  try {
    const { data, error } = sanitizeJobInput(req.body, { partial: true });
    if (error) return res.status(400).json({ success: false, message: error });

    const current = await prisma.jobPosting.findUnique({
      where: { id: req.params.id },
      select: { salaryMin: true, salaryMax: true, salaryVisibility: true }
    });
    if (!current) return res.status(404).json({ success: false, message: 'Job not found.' });
    normalizeSalary(data, current);

    const rangeError = salaryRangeError(
      data.salaryMin !== undefined ? data.salaryMin : current.salaryMin,
      data.salaryMax !== undefined ? data.salaryMax : current.salaryMax
    );
    if (rangeError) return res.status(400).json({ success: false, message: rangeError });
    const hmError = (await hiringManagerError(data.hiringManagerId)) || (await companyError(data.companyId));
    if (hmError) return res.status(400).json({ success: false, message: hmError });

    const updatedJob = await prisma.jobPosting.update({ where: { id: req.params.id }, data });

    return res.json({
      success: true,
      message: 'Job updated successfully.',
      data: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Deleting a job cascades to its applications and their history, so jobs that
 * already have applicants can only be closed (isActive = false).
 */
async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    const applicants = await prisma.jobApplication.count({ where: { jobId: id } });
    if (applicants > 0) {
      return res.status(409).json({
        success: false,
        message: `This job has ${applicants} applicants. Close it to preserve application history.`
      });
    }
    await prisma.jobPosting.delete({ where: { id } });
    return res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Job not found.' });
    console.error('Error deleting job:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  // exported for unit tests
  sanitizeJobInput,
  salaryRangeError,
  listJobs,
  getJobById,
  getJobForManagement,
  listHiringManagers,
  createJob,
  updateJob,
  deleteJob
};
