import ConsentRequest from '../models/ConsentRequest.js';
import ConsentGrant from '../models/ConsentGrant.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Notification from '../models/Notification.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import { logAuditEvent } from '../middleware/audit.js';

/**
 * Doctor submits an access request for a specific medical record
 */
export const requestAccess = async (req, res, next) => {
  try {
    const { recordId, reason, requestedPermission = 'view' } = req.body;

    if (!recordId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recordId and clinical reason for requesting access.',
      });
    }

    // Verify doctor status
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile || doctorProfile.verificationStatus !== 'verified') {
      await logAuditEvent({
        req,
        action: 'ACCESS_DENIED_UNVERIFIED_DOCTOR',
        outcome: 'denied',
        details: 'Unverified doctor attempted to request medical record access',
        securitySeverity: 'high',
      });
      return res.status(403).json({
        success: false,
        message: 'Your doctor credentials are not verified by system admin yet. Access requests cannot be created.',
      });
    }

    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    // Check if there is already an active grant
    const existingActiveGrant = await ConsentGrant.findOne({
      recordId,
      doctorId: req.user._id,
      status: 'active',
      validUntil: { $gt: new Date() },
    });

    if (existingActiveGrant) {
      return res.status(400).json({
        success: false,
        message: 'You already possess active approved consent for this medical record.',
        grant: existingActiveGrant,
      });
    }

    // Check if there is already a pending request
    const existingPending = await ConsentRequest.findOne({
      recordId,
      doctorId: req.user._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active pending request for this record awaiting patient approval.',
      });
    }

    const request = await ConsentRequest.create({
      recordId,
      patientId: record.patientId,
      doctorId: req.user._id,
      doctorProfileId: doctorProfile._id,
      reason,
      requestedPermission,
      status: 'pending',
    });

    // Notify the patient
    await Notification.create({
      userId: record.patientId,
      title: 'New Doctor Access Request',
      message: `Dr. ${req.user.name} (${doctorProfile.specialization}) requested permission to view your record: "${record.title}".`,
      type: 'access_request',
      relatedRecordId: record._id,
      relatedRequestId: request._id,
    });

    // Log audit event
    await logAuditEvent({
      req,
      action: 'CONSENT_REQUEST_SUBMITTED',
      recordId: record._id,
      recordTitle: record.title,
      outcome: 'success',
      details: `Dr. ${req.user.name} submitted access request for record "${record.title}". Reason: ${reason}`,
    });

    res.status(201).json({
      success: true,
      message: 'Access request submitted to patient successfully.',
      request,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Patient responds to an access request (Approve or Reject)
 */
export const respondToRequest = async (req, res, next) => {
  try {
    const { action, permission = 'view', duration = '24h', customExpiryDate, responseNote } = req.body;
    const { requestId } = req.params;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject".',
      });
    }

    const request = await ConsentRequest.findById(requestId)
      .populate('recordId')
      .populate('doctorId', 'name email');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Access request not found.' });
    }

    // Verify patient ownership
    if (request.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You are not the owner of this requested record.',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}.`,
      });
    }

    const record = request.recordId;

    if (action === 'reject') {
      request.status = 'rejected';
      request.respondedAt = new Date();
      request.responseNote = responseNote || 'Declined by patient';
      await request.save();

      // Notify doctor
      await Notification.create({
        userId: request.doctorId._id,
        title: 'Access Request Rejected',
        message: `Your request to access record "${record.title}" was declined by the patient.`,
        type: 'consent_rejected',
        relatedRecordId: record._id,
        relatedRequestId: request._id,
      });

      await logAuditEvent({
        req,
        action: 'CONSENT_REJECTED',
        recordId: record._id,
        recordTitle: record.title,
        outcome: 'success',
        details: `Patient declined access request from Dr. ${request.doctorId.name}`,
      });

      return res.status(200).json({
        success: true,
        message: 'Access request rejected.',
        request,
      });
    }

    // Action is APPROVE
    // Calculate expiration timestamp
    const now = new Date();
    let validUntil;

    if (duration === '1h') {
      validUntil = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    } else if (duration === '24h') {
      validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (duration === '7d') {
      validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (duration === 'custom' && customExpiryDate) {
      validUntil = new Date(customExpiryDate);
      if (isNaN(validUntil.getTime()) || validUntil <= now) {
        return res.status(400).json({
          success: false,
          message: 'Custom expiration date must be a valid future timestamp.',
        });
      }
    } else {
      validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default 24 hours
    }

    // Revoke any previous active grant for this doctor and record
    await ConsentGrant.updateMany(
      { recordId: record._id, doctorId: request.doctorId._id, status: 'active' },
      { $set: { status: 'revoked', revokedAt: now, revokedReason: 'Superseded by new grant' } }
    );

    // Create new ConsentGrant
    const grant = await ConsentGrant.create({
      requestId: request._id,
      recordId: record._id,
      patientId: req.user._id,
      doctorId: request.doctorId._id,
      permission,
      status: 'active',
      validFrom: now,
      validUntil,
    });

    request.status = 'approved';
    request.respondedAt = now;
    request.responseNote = responseNote || 'Approved with consent grant';
    await request.save();

    // Notify doctor
    await Notification.create({
      userId: request.doctorId._id,
      title: 'Consent Granted by Patient',
      message: `The patient approved your access request for "${record.title}". Permission: ${permission === 'view_download' ? 'View & Download' : 'View Only'}. Valid until: ${validUntil.toLocaleString()}.`,
      type: 'consent_granted',
      relatedRecordId: record._id,
      relatedRequestId: request._id,
    });

    // Log audit event
    await logAuditEvent({
      req,
      action: 'CONSENT_GRANTED',
      recordId: record._id,
      recordTitle: record.title,
      consentId: grant._id,
      outcome: 'success',
      details: `Patient granted ${permission} access to Dr. ${request.doctorId.name} until ${validUntil.toISOString()}`,
    });

    res.status(200).json({
      success: true,
      message: 'Access consent granted successfully.',
      grant,
      request,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Patient immediately revokes an active consent grant
 */
export const revokeConsent = async (req, res, next) => {
  try {
    const { grantId } = req.params;
    const { reason = 'Revoked by patient' } = req.body;

    const grant = await ConsentGrant.findById(grantId)
      .populate('recordId')
      .populate('doctorId', 'name email');

    if (!grant) {
      return res.status(404).json({ success: false, message: 'Consent grant not found.' });
    }

    if (grant.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You did not grant this consent.' });
    }

    if (grant.status === 'revoked') {
      return res.status(400).json({ success: false, message: 'This consent grant is already revoked.' });
    }

    grant.status = 'revoked';
    grant.revokedAt = new Date();
    grant.revokedReason = reason;
    await grant.save();

    // Also update associated request status
    await ConsentRequest.findByIdAndUpdate(grant.requestId, { status: 'revoked' });

    // Notify doctor
    await Notification.create({
      userId: grant.doctorId._id,
      title: 'Record Access Revoked',
      message: `Patient has revoked your access to medical record "${grant.recordId?.title || 'Report'}". Future server requests for this file are blocked immediately.`,
      type: 'consent_revoked',
      relatedRecordId: grant.recordId?._id,
    });

    // Log audit event
    await logAuditEvent({
      req,
      action: 'CONSENT_REVOKED',
      recordId: grant.recordId?._id,
      recordTitle: grant.recordId?.title,
      consentId: grant._id,
      outcome: 'success',
      details: `Patient revoked consent for Dr. ${grant.doctorId?.name}. Reason: ${reason}`,
      securitySeverity: 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'Consent revoked immediately. Doctor cannot access this record through the server.',
      advisoryNotice: 'Please note: Any copies previously downloaded by the doctor to their local computer storage cannot be remotely deleted.',
      grant,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List requests for Patient
 */
export const getPatientRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { patientId: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await ConsentRequest.find(query)
      .populate('recordId', 'title category hospitalName medicalDate')
      .populate('doctorId', 'name email phone')
      .populate('doctorProfileId')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List requests for Doctor
 */
export const getDoctorRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { doctorId: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await ConsentRequest.find(query)
      .populate('recordId', 'title category hospitalName medicalDate originalFileName fileSize')
      .populate('patientId', 'name email')
      .sort('-createdAt');

    // Also look up any active grant for each request to show expiration
    const requestIds = requests.map((r) => r._id);
    const grants = await ConsentGrant.find({ requestId: { $in: requestIds } });
    const grantMap = {};
    grants.forEach((g) => {
      grantMap[g.requestId.toString()] = g;
    });

    const enriched = requests.map((reqItem) => {
      const obj = reqItem.toObject();
      obj.grant = grantMap[reqItem._id.toString()] || null;
      return obj;
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      requests: enriched,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all active/historical grants for Patient or Doctor
 */
export const getPatientGrants = async (req, res, next) => {
  try {
    const isDoctor = req.user.role === 'doctor';
    const query = isDoctor ? { doctorId: req.user._id } : { patientId: req.user._id };

    const grants = await ConsentGrant.find(query)
      .populate('recordId', 'title category hospitalName medicalDate originalFileName')
      .populate('doctorId', 'name email')
      .populate('patientId', 'name email patientId phone')
      .sort('-createdAt');

    // Auto-update expired ones in database
    const now = new Date();
    for (const grant of grants) {
      if (grant.status === 'active' && grant.validUntil < now) {
        grant.status = 'expired';
        await grant.save();
      }
    }

    res.status(200).json({
      success: true,
      count: grants.length,
      grants,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Patient directly shares a record with a verified doctor without waiting for a request
 */
export const directGrant = async (req, res, next) => {
  try {
    const { recordId, doctorId, permission = 'view', duration = '24h', customExpiryDate } = req.body;

    if (!recordId || !doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a medical record and a doctor.',
      });
    }

    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    if (record.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You do not own this medical record.',
      });
    }

    const doctorUser = await User.findById(doctorId);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const now = new Date();
    let validUntil;

    if (duration === '1h') validUntil = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    else if (duration === '24h') validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    else if (duration === '7d') validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    else if (duration === '30d') validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    else if (duration === 'custom' && customExpiryDate) validUntil = new Date(customExpiryDate);
    else validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Revoke any previous active grant for this doctor and record
    await ConsentGrant.updateMany(
      { recordId: record._id, doctorId: doctorUser._id, status: 'active' },
      { $set: { status: 'revoked', revokedAt: now, revokedReason: 'Replaced with direct grant' } }
    );

    // Create active grant immediately
    const grant = await ConsentGrant.create({
      recordId: record._id,
      patientId: req.user._id,
      doctorId: doctorUser._id,
      permission,
      status: 'active',
      validFrom: now,
      validUntil,
    });

    // Notify doctor immediately
    await Notification.create({
      userId: doctorUser._id,
      title: 'Medical Record Shared With You',
      message: `Patient ${req.user.name} directly shared medical record "${record.title}". Permission: ${permission === 'view_download' ? 'View & Download' : 'View Only'}. Valid until: ${validUntil.toLocaleString()}.`,
      type: 'consent_granted',
      relatedRecordId: record._id,
    });

    await logAuditEvent({
      req,
      action: 'CONSENT_GRANTED',
      recordId: record._id,
      recordTitle: record.title,
      consentId: grant._id,
      outcome: 'success',
      details: `Patient ${req.user.name} granted ${permission} access to Dr. ${doctorUser.name} until ${validUntil.toISOString()}`,
    });

    res.status(201).json({
      success: true,
      message: `Record "${record.title}" successfully shared with Dr. ${doctorUser.name}!`,
      grant,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Doctor looks up registered patients and their records to request access
 */
export const searchPatientsForDoctor = async (req, res, next) => {
  try {
    const { q } = req.query;

    let patientQuery = { role: 'patient', status: 'active' };

    if (q && q.trim().length >= 1) {
      const clean = q.trim().slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patientQuery.$or = [
        { name: { $regex: clean, $options: 'i' } },
        { email: { $regex: clean, $options: 'i' } },
        { phone: { $regex: clean, $options: 'i' } },
        { patientId: { $regex: clean, $options: 'i' } },
      ];
    }

    const patients = await User.find(patientQuery)
      .select('name email phone patientId createdAt')
      .limit(10);

    const result = [];
    for (const pat of patients) {
      const records = await MedicalRecord.find({ patientId: pat._id, isArchived: false })
        .select('_id title category medicalDate hospitalName createdAt')
        .sort('-createdAt');

      result.push({
        _id: pat._id,
        id: pat._id,
        name: pat.name,
        email: pat.email,
        phone: pat.phone,
        patientId: pat.patientId || null,
        patient: {
          id: pat._id,
          patientId: pat.patientId || null,
          name: pat.name,
          email: pat.email,
          phone: pat.phone,
        },
        records: records.map((r) => ({
          _id: r._id,
          id: r._id,
          title: r.title,
          category: r.category,
          medicalDate: r.medicalDate,
          hospitalName: r.hospitalName,
        })),
      });
    }

    res.status(200).json({
      success: true,
      patients: result,
    });
  } catch (err) {
    next(err);
  }
};
