import api from './api';

const jobService = {
  getJobs: (params = {}) => api.get('/jobs', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/mine'),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
};

export default jobService;
