import { decryptFileBuffer } from './encryption.js';
import { calculateSha256, verifySignature, createSigningPayload } from './signature.js';

/**
 * Executes a controlled tampering simulation on an in-memory copy of an encrypted record.
 * Does NOT corrupt or mutate persistent files in storage.
 * @param {Buffer} genuineCiphertext 
 * @param {Object} recordDoc 
 * @param {'ciphertext'|'hash'|'metadata'} tamperType 
 */
export function simulateTampering(genuineCiphertext, recordDoc, tamperType = 'ciphertext') {
  const result = {
    tamperType,
    simulated: true,
    detected: false,
    stage: '',
    error: null,
    details: ''
  };

  if (tamperType === 'ciphertext') {
    // Flip 1 byte in a copy of ciphertext buffer
    const tamperedCiphertext = Buffer.from(genuineCiphertext);
    tamperedCiphertext[0] ^= 0xff; // Invert first byte

    try {
      result.stage = 'AES-256-GCM Authenticated Decryption';
      decryptFileBuffer(
        tamperedCiphertext,
        recordDoc.ivHex,
        recordDoc.authTagHex,
        recordDoc.wrappedDekHex
      );
      // If it didn't throw, tampering went undetected (which should never happen with GCM)
      result.detected = false;
      result.details = 'Ciphertext modification was NOT detected (Security failure).';
    } catch (err) {
      result.detected = true;
      result.error = err.message;
      result.details = 'GCM AuthTag validation failed immediately. Tampered ciphertext rejected before decryption!';
    }
  } else if (tamperType === 'hash') {
    // Decrypt legitimately, but simulate altered original SHA-256 in memory
    try {
      const decrypted = decryptFileBuffer(
        genuineCiphertext,
        recordDoc.ivHex,
        recordDoc.authTagHex,
        recordDoc.wrappedDekHex
      );
      const computedHash = calculateSha256(decrypted);
      const falsifiedHash = computedHash.substring(0, 60) + 'beef'; // Falsified 4 hex chars

      result.stage = 'SHA-256 Plaintext Digest Comparison';
      if (computedHash !== falsifiedHash) {
        result.detected = true;
        result.details = `SHA-256 Mismatch: Computed [${computedHash.substring(0, 16)}...] does not match Expected [${falsifiedHash.substring(0, 16)}...].`;
      }
    } catch (err) {
      result.error = err.message;
    }
  } else if (tamperType === 'metadata') {
    // Tamper with record title or medical date to show RSA-PSS digital signature invalidation
    try {
      result.stage = 'RSA-PSS Digital Signature Verification';
      const tamperedPayload = createSigningPayload({
        originalSha256: recordDoc.originalSha256,
        patientId: recordDoc.patientId,
        category: recordDoc.category,
        title: recordDoc.title + ' [FORGED CLAIMS]',
        medicalDate: recordDoc.medicalDate
      });

      const signatureValid = verifySignature(tamperedPayload, recordDoc.digitalSignature.signatureHex);
      if (!signatureValid) {
        result.detected = true;
        result.details = 'RSA-PSS Digital Signature invalidated! Signature does not match the altered record metadata.';
      }
    } catch (err) {
      result.error = err.message;
    }
  }

  return result;
}
