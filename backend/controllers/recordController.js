import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import MedicalRecord from '../models/MedicalRecord.js';
import ConsentGrant from '../models/ConsentGrant.js';
import Notification from '../models/Notification.js';
import { encryptFileBuffer, decryptFileBuffer } from '../crypto/encryption.js';
import { calculateSha256, createSigningPayload, signRecordPayload, verifyRecordIntegrity } from '../crypto/signature.js';
import { simulateTampering } from '../crypto/tamperDemo.js';
import { logAuditEvent } from '../middleware/audit.js';

const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Upload a new medical record (Patient only)
 * Plaintext file is hashed with SHA-256, encrypted with AES-256-GCM envelope encryption,
 * and digitally signed with RSA-PSS before persisting to disk and database.
 */
export const uploadRecord = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No medical report file provided for upload.',
      });
    }

    const { title, category, medicalDate, description, hospitalName, doctorName, targetPatientId, targetPatientCode } = req.body;

    if (!title || !category || !medicalDate || !hospitalName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, category, medicalDate, and hospitalName.',
      });
    }

    // Determine target patient
    let targetPatient = null;
    if (req.user.role === 'doctor') {
      if (!targetPatientId && !targetPatientCode) {
        return res.status(400).json({
          success: false,
          message: 'As a clinician, please specify the target Patient (by Name, Patient ID, or Email) to attach this medical report to.',
        });
      }

      if (targetPatientId) {
        targetPatient = await User.findById(targetPatientId);
      } else if (targetPatientCode) {
        targetPatient = await User.findOne({
          role: 'patient',
          $or: [
            { patientId: targetPatientCode.trim().toUpperCase() },
            { email: targetPatientCode.trim().toLowerCase() },
            { _id: mongoose.isValidObjectId(targetPatientCode.trim()) ? targetPatientCode.trim() : null },
          ],
        });
      }

      if (!targetPatient || targetPatient.role !== 'patient') {
        return res.status(404).json({
          success: false,
          message: 'Target patient not found. Please verify the Patient ID, name, or email.',
        });
      }
    } else {
      // Patient uploading for themselves
      targetPatient = req.user;
    }

    const originalFileBytes = req.file.buffer;
    const originalFileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;

    // 1. Calculate SHA-256 digest of original plaintext bytes
    const originalSha256 = calculateSha256(originalFileBytes);

    // 2. Perform AES-256-GCM Envelope Encryption
    const {
      ciphertext,
      ivHex,
      authTagHex,
      wrappedDekHex,
      keyVersion,
      algorithm,
    } = encryptFileBuffer(originalFileBytes);

    // 3. Store ONLY encrypted ciphertext bytes to disk (never plaintext)
    const encryptedFileName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}.enc`;
    const encryptedFilePath = path.join(UPLOADS_DIR, encryptedFileName);
    await fs.promises.writeFile(encryptedFilePath, ciphertext);

    // 4. Generate RSA-PSS Digital Signature for Attestation
    const signingPayload = createSigningPayload({
      originalSha256,
      patientId: targetPatient._id,
      category,
      title,
      medicalDate,
    });
    const digitalSignature = signRecordPayload(signingPayload);

    // 5. Save Medical Record document under target patient's account
    const record = await MedicalRecord.create({
      patientId: targetPatient._id,
      title,
      category,
      medicalDate,
      description: description || '',
      hospitalName,
      doctorName: doctorName || (req.user.role === 'doctor' ? req.user.name : ''),
      originalFileName,
      mimeType,
      fileSize,
      encryptedFileName,
      originalSha256,
      ivHex,
      authTagHex,
      wrappedDekHex,
      keyVersion,
      encryptionAlgorithm: algorithm,
      digitalSignature,
    });

    // If uploaded by a doctor, automatically create an active ConsentGrant so the doctor can view their uploaded file!
    if (req.user.role === 'doctor') {
      const grantExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year clinician grant
      await ConsentGrant.create({
        recordId: record._id,
        patientId: targetPatient._id,
        doctorId: req.user._id,
        permission: 'view_download',
        status: 'active',
        validFrom: new Date(),
        validUntil: grantExpiry,
      });

      // Send notification to patient
      await Notification.create({
        userId: targetPatient._id,
        type: 'system',
        title: 'New Clinical Report Uploaded',
        message: `Dr. ${req.user.name} uploaded a new encrypted report "${record.title}" to your health records vault.`,
        relatedRecordId: record._id,
      }).catch(() => {});
    }

    // 6. Log Audit Event
    await logAuditEvent({
      req,
      action: 'RECORD_UPLOAD',
      recordId: record._id,
      recordTitle: record.title,
      outcome: 'success',
      details: `Medical record uploaded and encrypted with AES-256-GCM. SHA-256: ${originalSha256.substring(0, 16)}...`,
    });

    res.status(201).json({
      success: true,
      message: 'Medical record uploaded, encrypted, and signed successfully.',
      record: {
        id: record._id,
        title: record.title,
        category: record.category,
        medicalDate: record.medicalDate,
        hospitalName: record.hospitalName,
        doctorName: record.doctorName,
        originalFileName: record.originalFileName,
        fileSize: record.fileSize,
        mimeType: record.mimeType,
        originalSha256: record.originalSha256,
        keyVersion: record.keyVersion,
        encryptionAlgorithm: record.encryptionAlgorithm,
        digitalSignature: record.digitalSignature,
        createdAt: record.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List records for current authenticated user
 */
export const listRecords = async (req, res, next) => {
  try {
    const { category, search, sort = '-createdAt' } = req.query;
    const sortOptions = {
      '-createdAt': { createdAt: -1, _id: -1 },
      '-medicalDate': { medicalDate: -1, _id: -1 },
      title: { title: 1, _id: 1 },
    };
    const query = { isArchived: false };

    // Role-based visibility scoping
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      // Doctor only sees records for which active, non-expired consent grant exists!
      const activeGrants = await ConsentGrant.find({
        doctorId: req.user._id,
        status: 'active',
        validUntil: { $gt: new Date() },
      }).select('recordId permission validUntil');

      const allowedRecordIds = activeGrants.map((g) => g.recordId);
      query._id = { $in: allowedRecordIds };
    } else if (req.user.role === 'admin') {
      // Admin sees metadata of all records (never plaintext keys or decrypted bytes)
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (typeof search === 'string' && search.trim()) {
      const literalSearch = search.trim().slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // If doctor or admin, also find matching patients by name/email to include in search
      const matchingPatients = await User.find({
        role: 'patient',
        $or: [
          { name: { $regex: literalSearch, $options: 'i' } },
          { email: { $regex: literalSearch, $options: 'i' } },
          { phone: { $regex: literalSearch, $options: 'i' } },
        ],
      }).select('_id');
      const matchingPatientIds = matchingPatients.map((p) => p._id);

      query.$or = [
        { title: { $regex: literalSearch, $options: 'i' } },
        { hospitalName: { $regex: literalSearch, $options: 'i' } },
        { description: { $regex: literalSearch, $options: 'i' } },
        { doctorName: { $regex: literalSearch, $options: 'i' } },
        { category: { $regex: literalSearch, $options: 'i' } },
        ...(matchingPatientIds.length > 0 ? [{ patientId: { $in: matchingPatientIds } }] : []),
      ];
    }

    const records = await MedicalRecord.find(query)
      .populate('patientId', 'name email')
      .sort(Object.hasOwn(sortOptions, sort) ? sortOptions[sort] : sortOptions['-createdAt'])
      .select('-wrappedDekHex -authTagHex -ivHex'); // Expose metadata without raw cryptographic materials in listing

    // If doctor, annotate each record with permission & expiration
    let enrichedRecords = records;
    if (req.user.role === 'doctor') {
      const activeGrants = await ConsentGrant.find({
        doctorId: req.user._id,
        status: 'active',
        validUntil: { $gt: new Date() },
      });
      const grantMap = {};
      activeGrants.forEach((g) => {
        grantMap[g.recordId.toString()] = {
          permission: g.permission,
          validUntil: g.validUntil,
          consentId: g._id,
        };
      });

      enrichedRecords = records.map((rec) => {
        const plain = rec.toObject();
        plain.consent = grantMap[rec._id.toString()] || null;
        return plain;
      });
    }

    res.status(200).json({
      success: true,
      count: enrichedRecords.length,
      records: enrichedRecords,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get record metadata and security status by ID
 */
export const getRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id).populate('patientId', 'name email');
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found.',
      });
    }

    let doctorPermission = null;

    // Access authorization check
    if (req.user.role === 'patient') {
      if (record.patientId._id.toString() !== req.user._id.toString()) {
        await logAuditEvent({
          req,
          action: 'ACCESS_DENIED_UNAUTHORIZED',
          recordId: record._id,
          recordTitle: record.title,
          outcome: 'denied',
          details: 'Patient attempted to access another patient record',
          securitySeverity: 'high',
        });
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this medical record.',
        });
      }
    } else if (req.user.role === 'doctor') {
      const grant = await ConsentGrant.findOne({
        recordId: record._id,
        doctorId: req.user._id,
        status: 'active',
        validUntil: { $gt: new Date() },
      });

      if (!grant) {
        await logAuditEvent({
          req,
          action: 'ACCESS_DENIED_CONSENT_EXPIRED',
          recordId: record._id,
          recordTitle: record.title,
          outcome: 'denied',
          details: 'Doctor attempted to access record without active patient consent',
          securitySeverity: 'high',
        });
        return res.status(403).json({
          success: false,
          message: 'Access denied. Active patient consent is required to view this record.',
        });
      }
      doctorPermission = grant.permission;
    }

    res.status(200).json({
      success: true,
      record: {
        _id: record._id,
        title: record.title,
        category: record.category,
        medicalDate: record.medicalDate,
        description: record.description,
        hospitalName: record.hospitalName,
        doctorName: record.doctorName,
        originalFileName: record.originalFileName,
        mimeType: record.mimeType,
        fileSize: record.fileSize,
        originalSha256: record.originalSha256,
        keyVersion: record.keyVersion,
        encryptionAlgorithm: record.encryptionAlgorithm,
        digitalSignature: record.digitalSignature,
        patient: record.patientId,
        createdAt: record.createdAt,
        doctorPermission,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Preview / View record content securely (Streams decrypted bytes with inline disposition)
 */
export const previewRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id).populate('patientId', 'name email');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    // Server-side authorization check
    let accessedByDoctor = false;
    if (req.user.role === 'patient') {
      if (record.patientId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized record access.' });
      }
    } else if (req.user.role === 'doctor') {
      const grant = await ConsentGrant.findOne({
        recordId: record._id,
        doctorId: req.user._id,
        status: 'active',
        validUntil: { $gt: new Date() },
      });

      if (!grant) {
        await logAuditEvent({
          req,
          action: 'ACCESS_DENIED_CONSENT_EXPIRED',
          recordId: record._id,
          outcome: 'denied',
          details: 'Doctor attempted to preview record without active consent',
          securitySeverity: 'high',
        });
        return res.status(403).json({ success: false, message: 'Active consent required.' });
      }
      accessedByDoctor = true;
    } else {
      return res.status(403).json({ success: false, message: 'Administrators cannot view decrypted medical content.' });
    }

    // Read encrypted bytes
    const encryptedFilePath = path.join(UPLOADS_DIR, record.encryptedFileName);
    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ success: false, message: 'Encrypted storage file not found.' });
    }

    const ciphertext = await fs.promises.readFile(encryptedFilePath);

    // Authenticated AES-256-GCM Decryption
    const decryptedBytes = decryptFileBuffer(
      ciphertext,
      record.ivHex,
      record.authTagHex,
      record.wrappedDekHex
    );

    // Verify SHA-256 integrity
    const computedHash = calculateSha256(decryptedBytes);
    if (computedHash !== record.originalSha256) {
      await logAuditEvent({
        req,
        action: 'RECORD_INTEGRITY_FAILED',
        recordId: record._id,
        outcome: 'failed',
        details: 'SHA-256 hash mismatch during preview decryption!',
        securitySeverity: 'critical',
      });
      return res.status(500).json({
        success: false,
        message: 'Cryptographic integrity check failed! Record has been altered.',
      });
    }

    // Log view audit event
    await logAuditEvent({
      req,
      action: 'RECORD_VIEW',
      recordId: record._id,
      recordTitle: record.title,
      outcome: 'success',
      details: `Record previewed in browser by ${req.user.name} (${req.user.role})`,
    });

    // Notify patient if viewed by doctor
    if (accessedByDoctor) {
      await Notification.create({
        userId: record.patientId._id,
        title: 'Record Viewed by Doctor',
        message: `Dr. ${req.user.name} viewed your medical record "${record.title}".`,
        type: 'record_accessed',
        relatedRecordId: record._id,
      });
    }

    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${record.originalFileName}"`);
    res.send(decryptedBytes);
  } catch (err) {
    next(err);
  }
};

