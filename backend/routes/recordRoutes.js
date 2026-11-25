import express from 'express';
import {
  uploadRecord,
  listRecords,
  getRecordById,
  previewRecord,
  downloadRecord,
  getSecurityDetails,
  runTamperingTest,
} from '../controllers/recordController.js';
import { authenticate } from '../middleware/auth.js';
import env from '../config/env.js';
import { requireRole, requireVerifiedDoctor } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All record routes require authentication
router.use(authenticate);

router.post(
  '/',
  requireRole(['patient', 'doctor']),
  (req, res, next) => req.user.role === 'doctor' ? requireVerifiedDoctor(req, res, next) : next(),
  upload.single('file'),
  uploadRecord
);

router.get('/', listRecords);
router.get('/:id', getRecordById);
router.get('/:id/preview', previewRecord);
router.get('/:id/download', downloadRecord);
router.get('/:id/security', getSecurityDetails);
if (env.NODE_ENV !== 'production') {
  router.post('/:id/tamper-test', requireRole('admin'), runTamperingTest);
}

export default router;
