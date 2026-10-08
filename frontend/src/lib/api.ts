const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5006/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  // Attach token if present in localStorage (Client-side)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hr_hub_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // If body is NOT FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMsg = errorData.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

/** Original CV file as a Blob (needs the CMS token, so it can't be a plain link) */
export async function fetchResumeBlob(candidateId: string): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hr_hub_token') : null;
  const res = await fetch(`${API_BASE_URL}/candidates/${candidateId}/resume`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      msg = (await res.json()).message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.blob();
}

/** New-employees workbook (same filters as the list) for HRIS / payroll import */
export async function downloadEmployees(params: Record<string, string> = {}): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hr_hub_token') : null;
  const res = await fetch(`${API_BASE_URL}/employees/export.xlsx?${new URLSearchParams(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      msg = (await res.json()).message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.blob();
}

/** Recruitment report workbook for a period (YYYY-MM-DD, inclusive) */
export async function downloadReport(from: string, to: string, companyId = ''): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hr_hub_token') : null;
  const res = await fetch(`${API_BASE_URL}/reports/recruitment.xlsx?from=${from}&to=${to}${companyId ? `&companyId=${companyId}` : ''}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      msg = (await res.json()).message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.blob();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) => fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  getMe: () => fetchApi('/auth/me'),
  logout: () => fetchApi('/auth/logout', {
    method: 'POST'
  }),
  // Jobs
  getJobs: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/jobs${q ? `?${q}` : ''}`, { cache: 'no-store' });
  },
  getJobById: (id: string) => fetchApi(`/jobs/${id}`),
  getJobsForManagement: () => fetchApi('/jobs/manage?activeOnly=false', { cache: 'no-store' }),
  getJobForManagement: (id: string) => fetchApi(`/jobs/${id}/manage`),
  getHiringManagers: () => fetchApi('/jobs/hiring-managers'),
  createJob: (data: any) => fetchApi('/jobs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateJob: (id: string, data: any) => fetchApi(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteJob: (id: string) => fetchApi(`/jobs/${id}`, {
    method: 'DELETE'
  }),

  // Team monitoring (Super Admin / TA Lead)
  getTeamPerformance: (days = 30) => fetchApi(`/team/performance?days=${days}`),
  getTeamRebalance: () => fetchApi('/team/rebalance'),
  getTeamActivity: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/team/activity${q ? `?${q}` : ''}`);
  },

  // Users & access control (Super Admin)
  getAccessMatrix: () => fetchApi('/users/access-matrix'),
  getUsers: () => fetchApi('/users'),
  createUser: (data: { name: string; email: string; role: string; password: string }) => fetchApi('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateUser: (id: string, data: { name?: string; role?: string; isActive?: boolean; password?: string }) =>
    fetchApi(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Candidates
  getCandidates: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/candidates${q ? `?${q}` : ''}`);
  },
  getCandidateById: (id: string) => fetchApi(`/candidates/${id}`),
  getCandidateApplications: (id: string) => fetchApi(`/candidates/${id}/applications`),
  getCandidateDuplicates: (id: string) => fetchApi(`/candidates/${id}/duplicates`),
  getPipeline: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/candidates/pipeline${q ? `?${q}` : ''}`);
  },
  applyCandidate: (data: any) => fetchApi('/candidates/apply', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateApplicationStatus: (appId: string, statusData: any) => fetchApi(`/candidates/applications/${appId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData)
  }),
  bulkUpdateApplicationStatus: (payload: { applicationIds: string[]; status: string; note?: string }) =>
    fetchApi('/candidates/applications/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  // Stage gate & approvals
  previewTransition: (applicationId: string, toStatus: string) =>
    fetchApi(`/candidates/applications/${applicationId}/transition?to=${encodeURIComponent(toStatus)}`),
  executeTransition: (applicationId: string, payload: { toStatus: string; data: Record<string, any> }) =>
    fetchApi(`/candidates/applications/${applicationId}/transition`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getApprovals: () => fetchApi('/candidates/approvals'),
  decideApproval: (requestId: string, decision: 'APPROVE' | 'REJECT', note?: string) =>
    fetchApi(`/candidates/approvals/${requestId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, note })
    }),
  cancelApproval: (requestId: string) => fetchApi(`/candidates/approvals/${requestId}/cancel`, { method: 'POST' }),

  // TA ownership (PIC)
  getRecruiters: () => fetchApi('/candidates/recruiters'),
  claimApplications: (applicationIds: string[]) => fetchApi('/candidates/applications/claim', {
    method: 'POST',
    body: JSON.stringify({ applicationIds })
  }),
  releaseApplications: (applicationIds: string[]) => fetchApi('/candidates/applications/release', {
    method: 'POST',
    body: JSON.stringify({ applicationIds })
  }),
  assignApplications: (applicationIds: string[], recruiterId: string) => fetchApi('/candidates/applications/assign', {
    method: 'POST',
    body: JSON.stringify({ applicationIds, recruiterId })
  }),
  getApplicationActivity: (applicationId: string) => fetchApi(`/candidates/applications/${applicationId}/activity`),
  getPublicStatus: (email: string) => fetchApi(`/candidates/status?email=${encodeURIComponent(email)}`),
  deleteCandidate: (id: string) => fetchApi(`/candidates/${id}`, {
    method: 'DELETE'
  }),

  // ATS
  parseResume: (formData: FormData) => fetchApi('/ats/parse-cv', {
    method: 'POST',
    body: formData
  }),
  simulateScore: (payload: { candidate: any; jobId?: string }) => fetchApi('/ats/simulate-score', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Templates
  downloadTemplateUrl: `${API_BASE_URL}/templates/download`,
  // Public career portal: one applicant per file
  applyWithTemplate: (formData: FormData) => fetchApi('/templates/apply', {
    method: 'POST',
    body: formData
  }),
  // CMS bulk import (requires login + candidate.import)
  uploadTemplate: (formData: FormData, preview = false) => fetchApi(`/templates/upload${preview ? '?preview=true' : ''}`, {
    method: 'POST',
    body: formData
  }),

  // KPIs
  getKpis: () => fetchApi('/stats/kpis'),
  getDashboard: (weeks = 12, companyId = '') => fetchApi(`/stats/dashboard?weeks=${weeks}${companyId ? `&companyId=${companyId}` : ''}`),

  // Onboarding checklists
  getOnboarding: (params: Record<string, string> = {}) => fetchApi(`/onboarding?${new URLSearchParams(params)}`),
  getOnboardingChecklist: (employeeId: string) => fetchApi(`/onboarding/${employeeId}`),
  startOnboarding: (employeeId: string) => fetchApi(`/onboarding/${employeeId}/start`, { method: 'POST' }),
  addOnboardingTask: (employeeId: string, data: Record<string, any>) =>
    fetchApi(`/onboarding/${employeeId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateOnboardingTask: (taskId: string, data: Record<string, any>) =>
    fetchApi(`/onboarding/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteOnboardingTask: (taskId: string) => fetchApi(`/onboarding/tasks/${taskId}`, { method: 'DELETE' }),
  setProbationEnd: (employeeId: string, probationEndDate: string) =>
    fetchApi(`/onboarding/${employeeId}/probation`, { method: 'PATCH', body: JSON.stringify({ probationEndDate }) }),

  // Interview calendar
  getInterviews: (params: Record<string, string> = {}) => fetchApi(`/interviews?${new URLSearchParams(params)}`),
  scheduleInterview: (applicationId: string, data: Record<string, any>) =>
    fetchApi(`/interviews/${applicationId}/schedule`, { method: 'POST', body: JSON.stringify(data) }),

  // Manpower requests (permintaan rekrutmen)
  getManpowerRequests: (params: Record<string, string> = {}) => fetchApi(`/manpower?${new URLSearchParams(params)}`),
  getManpowerRequest: (id: string) => fetchApi(`/manpower/${id}`),
  createManpowerRequest: (data: Record<string, any>) => fetchApi('/manpower', { method: 'POST', body: JSON.stringify(data) }),
  updateManpowerRequest: (id: string, data: Record<string, any>) =>
    fetchApi(`/manpower/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  decideManpowerRequest: (id: string, decision: 'APPROVE' | 'REJECT', note?: string) =>
    fetchApi(`/manpower/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision, note }) }),
  cancelManpowerRequest: (id: string, note?: string) =>
    fetchApi(`/manpower/${id}/cancel`, { method: 'POST', body: JSON.stringify({ note }) }),

  // Companies (PT) of MRA Group
  getCompanies: (activeOnly = false) => fetchApi(`/companies${activeOnly ? '?active=1' : ''}`),
  createCompany: (data: Record<string, any>) => fetchApi('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id: string, data: Record<string, any>) =>
    fetchApi(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Reminders (header bell + dashboard Action Center)
  getReminders: () => fetchApi('/reminders'),

  // Employees (after the hire) & announcements
  getEmployees: (params: Record<string, string> = {}) => fetchApi(`/employees?${new URLSearchParams(params)}`),
  getPendingHires: () => fetchApi('/employees/pending'),
  getEmployeeJourney: (id: string) => fetchApi(`/employees/${id}/journey`),
  getEmployeePrefill: (applicationId: string) => fetchApi(`/employees/prefill/${applicationId}`),
  registerEmployee: (data: Record<string, any>) => fetchApi('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: Record<string, any>) =>
    fetchApi(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  announceEmployee: (id: string, message: string) =>
    fetchApi(`/employees/${id}/announce`, { method: 'POST', body: JSON.stringify({ message }) }),
  withdrawAnnouncement: (id: string) => fetchApi(`/employees/${id}/announce`, { method: 'DELETE' }),
  releaseHires: (applicationIds: string[]) =>
    fetchApi('/employees/release', { method: 'POST', body: JSON.stringify({ applicationIds }) }),
  restoreHire: (applicationId: string) =>
    fetchApi('/employees/restore', { method: 'POST', body: JSON.stringify({ applicationId }) }),
  getAnnouncements: (limit = 30) => fetchApi(`/announcements?limit=${limit}`),

  // Talenta (Mekari HRIS) sync — HR only
  getTalentaStatus: () => fetchApi('/talenta/status'),
  getTalentaMasters: (refresh = false) => fetchApi(`/talenta/master-data${refresh ? '?refresh=1' : ''}`),
  getEmployeeTalenta: (id: string) => fetchApi(`/talenta/employees/${id}`),
  saveEmployeeTalenta: (id: string, data: Record<string, any>) =>
    fetchApi(`/talenta/employees/${id}`, { method: 'PUT', body: JSON.stringify({ data }) }),
  syncEmployeeTalenta: (id: string, data: Record<string, any>) =>
    fetchApi(`/talenta/employees/${id}/sync`, { method: 'POST', body: JSON.stringify({ data }) })
};
