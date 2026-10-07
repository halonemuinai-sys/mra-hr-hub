/**
 * Talenta "Add Employee" (POST /v2/talenta/v3/employee) — field definitions, defaults and
 * payload builder. Pure (no DB / network) so it can be unit-tested.
 *
 * FIELDS drives both validation here and the form in the CMS (served as-is to the frontend).
 * Values are stored on Employee.talentaData; name, email, employee id, phone and join date
 * come from the Employee record itself.
 */

const opts = (pairs) => pairs.map(([value, label]) => ({ value: String(value), label }));

const SECTIONS = [
  { key: 'personal', label: 'Personal Data' },
  { key: 'employment', label: 'Placement in Talenta' },
  { key: 'payroll', label: 'Payroll & Tax' },
  { key: 'bpjs', label: 'BPJS' },
  { key: 'bank', label: 'Salary Account' }
];

/**
 * key: camelCase key in talentaData · api: Talenta attribute · type: text|date|select|number|master|checkbox
 * master: list name from the master-data endpoint · requiredIf: { key, in: [values] } (required when another field has one of these values)
 */
const FIELDS = [
  // Personal
  { key: 'dateOfBirth', api: 'date_of_birth', section: 'personal', label: 'Date of birth', type: 'date', required: true },
  { key: 'placeOfBirth', api: 'place_of_birth', section: 'personal', label: 'Place of birth', type: 'text' },
  { key: 'gender', api: 'gender', section: 'personal', label: 'Gender', type: 'select', required: true, int: true, options: opts([[1, 'Male'], [2, 'Female']]) },
  { key: 'maritalStatus', api: 'marital_status', section: 'personal', label: 'Marital status', type: 'select', required: true, int: true, options: opts([[1, 'Single'], [2, 'Married'], [3, 'Widow'], [4, 'Widower']]) },
  { key: 'religion', api: 'religion', section: 'personal', label: 'Religion', type: 'select', required: true, int: true, options: opts([[2, 'Islam'], [3, 'Christian'], [1, 'Catholic'], [5, 'Hindu'], [4, 'Buddhist'], [6, 'Confucian'], [8, 'Orthodox'], [7, 'Other']]) },
  { key: 'bloodType', api: 'blood_type', section: 'personal', label: 'Blood type', type: 'select', int: true, options: opts([[1, 'A'], [2, 'B'], [3, 'AB'], [4, 'O']]) },
  { key: 'citizenIdType', api: 'citizen_id_type', section: 'personal', label: 'ID type', type: 'select', int: true, options: opts([[1, 'KTP'], [2, 'Passport']]) },
  { key: 'citizenId', api: 'citizen_id', section: 'personal', label: 'ID number (KTP NIK / passport)', type: 'text', sensitive: true },
  { key: 'citizenAddress', api: 'citizen_address', section: 'personal', label: 'Address on ID', type: 'text' },
  { key: 'residentialAddress', api: 'residential_address', section: 'personal', label: 'Residential address', type: 'text' },
  { key: 'postalCode', api: 'postal_code', section: 'personal', label: 'Postal code', type: 'text', int: true, pattern: /^\d{5}$/, patternHint: '5 digits' },

  // Employment (names must match Talenta master data exactly)
  { key: 'branch', api: 'branch', section: 'employment', label: 'Branch', type: 'master', master: 'branches', required: true },
  { key: 'organizationName', api: 'organization_name', section: 'employment', label: 'Organization', type: 'master', master: 'organizations', required: true },
  { key: 'jobPosition', api: 'job_position', section: 'employment', label: 'Job position', type: 'master', master: 'jobPositions', required: true },
  { key: 'jobLevel', api: 'job_level', section: 'employment', label: 'Job level', type: 'master', master: 'jobLevels', required: true },
  { key: 'employmentStatus', api: 'employment_status', section: 'employment', label: 'Employment status', type: 'select', required: true, int: true, options: opts([[1, 'Permanent (full-time)'], [2, 'Contract'], [3, 'Probation']]) },
  {
    key: 'endEmploymentStatusDate', api: 'end_employment_status_date', section: 'employment', label: 'Contract / probation end date', type: 'date',
    requiredIf: { key: 'employmentStatus', in: ['2', '3'] }
  },
  { key: 'autoEmployeeId', section: 'employment', label: 'Let Talenta generate the employee ID (auto-generate)', type: 'checkbox' },

  // Payroll & tax
  { key: 'basicSalary', api: 'basic_salary', section: 'payroll', label: 'Basic salary (IDR)', type: 'number', required: true, sensitive: true },
  { key: 'typeSalary', api: 'type_salary', section: 'payroll', label: 'Salary type', type: 'select', required: true, int: true, options: opts([[1, 'Monthly'], [2, 'Daily']]) },
  { key: 'ptkpStatus', api: 'ptkp_status', section: 'payroll', label: 'PTKP status', type: 'select', required: true, int: true, options: opts([[1, 'TK/0'], [2, 'TK/1'], [3, 'TK/2'], [4, 'TK/3'], [5, 'K/0'], [6, 'K/1'], [7, 'K/2'], [8, 'K/3']]) },
  { key: 'taxConfiguration', api: 'tax_configuration', section: 'payroll', label: 'Tax method', type: 'select', required: true, int: true, options: opts([[1, 'Gross'], [2, 'Gross Up'], [3, 'Netto']]) },
  { key: 'salaryConfiguration', api: 'salary_configuration', section: 'payroll', label: 'Salary configuration', type: 'select', required: true, int: true, options: opts([[1, 'Taxable'], [2, 'Non-taxable']]) },
  {
    key: 'employeeTaxStatus', api: 'employee_tax_status', section: 'payroll', label: 'Employee tax status', type: 'select', required: true, int: true,
    options: opts([[0, 'Permanent employee'], [1, 'Non-permanent employee'], [2, 'Non-continuous employee'], [3, 'Expatriate'], [4, 'Domestic expatriate'], [5, 'Expert staff'], [6, 'Freelance']])
  },
  { key: 'overtimeStatus', api: 'overtime_status', section: 'payroll', label: 'Overtime', type: 'select', required: true, int: true, options: opts([[1, 'Eligible'], [2, 'Not eligible']]) },
  { key: 'npwp', section: 'payroll', label: 'NPWP', type: 'text', sensitive: true, pattern: /^(\d{15}|\d{16})$/, patternHint: '15 or 16 digits' },

  // BPJS
  { key: 'nppBpjsKetenagakerjaan', api: 'npp_bpjs_ketenagakerjaan', section: 'bpjs', label: 'NPP BPJS Ketenagakerjaan', type: 'text', required: true },
  { key: 'jhtConfiguration', api: 'jht_configuration', section: 'bpjs', label: 'JHT paid by', type: 'select', required: true, int: true, options: opts([[3, 'Company default'], [1, 'Company'], [2, 'Employee'], [0, 'Not paid']]) },
  { key: 'jpConfiguration', api: 'jp_configuration', section: 'bpjs', label: 'JP paid by', type: 'select', required: true, int: true, options: opts([[3, 'Company default'], [1, 'Company'], [2, 'Employee'], [0, 'Not paid']]) },
  { key: 'bpjsKesehatanConfig', api: 'bpjs_kesehatan_config', section: 'bpjs', label: 'BPJS Kesehatan paid by', type: 'select', required: true, int: true, options: opts([[3, 'Company default'], [1, 'Company'], [2, 'Employee']]) },
  { key: 'bpjsKetenagakerjaan', api: 'bpjs_ketenagakerjaan', section: 'bpjs', label: 'BPJS Ketenagakerjaan no.', type: 'text' },
  { key: 'bpjsKesehatan', api: 'bpjs_kesehatan', section: 'bpjs', label: 'BPJS Kesehatan no.', type: 'text' },

  // Bank (Bank ID mapping from the Talenta docs / GET company bank-list)
  {
    key: 'bankName', api: 'bank_name', section: 'bank', label: 'Bank', type: 'select',
    options: opts([[1, 'BCA'], [2, 'Mandiri'], [3, 'BRI'], [6, 'BNI'], [30, 'BSI'], [4, 'CIMB Niaga'], [9, 'Permata'], [7, 'Danamon'], [12, 'OCBC'], [11, 'BTN'], [10, 'Maybank'], [8, 'Panin'], [20, 'Bank DKI'], [94, 'Bank Jago']])
  },
  { key: 'bankAccount', api: 'bank_account', section: 'bank', label: 'Account number', type: 'text', sensitive: true, pattern: /^\d{6,20}$/, patternHint: 'digits only' },
  { key: 'bankAccountHolder', api: 'bank_account_holder', section: 'bank', label: 'Account holder name', type: 'text' }
];

