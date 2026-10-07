const SALARY_MODES = ['PUBLIC', 'CONFIDENTIAL', 'UNSPECIFIED'];

function normalizeSalary(data, current = {}) {
  const mode = data.salaryVisibility ?? current.salaryVisibility ?? 'PUBLIC';
  if (!SALARY_MODES.includes(mode)) return 'Invalid salary visibility.';
  if (mode === 'UNSPECIFIED') {
    data.salaryMin = null;
    data.salaryMax = null;
  }
  return null;
}

// Apply at the public API boundary, never just in the browser.
function publicJob(job) {
  if (job.salaryVisibility === 'PUBLIC') return job;
  return { ...job, salaryMin: null, salaryMax: null };
}

module.exports = { SALARY_MODES, normalizeSalary, publicJob };
