import express from 'express';
import { verifyRecord, getSigningKeys } from '../controllers/verifyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/keys', getSigningKeys); // Public key info for verification
router.get('/record/:id', authenticate, verifyRecord);

export default router;
