import express from 'express';
import {
  requestAccess,
  respondToRequest,
  revokeConsent,
  getPatientRequests,
  getDoctorRequests,
  getPatientGrants,
  directGrant,
  searchPatientsForDoctor,
} from '../controllers/consentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requireVerifiedDoctor } from '../middleware/roles.js';

const router = express.Router();

router.use(authenticate);

// Doctor initiates access request
router.post('/request', requireVerifiedDoctor, requestAccess);

// Doctor searches patients and their records to request access
router.get('/doctor/search-patients', requireVerifiedDoctor, searchPatientsForDoctor);

// Patient directly grants access to a verified doctor
router.post('/direct-grant', requireRole('patient'), directGrant);

// Doctor views their own outgoing requests
router.get('/doctor/requests', requireRole('doctor'), getDoctorRequests);

// Patient views incoming requests
router.get('/patient/requests', requireRole('patient'), getPatientRequests);

// Patient grants or rejects request
router.post('/respond/:requestId', requireRole('patient'), respondToRequest);

// Patient revokes an active grant
router.post('/revoke/:grantId', requireRole('patient'), revokeConsent);

// Views active & historical grants (patient or doctor)
router.get('/patient/grants', requireRole(['patient', 'doctor']), getPatientGrants);

export default router;