const FIELD_KEYS = FIELDS.map((f) => f.key);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const EMPLOYMENT_STATUS_TO_TALENTA = { PERMANENT: '1', CONTRACT: '2', PROBATION: '3', INTERNSHIP: '2' };

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const dayString = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/** Keep only known keys, as trimmed strings / booleans (what we store in talentaData) */
function sanitizeTalentaData(input = {}) {
  const out = {};
  FIELDS.forEach((f) => {
    if (!Object.prototype.hasOwnProperty.call(input, f.key)) return;
    const v = input[f.key];
    if (f.type === 'checkbox') out[f.key] = !!v;
    else out[f.key] = isBlank(v) ? '' : String(v).trim().slice(0, 300);
  });
  return out;
}

/**
 * Suggested values before HR has filled anything.
 * @param {object} employee  Employee record
 * @param {object} ctx       { offerSalary?, companyBranch? (PT's default Talenta branch), masters?: { branches, organizations, jobPositions, jobLevels } }
 */
function defaultTalentaData(employee, ctx = {}) {
  const pick = (list, ...candidates) => {
    const names = (list || []).map((x) => x.name);
    for (const c of candidates) {
      if (!c) continue;
      const hit = names.find((n) => n.toLowerCase() === String(c).toLowerCase());
      if (hit) return hit;
    }
    return '';
  };
  const m = ctx.masters || {};
  const title = String(employee.position || '');
  const levelGuess = /director|direktur|head/i.test(title) ? 'Director'
    : /manager|manajer/i.test(title) ? 'Manager'
    : /supervisor|lead|koordinator/i.test(title) ? 'Supervisor'
    : 'Staff';

  return {
    branch: pick(m.branches, ctx.companyBranch, employee.workLocation),
    organizationName: pick(m.organizations, employee.department, employee.division),
    jobPosition: pick(m.jobPositions, employee.position) || employee.position || '',
    jobLevel: pick(m.jobLevels, levelGuess),
    employmentStatus: EMPLOYMENT_STATUS_TO_TALENTA[employee.employmentStatus] || '3',
    endEmploymentStatusDate: '',
    autoEmployeeId: false,
    basicSalary: ctx.offerSalary ? String(ctx.offerSalary) : '',
    citizenIdType: '1',
    // Company-policy defaults — HR adjusts per person
    typeSalary: '1',
    taxConfiguration: '1',
    salaryConfiguration: '1',
    employeeTaxStatus: '0',
    nppBpjsKetenagakerjaan: 'default',
    jhtConfiguration: '3',
    jpConfiguration: '3',
    bpjsKesehatanConfig: '3',
    bankAccountHolder: employee.fullName || ''
  };
}

