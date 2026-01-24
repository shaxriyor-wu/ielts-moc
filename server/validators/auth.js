import { body, validationResult } from 'express-validator';

export const validateLogin = [
  body('login')
    .notEmpty().withMessage('Login required')
    .isLength({ min: 3, max: 50 }).withMessage('Login must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_@.]+$/).withMessage('Invalid characters in login')
    .trim(),
  body('password')
    .notEmpty().withMessage('Password required')
    .isLength({ min: 6, max: 100 }).withMessage('Password must be 6-100 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];


export const validateAdminCreate = [
  body('login')
    .notEmpty()
    .withMessage('Login is required')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Login must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_@.]+$/)
    .withMessage('Invalid characters in login'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be 6-100 characters'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg,
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateStudentAccess = [
  body('testKey').notEmpty().withMessage('Test key required'),
  body('fullName').notEmpty().withMessage('Full name required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateStudentRegister = [
  body('login')
    .notEmpty().withMessage('Login required')
    .isLength({ min: 3, max: 50 }).withMessage('Login must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_@.]+$/).withMessage('Invalid characters in login')
    .trim(),
  body('password')
    .isLength({ min: 6, max: 100 }).withMessage('Password must be 6-100 characters'),
  body('fullName')
    .notEmpty().withMessage('Full name required')
    .trim()
    .isLength({ max: 100 }).withMessage('Full name must be at most 100 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

