import api from './api';

const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: (token) =>
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default authService;
