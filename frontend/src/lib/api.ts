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
    return fetchApi(`/jobs${q ? `?${q}` : ''}`);
  },
  getJobById: (id: string) => fetchApi(`/jobs/${id}`),
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
  uploadTemplate: (formData: FormData, preview = false) => fetchApi(`/templates/upload${preview ? '?preview=true' : ''}`, {
    method: 'POST',
    body: formData
  }),

  // KPIs
  getKpis: () => fetchApi('/stats/kpis')
};
