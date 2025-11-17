import express from 'express';
import { StudentController } from '../controllers/StudentController.js';
import { authenticate, requireStudent } from '../middleware/auth.js';
import { validateStudentAccess, validateLogin, validateStudentRegister } from '../validators/auth.js';

const router = express.Router();

router.post('/login', validateLogin, StudentController.login);
router.post('/register', validateStudentRegister, StudentController.register);
router.get('/profile', authenticate, requireStudent, StudentController.getProfile);
router.put('/profile', authenticate, requireStudent, StudentController.updateProfile);
router.get('/stats', authenticate, requireStudent, StudentController.getStats);
router.get('/attempts', authenticate, requireStudent, StudentController.getAttempts);
router.get('/tests', authenticate, requireStudent, StudentController.getTests);
router.get('/all-tests', authenticate, requireStudent, StudentController.getAllTests);
router.post('/join-test', authenticate, requireStudent, StudentController.joinTest);
router.get('/test-status/:testKey', authenticate, requireStudent, StudentController.checkTestStatus);
router.post('/access', validateStudentAccess, StudentController.accessTest);
router.get('/test', authenticate, requireStudent, StudentController.getTest);
router.get('/attempt', authenticate, requireStudent, StudentController.getAttempt);
router.post('/answers/reading', authenticate, requireStudent, StudentController.saveReadingAnswers);
router.post('/answers/listening', authenticate, requireStudent, StudentController.saveListeningAnswers);
router.post('/answers/writing', authenticate, requireStudent, StudentController.saveWriting);
router.post('/highlights', authenticate, requireStudent, StudentController.saveHighlights);
router.post('/submit', authenticate, requireStudent, StudentController.submitTest);
router.post('/enter-test-code', authenticate, requireStudent, StudentController.enterTestCode);
router.get('/queue-status', authenticate, requireStudent, StudentController.checkQueueStatus);
router.post('/start-test', authenticate, requireStudent, StudentController.startTest);
router.post('/leave-queue', authenticate, requireStudent, StudentController.leaveQueue);

export default router;

