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

  // Candidates
  getCandidates: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/candidates${q ? `?${q}` : ''}`);
  },
  getCandidateById: (id: string) => fetchApi(`/candidates/${id}`),
  applyCandidate: (data: any) => fetchApi('/candidates/apply', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateApplicationStatus: (appId: string, statusData: any) => fetchApi(`/candidates/applications/${appId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData)
  }),
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
