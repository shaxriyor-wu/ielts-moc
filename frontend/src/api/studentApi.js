import api from '../utils/api';

export const studentApi = {
  login: (email, password) => api.post('/student/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  // Test code entry and queue
  enterTestCode: (testCode) => api.post('/student/enter-test-code', { testCode }),
  checkQueueStatus: () => api.get('/student/queue-status'),
  startTest: () => api.post('/student/start-test'),
  leaveQueue: () => api.post('/student/leave-queue'),
  // Legacy endpoints
  accessTest: (testKey, fullName) => api.post('/student/access', { testKey, fullName }),
  // Test data endpoints with skipErrorRedirect to prevent 500 redirects during test sections
  getTest: () => api.get('/student/test', { skipErrorRedirect: true }),
  getAttempt: () => api.get('/student/attempt', { skipErrorRedirect: true }),
  // Save answer endpoints with skipErrorRedirect to prevent 500 redirects during test
  saveReadingAnswers: (answers) => api.post('/student/answers/reading', { answers }, { skipErrorRedirect: true }),
  saveListeningAnswers: (answers) => api.post('/student/answers/listening', { answers }, { skipErrorRedirect: true }),
  saveWriting: (content) => api.post('/student/answers/writing', { content }, { skipErrorRedirect: true }),
  saveWritingTask: (taskNumber, content) => api.post('/student/answers/writing-task', { task_number: taskNumber, content }, { skipErrorRedirect: true }),
  saveHighlights: (highlights) => api.post('/student/highlights', { highlights }, { skipErrorRedirect: true }),
  // Speaking section endpoints
  getSpeakingQuestions: () => api.get('/student/speaking/questions', { skipErrorRedirect: true }),
  uploadSpeakingAudio: (partNumber, questionNumber, audioBlob) => {
    const formData = new FormData();
    formData.append('part_number', partNumber);
    if (questionNumber !== null) {
      formData.append('question_number', questionNumber);
    }
    formData.append('audio_file', audioBlob, 'recording.webm');
    return api.post('/student/speaking/upload-audio', formData, {
      skipErrorRedirect: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  transcribeAndGradeSpeaking: () => api.post('/student/speaking/transcribe-grade', {}, { skipErrorRedirect: true }),
  submitTest: () => api.post('/student/submit'),
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getStats: () => api.get('/student/stats'),
  getAttempts: () => api.get('/student/attempts'),
  getTests: () => api.get('/student/tests'),
  getAllTests: () => api.get('/student/all-tests'),
};
