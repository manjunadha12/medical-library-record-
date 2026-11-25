import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MedicalRecord from '../models/MedicalRecord.js';
import ConsentGrant from '../models/ConsentGrant.js';
import { SYSTEM_SIGNING_KEYS } from '../config/keys.js';
import { decryptFileBuffer } from '../crypto/encryption.js';
import { verifyRecordIntegrity } from '../crypto/signature.js';
import { logAuditEvent } from '../middleware/audit.js';

const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/**
 * Perform real-time cryptographic integrity and digital signature verification for a medical record.
 */
export const verifyRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await MedicalRecord.findById(id).populate('patientId', 'name email');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    // Role-based authorization check
    if (req.user.role === 'patient') {
      if (record.patientId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
      }
    } else if (req.user.role === 'doctor') {
      const grant = await ConsentGrant.findOne({
        recordId: record._id,
        doctorId: req.user._id,
        status: 'active',
        validUntil: { $gt: new Date() },
      });
      if (!grant) {
        return res.status(403).json({ success: false, message: 'Active consent required to verify this record.' });
      }
    }
    // Admin is permitted to audit integrity verification

    const encryptedFilePath = path.join(UPLOADS_DIR, record.encryptedFileName);
    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ success: false, message: 'Encrypted storage file not found.' });
    }

    const ciphertext = await fs.promises.readFile(encryptedFilePath);

    // 1. Authenticated Decryption with AES-256-GCM
    let decryptedBytes;
    try {
      decryptedBytes = decryptFileBuffer(
        ciphertext,
        record.ivHex,
        record.authTagHex,
        record.wrappedDekHex
      );
    } catch (cryptoErr) {
      await logAuditEvent({
        req,
        action: 'RECORD_INTEGRITY_FAILED',
        recordId: record._id,
        recordTitle: record.title,
        outcome: 'failed',
        details: `Decryption failure: ${cryptoErr.message}`,
        securitySeverity: 'critical',
      });
      return res.status(200).json({
        success: true,
        verification: {
          status: 'Verification Failed',
          verified: false,
          hashMatch: false,
          signatureValid: false,
          failureReason: `AES-256-GCM Authenticated Decryption Failed: ${cryptoErr.message}`,
          recordId: record._id,
        },
      });
    }

    // 2. Perform Full Integrity & RSA-PSS Signature Verification
    const verification = verifyRecordIntegrity(decryptedBytes, record);

    await logAuditEvent({
      req,
      action: verification.verified ? 'RECORD_INTEGRITY_VERIFIED' : 'RECORD_INTEGRITY_FAILED',
      recordId: record._id,
      recordTitle: record.title,
      outcome: verification.verified ? 'success' : 'failed',
      details: `Integrity Verification completed: Status=${verification.status}. HashMatch=${verification.hashMatch}. SignatureValid=${verification.signatureValid}`,
      securitySeverity: verification.verified ? 'info' : 'high',
    });

    res.status(200).json({
      success: true,
      verification: {
        ...verification,
        recordId: record._id,
        title: record.title,
        fileSize: record.fileSize,
        verifiedAt: new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns public attestation keys used for signature verification
 */
export const getSigningKeys = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      keyMetadata: {
        keyId: SYSTEM_SIGNING_KEYS.keyId,
        algorithm: SYSTEM_SIGNING_KEYS.algorithm,
        publicKeyPem: SYSTEM_SIGNING_KEYS.publicKeyPem,
        signerRole: 'system',
        signerName: 'SecureMed Share Automated Attestation Authority',
        usage: 'Digital signature creation for uploaded medical records and metadata integrity',
      },
    });
  } catch (err) {
    next(err);
  }
};
