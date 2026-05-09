import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

let getTokenFn = null;
export const setAuthTokenGetter = (fn) => { getTokenFn = fn; };

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const showToast = error.config?.showToast === true;
    if (showToast) {
      const message = error.response?.data?.error || error.message || 'Something went wrong';
      if (error.response?.status === 401) toast.error('Session expired. Please sign in again.');
      else if (error.response?.status === 503) toast.error('Service unavailable.');
      else if (error.response?.status !== 404) toast.error(message);
    }
    return Promise.reject(error);
  }
);

// Profile API
export const profileAPI = {
  setup: (data) => api.post('/profile/setup', data),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },
  fetchGitHub: (username) => api.get(`/profile/github?username=${username}`),
  getProfile: () => api.get('/profile/me'),
  analyseJD: (data) => api.post('/profile/analyse-jd', data),
  getGapAnalysis: (data) => api.post('/profile/gap-analysis', data || {}),
};

// Interview API
export const interviewAPI = {
  start: (data) => api.post('/interview/start', data),
  next: (data) => api.post('/interview/next', data),
  end: (data) => api.post('/interview/end', data),
  react: (data) => api.post('/interview/react', data),
  coach: (data) => api.post('/interview/coach', data),
};

// Report API
export const reportAPI = {
  generate: (data) => api.post('/report/generate', data),
  get: (sessionId) => api.get(`/report/${sessionId}`),
};

// Dashboard API
export const dashboardAPI = {
  getSessions: () => api.get('/dashboard/sessions'),
  getStats: () => api.get('/dashboard/stats'),
  getLeaderboard: (params) => api.get('/dashboard/leaderboard', { params }),
};

export default api;
