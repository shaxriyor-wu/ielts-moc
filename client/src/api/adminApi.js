import api from '../utils/api';

export const adminApi = {
  login: (login, password) => api.post('/admin/login', { login, password }),
  createTest: (data) => api.post('/admin/tests', data),
  getTests: () => api.get('/admin/tests'),
  getTest: (id) => api.get(`/admin/tests/${id}`),
  updateTest: (id, data) => api.put(`/admin/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/admin/tests/${id}`),
  uploadTestFile: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/admin/tests/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  startTest: (id) => api.post(`/admin/tests/${id}/start`),
  stopTest: (id) => api.post(`/admin/tests/${id}/stop`),
  publishTest: (id) => api.post(`/admin/tests/${id}/publish`),
  getTestStudents: (id) => api.get(`/admin/tests/${id}/students`),
  generateTestKey: (testId) => api.post('/admin/test-keys', { testId }),
  getTestKeys: () => api.get('/admin/test-keys'),
  getResults: () => api.get('/admin/results'),
  getStudents: () => api.get('/admin/students'),
  getStats: () => api.get('/admin/stats'),
  register: (data) => api.post('/admin/register', data),
};
