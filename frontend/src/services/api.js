import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s — Claude API calls can be slow
});

// Auth header interceptor — adds Clerk token
let getTokenFn = null;

export const setAuthTokenGetter = (fn) => {
  getTokenFn = fn;
};

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
  }
  return config;
});

// Response error interceptor
// Only shows toast when the request config has { showToast: true }
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const showToast = error.config?.showToast === true;

    if (showToast) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Something went wrong';

      if (error.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
      } else if (error.response?.status === 503) {
        toast.error('Service unavailable. Please check your configuration.');
      } else if (error.response?.status !== 404) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// Profile API
// ============================================
export const profileAPI = {
  setup: (data) => api.post('/profile/setup', data),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min for resume parsing
    });
  },
  fetchGitHub: (username) => api.get(`/profile/github?username=${username}`),
  getProfile: () => api.get('/profile/me'),
};

// ============================================
// Interview API
// ============================================
export const interviewAPI = {
  start: (data) => api.post('/interview/start', data),
  next: (data) => api.post('/interview/next', data),
  end: (data) => api.post('/interview/end', data),
};

// ============================================
// Report API
// ============================================
export const reportAPI = {
  generate: (data) => api.post('/report/generate', data),
  get: (sessionId) => api.get(`/report/${sessionId}`),
};

// ============================================
// Dashboard API
// ============================================
export const dashboardAPI = {
  getSessions: () => api.get('/dashboard/sessions'),
  getStats: () => api.get('/dashboard/stats'),
  getLeaderboard: () => api.get('/dashboard/leaderboard'),
};

export default api;
