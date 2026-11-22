import axios from 'axios';

// VITE_API_URL must be the bare backend domain (no /api, no trailing slash).
// The cleanup below also protects against accidental "/" or "/api" at the end.
const RAW = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = RAW.trim().replace(/\/+$/, '').replace(/\/api$/, '');

export const SOCKET_URL = API;
export const IS_PROD = import.meta.env.PROD; // true on Vercel: use polling instead of Socket.io
export const api = axios.create({ baseURL: `${API}/api` });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && !location.pathname.startsWith('/login')) {
    localStorage.removeItem('token');
    location.href = '/login';
  }
  return Promise.reject(e);
});

export const errMsg = (e) => e.response?.data?.message || 'Something went wrong';

// Pakistani Rupee + DD-MM-YYYY (Asia/Karachi)
export const pkr = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' }).replace(/\//g, '-') : '—');
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—');
export const monthLabel = (m) => {
  if (!m) return '—';
  const d = new Date(`${m}-01`);
  return isNaN(d.getTime()) ? m : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};
export const currentMonth = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }).slice(0, 7);