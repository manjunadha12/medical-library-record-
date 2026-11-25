import crypto from 'crypto';
import { SYSTEM_SIGNING_KEYS } from '../config/keys.js';

/**
 * Calculates SHA-256 digest of arbitrary buffer.
 * @param {Buffer} buffer 
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function calculateSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Creates canonical payload string for signing.
 */
export function createSigningPayload({ originalSha256, patientId, category, title, medicalDate }) {
  const pId = patientId?._id ? patientId._id.toString() : (patientId ? patientId.toString() : '');
  return JSON.stringify({
    originalSha256,
    patientId: pId,
    category,
    title,
    medicalDate: medicalDate ? new Date(medicalDate).toISOString().split('T')[0] : ''
  });
}

/**
 * Signs payload using RSA-PSS with SHA-256.
 * @param {string} payloadString 
 * @returns {Object} Digital signature metadata
 */
export function signRecordPayload(payloadString) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(payloadString);
  
  // RSA-PSS signature with salt length equal to digest length (32 bytes for SHA256)
  const signature = signer.sign({
    key: SYSTEM_SIGNING_KEYS.privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
  });

  return {
    signatureHex: signature.toString('hex'),
    algorithm: SYSTEM_SIGNING_KEYS.algorithm,
    signerRole: 'system',
    signerName: 'SecureMed Share Automated Attestation Authority',
    keyId: SYSTEM_SIGNING_KEYS.keyId,
    signedAt: new Date()
  };
}

/**
 * Verifies an RSA-PSS signature.
 * @param {string} payloadString 
 * @param {string} signatureHex 
 * @param {string} [publicKeyPem] 
 * @returns {boolean}
 */
export function verifySignature(payloadString, signatureHex, publicKeyPem = SYSTEM_SIGNING_KEYS.publicKeyPem) {
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(payloadString);
    const signatureBuffer = Buffer.from(signatureHex, 'hex');

    return verifier.verify({
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
    }, signatureBuffer);
  } catch (err) {
    console.error('Signature verification error:', err.message);
    return false;
  }
}

/**
 * Comprehensive Integrity & Signature verification for a medical record.
 * @param {Buffer} decryptedBytes
 * @param {Object} recordDocument
 * @returns {Object} Verification assessment
 */
export function verifyRecordIntegrity(decryptedBytes, record) {
  // 1. Re-calculate SHA-256 of decrypted bytes
  const computedHash = calculateSha256(decryptedBytes);
  const hashMatch = crypto.timingSafeEqual(
    Buffer.from(computedHash, 'utf-8'),
    Buffer.from(record.originalSha256, 'utf-8')
  );

  // 2. Verify Digital Signature
  let signatureValid = false;
  let status = 'Not Signed';

  if (record.digitalSignature && record.digitalSignature.signatureHex) {
    const canonicalPayload = createSigningPayload({
      originalSha256: record.originalSha256,
      patientId: record.patientId,
      category: record.category,
      title: record.title,
      medicalDate: record.medicalDate
    });

    signatureValid = verifySignature(canonicalPayload, record.digitalSignature.signatureHex);
    status = (hashMatch && signatureValid) ? 'Verified' : 'Verification Failed';
  } else {
    status = hashMatch ? 'Verified (No Signature)' : 'Verification Failed';
  }

  return {
    status,
    verified: hashMatch && (record.digitalSignature ? signatureValid : true),
    hashMatch,
    signatureValid,
    originalSha256: record.originalSha256,
    computedSha256: computedHash,
    algorithm: record.digitalSignature?.algorithm || 'RSA-PSS-SHA256',
    signer: record.digitalSignature ? {
      name: record.digitalSignature.signerName,
      role: record.digitalSignature.signerRole,
      keyId: record.digitalSignature.keyId,
      signedAt: record.digitalSignature.signedAt
    } : null
  };
}
