import api from '../utils/api.js';

export const mocApi = {
  createMoc: (formData) => api.post('/admin/mocs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMocs: () => api.get('/admin/mocs'),
  getMoc: (id) => api.get(`/admin/mocs/${id}`),
  updateMoc: (id, data) => api.put(`/admin/mocs/${id}`, data),
  deleteMoc: (id) => api.delete(`/admin/mocs/${id}`),
  startMocs: (mocIds) => api.post('/admin/mocs/start', { mocIds }),
};

