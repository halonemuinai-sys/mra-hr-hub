/**
 * Default onboarding checklist — copied onto every new employee at registration.
 * Edit this list to change what new checklists contain (existing checklists are not changed).
 *
 *   key       stable id (kept on the task as templateKey)
 *   phase     PRE_BOARDING | DAY_ONE | FIRST_WEEK | FIRST_MONTH | PROBATION
 *   owner     team responsible: HR | IT | GA | MANAGER | PAYROLL
 *   offset    due date = join date + offset days (negative = before the first day)
 *   fromProbationEnd  due date counts from the probation end instead of the join date
 *   only      employment statuses the task applies to (omit = all)
 */

const PHASES = [
  { key: 'PRE_BOARDING', label: 'Before day one' },
  { key: 'DAY_ONE', label: 'Day one' },
  { key: 'FIRST_WEEK', label: 'First week' },
  { key: 'FIRST_MONTH', label: 'First month' },
  { key: 'PROBATION', label: 'Probation' }
];

const OWNERS = [
  { key: 'HR', label: 'HR' },
  { key: 'IT', label: 'IT' },
  { key: 'GA', label: 'General Affairs' },
  { key: 'MANAGER', label: 'Line manager' },
  { key: 'PAYROLL', label: 'Payroll' }
];

const DEFAULT_TASKS = [
  { key: 'contract', title: 'Prepare the employment contract (PKWT / PKWTT)', phase: 'PRE_BOARDING', owner: 'HR', offset: -5 },
  { key: 'welcome', title: 'Send the welcome message with first-day details', phase: 'PRE_BOARDING', owner: 'HR', offset: -3 },
  { key: 'accounts', title: 'Create work e-mail and system accounts', phase: 'PRE_BOARDING', owner: 'IT', offset: -2 },
  { key: 'equipment', title: 'Prepare laptop and work equipment', phase: 'PRE_BOARDING', owner: 'IT', offset: -2 },
  { key: 'access', title: 'Prepare ID card and building access', phase: 'PRE_BOARDING', owner: 'GA', offset: -1 },
  { key: 'workspace', title: 'Prepare desk / workstation', phase: 'PRE_BOARDING', owner: 'GA', offset: -1 },

  { key: 'sign', title: 'Sign the contract, company regulations and NDA', phase: 'DAY_ONE', owner: 'HR', offset: 0 },
  { key: 'documents', title: 'Collect documents (KTP, NPWP, KK, diploma, bank account)', phase: 'DAY_ONE', owner: 'HR', offset: 0 },
  { key: 'orientation', title: 'Company orientation', phase: 'DAY_ONE', owner: 'HR', offset: 0 },
  { key: 'buddy', title: 'Introduce to the team and assign a buddy', phase: 'DAY_ONE', owner: 'MANAGER', offset: 0 },

  { key: 'talenta', title: 'Register in Talenta / payroll', phase: 'FIRST_WEEK', owner: 'PAYROLL', offset: 3 },
  { key: 'bpjs', title: 'Register BPJS Ketenagakerjaan & Kesehatan', phase: 'FIRST_WEEK', owner: 'PAYROLL', offset: 7 },
  { key: 'training', title: 'Role training and SOP briefing', phase: 'FIRST_WEEK', owner: 'MANAGER', offset: 5 },

  { key: 'goals', title: 'Agree on probation goals / KPIs', phase: 'FIRST_MONTH', owner: 'MANAGER', offset: 14 },
  { key: 'checkin30', title: '30-day check-in', phase: 'FIRST_MONTH', owner: 'MANAGER', offset: 30 },

  { key: 'probationReview', title: 'Probation review and decision', phase: 'PROBATION', owner: 'MANAGER', offset: -7, fromProbationEnd: true, only: ['PROBATION'] },
  { key: 'probationLetter', title: 'Issue the probation result letter', phase: 'PROBATION', owner: 'HR', offset: 0, fromProbationEnd: true, only: ['PROBATION'] }
];

module.exports = { PHASES, OWNERS, DEFAULT_TASKS };