function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') };
}

/**
 * @param {object} employee  Employee record (fullName, personalEmail, workEmail, employeeNo, phone, joinDate)
 * @param {object} data      talentaData (stored values)
 * @param {object} [masters] master-data lists; when given, master fields must match one of the names
 * @returns {{ payload: object, errors: string[] }}
 */
function buildEmployeePayload(employee, data = {}, masters = null) {
  const errors = [];
  const v = data || {};
  const name = splitName(employee.fullName);
  const email = employee.workEmail || employee.personalEmail;

  if (!name.first) errors.push('Employee name is empty.');
  if (!email) errors.push('Employee email is empty.');
  if (!employee.joinDate) errors.push('Join date is empty.');

  const payload = {
    first_name: name.first,
    last_name: name.last,
    email,
    mobile_phone_number: employee.phone || '',
    join_date: dayString(employee.joinDate)
  };
  if (!v.autoEmployeeId) payload.employee_id = employee.employeeNo;

  FIELDS.forEach((f) => {
    if (!f.api && f.key !== 'npwp') return;
    const raw = v[f.key];
    const required = f.required || (f.requiredIf && f.requiredIf.in.includes(String(v[f.requiredIf.key] ?? '')));
    if (isBlank(raw)) {
      if (required) errors.push(`${f.label} is required.`);
      return;
    }
    const s = String(raw).trim();
    if (f.type === 'date' && !DATE_RE.test(s)) return errors.push(`${f.label}: invalid date format.`);
    if (f.type === 'select' && !f.options.some((o) => o.value === s)) return errors.push(`${f.label}: unknown option.`);
    if (f.type === 'master' && masters && masters[f.master] && !masters[f.master].some((x) => x.name === s)) {
      return errors.push(`${f.label} "${s}" is not in the Talenta master data.`);
    }
    if (f.pattern && !f.pattern.test(s.replace(/[\s.-]/g, ''))) return errors.push(`${f.label}: ${f.patternHint}.`);
    if (f.type === 'number') {
      const n = Number(s.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(n) || n < 0) return errors.push(`${f.label} must be a number ≥ 0.`);
      payload[f.api] = n;
      return;
    }
    if (f.key === 'npwp') {
      const digits = s.replace(/\D/g, '');
      payload[digits.length === 16 ? 'npwp_16' : 'npwp'] = digits;
      return;
    }
    payload[f.api] = f.int ? parseInt(s.replace(/\D/g, ''), 10) : s;
  });

  if (payload.end_employment_status_date && payload.join_date && payload.end_employment_status_date <= payload.join_date) {
    errors.push('Contract / probation end date must be after the join date.');
  }
  if (payload.date_of_birth && payload.date_of_birth >= payload.join_date) {
    errors.push('Date of birth is not valid.');
  }

  return { payload, errors };
}

/** FIELDS as plain JSON for the CMS form (patterns become hints) */
const clientFields = () => FIELDS.map(({ pattern, ...f }) => ({ ...f, pattern: undefined }));

/** Payload with sensitive values masked — for the preview shown in the CMS */
function maskPayload(payload) {
  const masked = { ...payload };
  ['citizen_id', 'npwp', 'npwp_16', 'bank_account'].forEach((k) => {
    if (masked[k]) masked[k] = String(masked[k]).replace(/.(?=.{4})/g, '•');
  });
  return masked;
}

module.exports = { SECTIONS, FIELDS, FIELD_KEYS, clientFields, sanitizeTalentaData, defaultTalentaData, buildEmployeePayload, maskPayload, splitName };
