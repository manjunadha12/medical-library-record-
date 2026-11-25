import crypto from 'crypto';
import { MASTER_KEY, KEY_VERSION } from '../config/keys.js';

const GCM_IV_LENGTH = 12; // Standard 96-bit IV recommended for AES-GCM
const GCM_AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Envelope Encryption: Wraps a Data Encryption Key (DEK) with the Master Key (KEK) using AES-256-GCM.
 * @param {Buffer} dek - 32-byte Data Encryption Key
 * @returns {string} Hex-encoded wrapped DEK package (iv:tag:wrappedKey)
 */
export function wrapDek(dek) {
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const wrapped = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Package format: ivHex:tagHex:wrappedHex
  return `${iv.toString('hex')}:${tag.toString('hex')}:${wrapped.toString('hex')}`;
}

/**
 * Envelope Decryption: Unwraps a wrapped Data Encryption Key (DEK) using the Master Key (KEK).
 * @param {string} wrappedDekPackage - Formatted as ivHex:tagHex:wrappedHex
 * @returns {Buffer} Unwrapped 32-byte DEK
 */
export function unwrapDek(wrappedDekPackage) {
  const parts = wrappedDekPackage.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid wrapped DEK structure.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const wrapped = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(tag);

  try {
    const dek = Buffer.concat([decipher.update(wrapped), decipher.final()]);
    return dek;
  } catch (err) {
    throw new Error(`Master Key failed to unwrap DEK (Authentication failed): ${err.message}`);
  }
}

/**
 * Encrypts arbitrary file buffer using envelope encryption (AES-256-GCM).
 * Generates an ephemeral DEK, encrypts data, wraps DEK with KEK.
 * @param {Buffer} fileBuffer - Plaintext file buffer
 * @returns {Object} Encrypted payload with envelope metadata
 */
export function encryptFileBuffer(fileBuffer) {
  // 1. Generate unique 256-bit DEK per file
  const dek = crypto.randomBytes(32);

  // 2. Wrap DEK with Master Key
  const wrappedDekHex = wrapDek(dek);

  // 3. Encrypt file bytes with DEK using AES-256-GCM
  const fileIv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, fileIv);

  const ciphertext = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    ivHex: fileIv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    wrappedDekHex,
    keyVersion: KEY_VERSION,
    algorithm: 'AES-256-GCM'
  };
}

/**
 * Decrypts encrypted file buffer using envelope decryption (AES-256-GCM).
 * Unwraps DEK and authenticates ciphertext with authTag.
 * Throws error if ciphertext, tag, or wrapped key was tampered with.
 * @param {Buffer} ciphertextBuffer
 * @param {string} ivHex
 * @param {string} authTagHex
 * @param {string} wrappedDekHex
 * @returns {Buffer} Decrypted plaintext file buffer
 */
export function decryptFileBuffer(ciphertextBuffer, ivHex, authTagHex, wrappedDekHex) {
  // 1. Unwrap DEK using Master Key
  const dek = unwrapDek(wrappedDekHex);

  // 2. Prepare decipher with DEK and IV
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
  decipher.setAuthTag(authTag);

  try {
    const plaintext = Buffer.concat([
      decipher.update(ciphertextBuffer),
      decipher.final()
    ]);
    return plaintext;
  } catch (err) {
    throw new Error(`Cryptographic Integrity Failure: Ciphertext or AuthTag has been tampered with (${err.message}).`);
  }
}
