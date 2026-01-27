import api from '../utils/api';

export const adminApi = {
  login: (login, password) => api.post('/admin/login', { login, password }),
  // Variant management
  createVariant: (data) => api.post('/admin/tests', data),
  getVariants: () => api.get('/admin/tests'),
  getVariant: (id) => api.get(`/admin/tests/${id}`),
  updateVariant: (id, data) => api.put(`/admin/tests/${id}`, data),
  deleteVariant: (id) => api.delete(`/admin/tests/${id}`),
  generateCode: (variantId) => api.post(`/admin/tests/${variantId}/generate-code`),
  startMock: (variantId) => api.post(`/admin/tests/${variantId}/start-mock`),
  stopMock: (variantId) => api.post(`/admin/tests/${variantId}/stop-mock`),
  // File uploads
  uploadTestFile: (variantId, fileType, file, audioFile = null, taskNumber = null) => {
    const formData = new FormData();
    formData.append('variant_id', variantId);
    formData.append('file_type', fileType);
    formData.append('file', file);
    if (audioFile) {
      formData.append('audio_file', audioFile);
    }
    if (taskNumber) {
      formData.append('task_number', taskNumber);
    }
    // Don't set Content-Type manually - axios will set it automatically with boundary
    // This ensures Authorization header is still included
    return api.post('/admin/tests/upload', formData);
  },
  // Answers
  createAnswers: (variantId, answers) => api.post('/admin/tests/answers', {
    variant_id: variantId,
    answers: answers,
  }),
  // Statistics
  getStats: () => api.get('/admin/stats'),
  // Legacy endpoints (for backward compatibility)
  createTest: (data) => api.post('/admin/tests', data),
  getTests: () => api.get('/admin/tests'),
  getTest: (id) => api.get(`/admin/tests/${id}`),
  updateTest: (id, data) => api.put(`/admin/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/admin/tests/${id}`),
  startTest: (id) => api.post(`/admin/tests/${id}/start-mock`),
  stopTest: (id) => api.post(`/admin/tests/${id}/stop-mock`),
  // Students/Users Management
  getStudents: () => api.get('/admin/students'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}/delete`),
  // Test Keys
  getTestKeys: () => api.get('/admin/test-keys'),
  generateTestKey: (variantId) => api.post(`/admin/tests/${variantId}/generate-code`),
  // Results
  getResults: () => api.get('/admin/results'),
  // Online users
  getOnlineUsers: () => api.get('/admin/online-users'),
  // New Mock Test endpoints (JSON-based variants)
  getAvailableVariants: () => api.get('/admin/mock-tests/available-variants'),
  createMockTest: (data) => api.post('/admin/mock-tests/create', data),
  getMockTestList: () => api.get('/admin/mock-tests/list'),
  getVariantPreview: (sectionType, sectionName, filename) =>
    api.get(`/admin/mock-tests/variant-preview/${sectionType}/${sectionName}/${filename}`),
};
