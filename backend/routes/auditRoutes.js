import express from 'express';
import { getAuditLogs, exportAuditLogsCSV } from '../controllers/auditController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAuditLogs);
router.get('/export/csv', exportAuditLogsCSV);

export default router;