/**
 * Download record (Checks view_download permission for doctors)
 */
export const downloadRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id).populate('patientId', 'name email');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    let accessedByDoctor = false;

    if (req.user.role === 'patient') {
      if (record.patientId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized record download.' });
      }
    } else if (req.user.role === 'doctor') {
      const grant = await ConsentGrant.findOne({
        recordId: record._id,
        doctorId: req.user._id,
        status: 'active',
        validUntil: { $gt: new Date() },
      });

      if (!grant) {
        await logAuditEvent({
          req,
          action: 'ACCESS_DENIED_CONSENT_EXPIRED',
          recordId: record._id,
          outcome: 'denied',
          details: 'Doctor attempted to download record without active consent',
          securitySeverity: 'high',
        });
        return res.status(403).json({ success: false, message: 'Active consent required.' });
      }

      // Check specific permission: must have view_download
      if (grant.permission !== 'view_download') {
        await logAuditEvent({
          req,
          action: 'ACCESS_DENIED_UNAUTHORIZED',
          recordId: record._id,
          outcome: 'denied',
          details: 'Doctor attempted to download record with view-only permission',
          securitySeverity: 'medium',
        });
        return res.status(403).json({
          success: false,
          message: 'Permission denied: Patient has granted View-Only access for this record. Downloading is not permitted.',
        });
      }
      accessedByDoctor = true;
    } else {
      return res.status(403).json({ success: false, message: 'Administrators cannot download medical files.' });
    }

    const encryptedFilePath = path.join(UPLOADS_DIR, record.encryptedFileName);
    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ success: false, message: 'Encrypted storage file not found.' });
    }

    const ciphertext = await fs.promises.readFile(encryptedFilePath);

    // Decrypt
    const decryptedBytes = decryptFileBuffer(
      ciphertext,
      record.ivHex,
      record.authTagHex,
      record.wrappedDekHex
    );

    // Verify SHA-256
    const computedHash = calculateSha256(decryptedBytes);
    if (computedHash !== record.originalSha256) {
      await logAuditEvent({
        req,
        action: 'RECORD_INTEGRITY_FAILED',
        recordId: record._id,
        outcome: 'failed',
        details: 'SHA-256 hash mismatch during download decryption!',
        securitySeverity: 'critical',
      });
      return res.status(500).json({
        success: false,
        message: 'Cryptographic integrity failure! File has been altered.',
      });
    }

    // Log download audit event
    await logAuditEvent({
      req,
      action: 'RECORD_DOWNLOAD',
      recordId: record._id,
      recordTitle: record.title,
      outcome: 'success',
      details: `Record downloaded by ${req.user.name} (${req.user.role})`,
    });

    if (accessedByDoctor) {
      await Notification.create({
        userId: record.patientId._id,
        title: 'Record Downloaded by Doctor',
        message: `Dr. ${req.user.name} downloaded a copy of your record "${record.title}". Note: Previously downloaded copies cannot be remotely recalled.`,
        type: 'record_accessed',
        relatedRecordId: record._id,
      });
    }

    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${record.originalFileName}"`);
    res.send(decryptedBytes);
  } catch (err) {
    next(err);
  }
};

