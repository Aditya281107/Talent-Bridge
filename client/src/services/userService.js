import api from './api';

const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getDashboard: () => api.get('/users/dashboard'),
  searchCandidates: (params = {}) => api.get('/users/candidates', { params }),
  searchEmployers: (params = {}) => api.get('/users/employers', { params }),
};

export default userService;
