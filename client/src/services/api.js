import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    
    // If unauthorized, clear token
    if (error.response?.status === 401) {
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_user');
      // Optionally redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;
