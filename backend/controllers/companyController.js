/**
 * Legal entities (PT) of MRA Group.
 *   GET   /api/companies       → list with job / employee counts (any CMS user — options for forms & filters)
 *   POST  /api/companies       → create (company.manage)
 *   PATCH /api/companies/:id   → update / activate / deactivate (company.manage)
 * Companies are never deleted: jobs and employees keep pointing at them.
 */
const prisma = require('../api/db');
const { sanitizeCompanyInput } = require('../services/companyInput');

const WITH_COUNTS = { _count: { select: { jobs: true, employees: true } } };

/** Name / code already used by another company → message, else null (checked up front: clearer than P2002) */
async function duplicateError(data, exceptId) {
  const or = [];
  if (data.code) or.push({ code: data.code });
  if (data.name) or.push({ name: { equals: data.name, mode: 'insensitive' } });
  if (!or.length) return null;
  const hit = await prisma.company.findFirst({ where: { OR: or, ...(exceptId ? { NOT: { id: exceptId } } : {}) }, select: { code: true, name: true } });
  if (!hit) return null;
  return data.code && hit.code === data.code
    ? `Short code ${data.code} is already used by ${hit.name}.`
    : `${hit.name} already exists.`;
}
const RACE = 'A company with that name or code already exists.';

async function listCompanies(req, res) {
  try {
    const where = req.query.active === '1' ? { isActive: true } : {};
    const rows = await prisma.company.findMany({ where, orderBy: [{ isActive: 'desc' }, { name: 'asc' }], include: WITH_COUNTS });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listing companies:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createCompany(req, res) {
  try {
    const { data, errors } = sanitizeCompanyInput(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
    const dup = await duplicateError(data);
    if (dup) return res.status(409).json({ success: false, message: dup });
    const row = await prisma.company.create({ data, include: WITH_COUNTS });
    return res.status(201).json({ success: true, message: `${row.name} added.`, data: row });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: RACE });
    console.error('Error creating company:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateCompany(req, res) {
  try {
    const { data, errors } = sanitizeCompanyInput(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
    if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'Nothing to update.' });
    const dup = await duplicateError(data, String(req.params.id));
    if (dup) return res.status(409).json({ success: false, message: dup });
    const row = await prisma.company.update({ where: { id: String(req.params.id) }, data, include: WITH_COUNTS });
    return res.json({ success: true, message: `${row.name} updated.`, data: row });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Company not found.' });
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: RACE });
    console.error('Error updating company:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** ?companyId= filter value: 'none' = no PT set, '' = no filter */
function companyFilterValue(v) {
  if (!v) return undefined;
  return v === 'none' ? null : String(v);
}

/** For job / employee writes: null when ok, otherwise an error message */
async function companyError(companyId) {
  if (!companyId) return null;
  const c = await prisma.company.findUnique({ where: { id: String(companyId) }, select: { isActive: true } });
  return c && c.isActive ? null : 'Selected company (PT) is invalid or inactive.';
}

module.exports = { listCompanies, createCompany, updateCompany, companyError, companyFilterValue };
