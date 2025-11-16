export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  STUDENT: 'student',
};

export const EXAM_SECTIONS = {
  READING: 'reading',
  LISTENING: 'listening',
  WRITING: 'writing',
};

export const HIGHLIGHT_COLORS = {
  YELLOW: 'yellow',
  BLUE: 'blue',
  GREEN: 'green',
};

// Use relative path for production (same domain) or env variable for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

