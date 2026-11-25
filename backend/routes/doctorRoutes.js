import express from 'express';
import { getDoctorsDirectory, getDoctorProfile } from '../controllers/doctorController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/directory', getDoctorsDirectory);
router.get('/profile/:id', getDoctorProfile);

export default router;
