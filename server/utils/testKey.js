import crypto from 'crypto';

export const generateTestKey = () => {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

export const validateTestKey = (key) => {
  return /^[A-F0-9]{32}$/.test(key);
};

