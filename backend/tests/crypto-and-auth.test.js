import assert from 'assert';
import crypto from 'crypto';
import {
  encryptFileBuffer,
  decryptFileBuffer,
  wrapDek,
  unwrapDek,
} from '../crypto/encryption.js';
import {
  calculateSha256,
  createSigningPayload,
  signRecordPayload,
  verifySignature,
  verifyRecordIntegrity,
} from '../crypto/signature.js';
import { simulateTampering } from '../crypto/tamperDemo.js';

console.log('--- STARTING SECUREMED CRYPTOGRAPHIC & SECURITY TESTS ---');

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}:`, err.message);
    }
  }

  // 1. DEK Wrapping
  test('Envelope Key Wrapping: Wrap and unwrap DEK accurately using Master Key', () => {
    const rawDek = crypto.randomBytes(32);
    const wrappedPkg = wrapDek(rawDek);
    assert(wrappedPkg.includes(':'), 'Wrapped package must contain delimited components');
    const unwrapped = unwrapDek(wrappedPkg);
    assert.deepStrictEqual(unwrapped, rawDek, 'Unwrapped DEK must match original raw DEK');
  });

  // 2. AES-256-GCM Envelope File Encryption & Decryption
  test('AES-256-GCM File Encryption: Encrypt buffer and decrypt to original bytes', () => {
    const originalText = 'CONFIDENTIAL PATIENT RECORD: Blood Glucose 110 mg/dL, HbA1c 5.8%';
    const originalBuffer = Buffer.from(originalText, 'utf-8');

    const encrypted = encryptFileBuffer(originalBuffer);
    assert(encrypted.ciphertext, 'Ciphertext buffer must exist');
    assert.strictEqual(encrypted.algorithm, 'AES-256-GCM');
    assert.strictEqual(encrypted.ivHex.length, 24, 'IV should be 12 bytes (24 hex characters)');
    assert.strictEqual(encrypted.authTagHex.length, 32, 'AuthTag should be 16 bytes (32 hex characters)');

    const decryptedBuffer = decryptFileBuffer(
      encrypted.ciphertext,
      encrypted.ivHex,
      encrypted.authTagHex,
      encrypted.wrappedDekHex
    );

    assert.strictEqual(decryptedBuffer.toString('utf-8'), originalText);
  });

  // 3. Tampered Ciphertext Rejection
  test('Cryptographic Integrity: Rejects altered ciphertext with authentication failure', () => {
    const originalBuffer = Buffer.from('Patient lab result data', 'utf-8');
    const encrypted = encryptFileBuffer(originalBuffer);

    // Tamper with ciphertext by flipping 1 bit
    const tamperedCiphertext = Buffer.from(encrypted.ciphertext);
    tamperedCiphertext[0] ^= 0x01;

    assert.throws(
      () => {
        decryptFileBuffer(
          tamperedCiphertext,
          encrypted.ivHex,
          encrypted.authTagHex,
          encrypted.wrappedDekHex
        );
      },
      /Cryptographic Integrity Failure|Authentication failed/,
      'Must reject tampered ciphertext'
    );
  });

  // 4. Tampered Auth Tag Rejection
  test('Cryptographic Integrity: Rejects modified authentication tag', () => {
    const originalBuffer = Buffer.from('Patient cardiology scan', 'utf-8');
    const encrypted = encryptFileBuffer(originalBuffer);

    const falsifiedTag = '00'.repeat(16);

    assert.throws(
      () => {
        decryptFileBuffer(
          encrypted.ciphertext,
          encrypted.ivHex,
          falsifiedTag,
          encrypted.wrappedDekHex
        );
      },
      /Cryptographic Integrity Failure|Authentication failed/,
      'Must reject modified authentication tag'
    );
  });

  // 5. SHA-256 Plaintext Hashing
  test('SHA-256 Hash Computation: Calculates correct 64-character hex digest', () => {
    const buffer = Buffer.from('SecureMed SHA-256 Verification Test String');
    const hash = calculateSha256(buffer);
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 64);
  });

  // 6. RSA-PSS Digital Signature Attestation
  test('Digital Signatures: Signs payload and verifies using RSA-PSS SHA-256', () => {
    const payload = createSigningPayload({
      originalSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      patientId: '659a1f2b3c4d5e6f7a8b9c0e',
      category: 'Blood Tests',
      title: 'Complete Blood Count (CBC)',
      medicalDate: new Date('2026-05-10'),
    });

    const sigObj = signRecordPayload(payload);
    assert(sigObj.signatureHex, 'Signature hex must be present');
    assert.strictEqual(sigObj.algorithm, 'RSA-PSS-SHA256');
    assert.strictEqual(sigObj.signerRole, 'system');

    const isValid = verifySignature(payload, sigObj.signatureHex);
    assert.strictEqual(isValid, true, 'Genuine payload must pass RSA-PSS verification');

    // Falsified payload test
    const tamperedPayload = payload.replace('Complete Blood Count', 'Altered Diagnosis');
    const isTamperedValid = verifySignature(tamperedPayload, sigObj.signatureHex);
    assert.strictEqual(isTamperedValid, false, 'Tampered payload must fail RSA-PSS verification');
  });

  // 7. Full Record Integrity Check
  test('End-to-End Integrity Verification: Authenticates matching decrypted record', () => {
    const fileBytes = Buffer.from('REAL REPORT: Liver Function Test - All Enzymes Normal');
    const sha = calculateSha256(fileBytes);
    const mockRecord = {
      _id: '659a1f2b3c4d5e6f7a8b9c0d',
      patientId: '659a1f2b3c4d5e6f7a8b9c0e',
      title: 'Liver Function Test',
      category: 'Lab Reports',
      medicalDate: new Date('2026-06-01'),
      originalSha256: sha,
    };

    const payload = createSigningPayload({
      originalSha256: sha,
      patientId: mockRecord.patientId,
      category: mockRecord.category,
      title: mockRecord.title,
      medicalDate: mockRecord.medicalDate,
    });
    mockRecord.digitalSignature = signRecordPayload(payload);

    const result = verifyRecordIntegrity(fileBytes, mockRecord);
    assert.strictEqual(result.verified, true);
    assert.strictEqual(result.hashMatch, true);
    assert.strictEqual(result.signatureValid, true);
    assert.strictEqual(result.status, 'Verified');
  });

  // 8. Controlled Tampering Simulator
  test('Tamper Simulation: Accurately identifies ciphertext tampering without modifying real data', () => {
    const fileBytes = Buffer.from('Sample MRI Report Bytes for Tampering Simulation');
    const enc = encryptFileBuffer(fileBytes);
    const mockRecord = {
      _id: '659a1f2b3c4d5e6f7a8b9c0d',
      patientId: '659a1f2b3c4d5e6f7a8b9c0e',
      title: 'MRI Brain with Contrast',
      category: 'MRI',
      medicalDate: new Date('2026-06-01'),
      originalSha256: calculateSha256(fileBytes),
      ivHex: enc.ivHex,
      authTagHex: enc.authTagHex,
      wrappedDekHex: enc.wrappedDekHex,
    };

    const sim = simulateTampering(enc.ciphertext, mockRecord, 'ciphertext');
    assert.strictEqual(sim.detected, true, 'Must detect modified ciphertext in simulation');
    assert.strictEqual(sim.stage, 'AES-256-GCM Authenticated Decryption');
  });

  console.log(`\nTEST SUMMARY: ${passed}/${total} TESTS PASSED.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
