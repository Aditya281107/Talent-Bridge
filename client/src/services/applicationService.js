import api from './api';

const applicationService = {
  apply: (data) => api.post('/applications', data),
  getMyApplications: (params = {}) => api.get('/applications/mine', { params }),
  getJobApplications: (jobId, params = {}) =>
    api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id, status, note = '', version = undefined, scheduledDate = '', meetingLink = '') =>
    api.put(`/applications/${id}/status`, { status, note, version, scheduledDate, meetingLink }),
  getHistory: (id) => api.get(`/applications/${id}/history`),
};

export default applicationService;