/**
 * Get comprehensive cryptographic and security details (no secrets exposed)
 */
export const getSecurityDetails = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    // Mask the wrapped DEK in display for safety (show first 16 and last 16 hex characters)
    const maskedWrappedDek = record.wrappedDekHex
      ? `${record.wrappedDekHex.substring(0, 16)}...[PROTECTED ENVELOPE]...${record.wrappedDekHex.slice(-16)}`
      : 'N/A';

    res.status(200).json({
      success: true,
      security: {
        recordId: record._id,
        title: record.title,
        encryptionAlgorithm: record.encryptionAlgorithm,
        keyVersion: record.keyVersion,
        ivHex: record.ivHex,
        authTagHex: record.authTagHex,
        maskedWrappedDek,
        originalSha256: record.originalSha256,
        digitalSignature: record.digitalSignature,
        envelopeModel: 'Master Key (KEK) wraps unique per-file Data Encryption Key (DEK)',
        authenticatedCipher: 'AES-256 in Galois/Counter Mode (GCM) with 96-bit IV and 128-bit Tag',
        integrityHash: 'SHA-256 Cryptographic Hash',
        signatureScheme: 'RSA-PSS (PKCS#1 v2.1) with SHA-256 and maximum salt length',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Run Live Tampering Simulation (Module 4)
 * Demonstrates failed verification and immediate rejection of tampered ciphertext or metadata without mutating real files.
 */
export const runTamperingTest = async (req, res, next) => {
  try {
    const { tamperType = 'ciphertext' } = req.body;
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    const encryptedFilePath = path.join(UPLOADS_DIR, record.encryptedFileName);
    const ciphertext = await fs.promises.readFile(encryptedFilePath);

    const simulationResult = simulateTampering(ciphertext, record, tamperType);

    await logAuditEvent({
      req,
      action: 'RECORD_TAMPER_SIMULATION',
      recordId: record._id,
      recordTitle: record.title,
      outcome: simulationResult.detected ? 'success' : 'failed',
      details: `Tampering test (${tamperType}): Detected=${simulationResult.detected}. Stage=${simulationResult.stage}`,
    });

    res.status(200).json({
      success: true,
      simulationResult,
    });
  } catch (err) {
    next(err);
  }
};
