import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('apaarsetu_token') || localStorage.getItem('eduverify_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify')) {
      localStorage.removeItem('apaarsetu_token');
      localStorage.removeItem('apaarsetu_user');
      localStorage.removeItem('eduverify_token');
      localStorage.removeItem('eduverify_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
