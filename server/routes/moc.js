import express from 'express';
import { MocController } from '../controllers/MocController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../config/upload.js';

const router = express.Router();

const uploadFields = upload.fields([
  { name: 'readingFile', maxCount: 1 },
  { name: 'listeningFile', maxCount: 1 },
  { name: 'listeningAudio', maxCount: 1 }
]);

router.post('/mocs', authenticate, requireAdmin, uploadFields, MocController.createMoc);
router.get('/mocs', authenticate, requireAdmin, MocController.getMocs);
router.get('/mocs/:id', authenticate, requireAdmin, MocController.getMoc);
router.put('/mocs/:id', authenticate, requireAdmin, MocController.updateMoc);
router.delete('/mocs/:id', authenticate, requireAdmin, MocController.deleteMoc);
router.post('/mocs/start', authenticate, requireAdmin, MocController.startMocs);

export default router;

