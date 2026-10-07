/**
 * Talenta master data the Add Employee payload must match by name:
 * branches, organizations, job positions, job levels, employment statuses.
 * Normalised to { id, name } lists and cached for 10 minutes per mode.
 */
const prisma = require('../../api/db');
const { talentaConfig } = require('../../config/talenta');
const { talentaRequest } = require('./talentaClient');
const mock = require('./talentaMock');

const TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const names = (rows, nameKey = 'name') => (Array.isArray(rows) ? rows : []).map((r) => ({ id: r.id, name: r[nameKey] })).filter((r) => r.name);

async function fetchLive(cfg) {
  const cid = encodeURIComponent(cfg.companyId);
  const get = (path) => talentaRequest('GET', path, undefined, cfg);
  const [branches, organizations, jobPositions, jobLevels, statuses] = await Promise.all([
    get('/v2/talenta/v3/company/branch'),
    get(`/v2/talenta/v2/company/${cid}/organization?page=1&limit=500`),
    get(`/v2/talenta/v3/company/${cid}/job-positions?page=1&limit=500&status=1`),
    get('/v2/talenta/v3/company/job-levels?page=1&limit=100&status=1'),
    get(`/v2/talenta/v2/company/${cid}/employment-status`)
  ]);
  return {
    branches: names(branches?.data?.branches),
    organizations: names(organizations?.data?.organizations),
    jobPositions: names(jobPositions?.data?.job_position),
    jobLevels: names(jobLevels?.data?.job_levels),
    employmentStatuses: names(statuses?.data?.employment_statuses)
  };
}

/** @returns {Promise<{ branches, organizations, jobPositions, jobLevels, employmentStatuses, fetchedAt }>} */
async function getMasterData({ refresh = false } = {}) {
  const cfg = talentaConfig();
  const hit = cache.get(cfg.mode);
  if (!refresh && hit && Date.now() - hit.at < TTL_MS) return hit.data;

  let data;
  if (cfg.mode === 'mock') {
    // The simulator knows the job titles used in HR HUB so prefilled positions are valid
    const jobs = await prisma.jobPosting.findMany({ select: { title: true } });
    mock.setKnownPositions(jobs.map((j) => j.title));
    data = mock.masterData();
  } else {
    data = await fetchLive(cfg);
  }
  data = { ...data, fetchedAt: new Date().toISOString() };
  cache.set(cfg.mode, { at: Date.now(), data });
  return data;
}

module.exports = { getMasterData };
