import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { validateLogin, validateStudentRegister } from '../validators/auth.js';

const router = express.Router();

router.post('/login', validateLogin, AuthController.login);
router.post('/register', validateStudentRegister, AuthController.register);

export default router;

