import express from 'express';
import {
  getSystemStats,
  getPendingDoctors,
  verifyDoctor,
  getAllUsers,
  toggleUserStatus,
  getSecurityEvents,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/stats', getSystemStats);
router.get('/doctors/pending', getPendingDoctors);
router.post('/doctors/:doctorProfileId/verify', verifyDoctor);
router.get('/users', getAllUsers);
router.post('/users/:userId/status', toggleUserStatus);
router.get('/security-events', getSecurityEvents);

export default router;
