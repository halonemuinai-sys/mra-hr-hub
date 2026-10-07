/**
 * Local Talenta simulator (TALENTA_MODE=mock). Mimics the documented responses and error
 * format ({ message, errors: [] }) for the endpoints HR HUB uses, so the whole flow can be
 * built and tested before Mekari credentials exist. State lives in memory (reset on restart).
 */

const MASTERS = {
  branches: ['Pusat', 'Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Barat', 'Tangerang Selatan', 'Bekasi', 'Depok', 'Bandung', 'Surabaya', 'Bali'],
  organizations: ['BOD', 'HRD & GA', 'Finance & Accounting', 'IT', 'Legal & Compliance', 'Marketing', 'Retail Operations', 'F&B Operations', 'Media & Radio', 'Supply Chain'],
  jobLevels: ['Staff', 'Senior Staff', 'Supervisor', 'Manager', 'Senior Manager', 'Director'],
  employmentStatuses: ['Permanent', 'Contract', 'Probation']
};

const state = { nextUserId: 4500001, nextAuto: 1, employees: [] };

const list = (names, offset) => names.map((name, i) => ({ id: offset + i, name }));
const fail = (status, errors) => {
  const err = new Error(errors[0] || 'Bad request');
  err.status = status;
  err.body = { message: status === 400 ? 'Bad request' : 'Error', data: null, errors };
  throw err;
};

/** Job positions accepted by the simulator: the standard list plus whatever HR HUB jobs use */
let extraPositions = [];
function setKnownPositions(titles) {
  extraPositions = [...new Set(titles.filter(Boolean))];
}

function masterData() {
  return {
    branches: list(MASTERS.branches, 100),
    organizations: list(MASTERS.organizations, 79740),
    jobPositions: list([...new Set(['Staff', ...extraPositions])], 1133400),
    jobLevels: list(MASTERS.jobLevels, 74280),
    employmentStatuses: list(MASTERS.employmentStatuses, 960)
  };
}

function addEmployee(body) {
  const errors = [];
  const has = (k) => body[k] !== undefined && body[k] !== null && body[k] !== '';
  ['first_name', 'email', 'date_of_birth', 'gender', 'marital_status', 'religion', 'branch', 'organization_name', 'job_position',
    'job_level', 'employment_status', 'join_date', 'basic_salary', 'ptkp_status', 'tax_configuration', 'type_salary',
    'salary_configuration', 'employee_tax_status', 'jht_configuration', 'jp_configuration', 'npp_bpjs_ketenagakerjaan',
    'bpjs_kesehatan_config', 'overtime_status'].forEach((k) => !has(k) && errors.push(`${k} is required`));

  const m = masterData();
  const exists = (listName, v) => m[listName].some((x) => x.name === v);
  if (has('branch') && !exists('branches', body.branch)) errors.push(`branch ${body.branch} doesn't exist`);
  if (has('organization_name') && !exists('organizations', body.organization_name)) errors.push(`organization ${body.organization_name} doesn't exist`);
  if (has('job_position') && !exists('jobPositions', body.job_position)) errors.push(`job position ${body.job_position} doesn't exist`);
  if (has('job_level') && !exists('jobLevels', body.job_level)) errors.push(`job level ${body.job_level} doesn't exist`);
  if (state.employees.some((e) => e.email === body.email)) errors.push(`email ${body.email} has already been taken`);
  if (body.employee_id && state.employees.some((e) => e.employee_id === body.employee_id)) {
    errors.push(`invalid data: employee_id ${body.employee_id} has already been taken`);
  }
  if (errors.length) fail(400, errors);

  const employee = {
    user_id: state.nextUserId++,
    employee_id: body.employee_id || `MRA-T${String(state.nextAuto++).padStart(5, '0')}`,
    email: body.email,
    body
  };
  state.employees.push(employee);
  return { message: 'Succesfully create new employee', data: { user_id: employee.user_id }, request_id: `mock-${Date.now()}` };
}

function getEmployee(userId) {
  const e = state.employees.find((x) => String(x.user_id) === String(userId));
  if (!e) fail(404, ['employee not found']);
  return {
    message: 'Get employee info successfully',
    data: {
      employee: {
        user_id: e.user_id,
        personal: { first_name: e.body.first_name, last_name: e.body.last_name, email: e.email },
        employment: { employee_id: e.employee_id, branch: e.body.branch, job_position: e.body.job_position, status: 'Active' }
      }
    }
  };
}

/** Route a request the way the real API would */
async function handle(method, path, body) {
  const p = path.split('?')[0];
  if (method === 'POST' && p === '/v2/talenta/v3/employee') return addEmployee(body || {});
  const m = /^\/v2\/talenta\/v2\/employee\/(\d+)$/.exec(p);
  if (method === 'GET' && m) return getEmployee(m[1]);
  fail(404, [`mock: ${method} ${p} is not simulated`]);
}

module.exports = { handle, masterData, setKnownPositions };
