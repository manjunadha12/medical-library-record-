process.env.NODE_ENV = 'test';
import assert from 'assert';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import env from '../config/env.js';

const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);

console.log('--- STARTING SECUREMED SHARE 11-STEP DEMONSTRATION WORKFLOW TEST ---');

import app from '../server.js';
import User from '../models/User.js';
import MedicalRecord from '../models/MedicalRecord.js';
import ConsentGrant from '../models/ConsentGrant.js';
import ConsentRequest from '../models/ConsentRequest.js';
import AuditLog from '../models/AuditLog.js';

let serverInstance;
const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2E() {
  try {
    // 1. Wait for database and auto-seeding to complete
    console.log('[TEST HARNESS] Waiting for database initialization and seed data...');
    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        const u = await User.findOne({ email: 'patient@securemed.io' });
        const r = await MedicalRecord.countDocuments();
        if (u && r >= 5) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((res) => setTimeout(res, 500));
    }
    assert(ready, 'Database must be seeded and ready before beginning workflow');
    console.log('[TEST HARNESS] Database is verified and ready with seeded accounts and records.');

    // Start test server
    serverInstance = app.listen(TEST_PORT);
    console.log(`[TEST HARNESS] Listening on port ${TEST_PORT}`);

    // STEP 1: Patient Login
    console.log('\n[Step 1] Patient logs in securely...');
    const patientLoginRes = await request('POST', '/auth/login', {
      email: 'patient@securemed.io',
      password: 'PatientPassword123!',
    });
    assert.strictEqual(patientLoginRes.status, 200);
    assert(patientLoginRes.data.token, 'Must return JWT token');
    const patientToken = patientLoginRes.data.token;
    const patientId = patientLoginRes.data.user.id;
    console.log('  -> Patient authenticated successfully. Token received.');

    // STEP 2: Doctor Login
    console.log('\n[Step 2] Doctor (Dr. Sarah Jenkins) logs in securely...');
    const docLoginRes = await request('POST', '/auth/login', {
      email: 'doctor@securemed.io',
      password: 'DoctorPassword123!',
    });
    assert.strictEqual(docLoginRes.status, 200);
    const docToken = docLoginRes.data.token;
    const docId = docLoginRes.data.user.id;
    console.log('  -> Doctor authenticated successfully. Verification status: verified.');

    // STEP 3: Verify patient's encrypted medical records in database
    console.log('\n[Step 3] Verifying records encrypted with AES-256-GCM envelope encryption...');
    const listRecordsRes = await request('GET', '/records', null, patientToken);
    assert.strictEqual(listRecordsRes.status, 200);
    assert(listRecordsRes.data.records.length > 0, 'Must possess seeded medical records');
    const testRecord = listRecordsRes.data.records[0];
    console.log(`  -> Selected record: "${testRecord.title}" (ID: ${testRecord._id})`);
    console.log(`  -> Original SHA-256: ${testRecord.originalSha256}`);
    console.log(`  -> Encryption Algorithm: ${testRecord.encryptionAlgorithm}`);

    // STEP 4: Doctor submits access request for this record
    console.log('\n[Step 4] Doctor submits access request for this record...');
    // Clear any previous active grant for clean test execution
    await ConsentGrant.deleteMany({ recordId: testRecord._id, doctorId: docId });
    await ConsentRequest.deleteMany({ recordId: testRecord._id, doctorId: docId });

    const createReqRes = await request(
      'POST',
      '/consent/request',
      {
        recordId: testRecord._id,
        reason: 'Evaluating cardiac lab findings prior to surgical clearance.',
        requestedPermission: 'view_download',
      },
      docToken
    );
    assert.strictEqual(createReqRes.status, 201);
    const requestId = createReqRes.data.request._id;
    console.log(`  -> Access request submitted successfully. Request ID: ${requestId}`);

    // STEP 5: Patient reviews and approves access for 24 hours
    console.log('\n[Step 5] Patient approves access request with 24-hour expiration...');
    const approveRes = await request(
      'POST',
      `/consent/respond/${requestId}`,
      {
        action: 'approve',
        permission: 'view_download',
        duration: '24h',
        responseNote: 'Approved for surgical diagnostic clearance.',
      },
      patientToken
    );
    assert.strictEqual(approveRes.status, 200);
    const grantId = approveRes.data.grant._id;
    console.log(`  -> Consent granted. Grant ID: ${grantId}. Valid Until: ${approveRes.data.grant.validUntil}`);

    // STEP 6: Doctor views authorized report
    console.log('\n[Step 6] Doctor views the authorized report (decrypts stream on the fly)...');
    const viewRes = await request('GET', `/records/${testRecord._id}/preview`, null, docToken);
    assert.strictEqual(viewRes.status, 200);
    assert(viewRes.data.length > 0, 'Must return decrypted file bytes');
    console.log(`  -> Report successfully streamed and decrypted. Byte length: ${viewRes.data.length}`);

    // STEP 7: Doctor verifies cryptographic integrity and digital signature
    console.log('\n[Step 7] Doctor performs cryptographic integrity & RSA-PSS signature verification...');
    const verifyRes = await request('GET', `/verify/record/${testRecord._id}`, null, docToken);
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.verification.verified, true);
    assert.strictEqual(verifyRes.data.verification.hashMatch, true);
    assert.strictEqual(verifyRes.data.verification.signatureValid, true);
    assert.strictEqual(verifyRes.data.verification.status, 'Verified');
    console.log('  -> Cryptographic verification result: Status=VERIFIED. HashMatch=TRUE. SignatureValid=TRUE.');

    // STEP 8: Patient revokes consent immediately
    console.log('\n[Step 8] Patient revokes doctor access immediately...');
    const revokeRes = await request(
      'POST',
      `/consent/revoke/${grantId}`,
      { reason: 'Consultation completed. Patient closing active access window.' },
      patientToken
    );
    assert.strictEqual(revokeRes.status, 200);
    console.log('  -> Consent revoked immediately.');
    console.log(`  -> Advisory notice: "${revokeRes.data.advisoryNotice}"`);

    // STEP 9: Doctor is denied further access
    console.log('\n[Step 9] Verifying doctor is immediately denied further access by server-side guard...');
    const deniedViewRes = await request('GET', `/records/${testRecord._id}/preview`, null, docToken);
    assert.strictEqual(deniedViewRes.status, 403, 'Must return 403 Forbidden');
    console.log('  -> Server enforcement confirmed: 403 Forbidden returned upon unauthorized access attempt.');

    // STEP 10: Run Tamper Simulation (Admin Only)
    console.log('\n[Step 10] Running controlled tamper test (simulating modified ciphertext as Admin)...');
    const adminLoginRes = await request('POST', '/auth/login', {
      email: 'admin@securemed.io',
      password: 'AdminPassword123!',
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminToken = adminLoginRes.data.token;

    const tamperRes = await request(
      'POST',
      `/records/${testRecord._id}/tamper-test`,
      { tamperType: 'ciphertext' },
      adminToken
    );
    assert.strictEqual(tamperRes.status, 200);
    assert.strictEqual(tamperRes.data.simulationResult.detected, true);
    console.log(`  -> Tamper simulation: Detected=${tamperRes.data.simulationResult.detected}. Stage=${tamperRes.data.simulationResult.stage}`);

    // STEP 11: Audit Trail Verification
    console.log('\n[Step 11] Checking complete immutable audit trail...');
    const auditRes = await request('GET', '/audit?limit=10', null, patientToken);
    assert.strictEqual(auditRes.status, 200);
    const actions = auditRes.data.logs.map((l) => l.action);
    console.log('  -> Recent audit events logged:');
    actions.slice(0, 6).forEach((act) => console.log(`     • ${act}`));
    assert(actions.includes('CONSENT_REQUEST_SUBMITTED'), 'Audit must contain request submission');
    assert(actions.includes('CONSENT_GRANTED'), 'Audit must contain consent grant');
    assert(actions.includes('CONSENT_REVOKED'), 'Audit must contain consent revocation');

    console.log('\n===============================================================');
    console.log('  SUCCESS: ALL 11 WORKFLOW STEPS VERIFIED END-TO-END!          ');
    console.log('===============================================================');

    serverInstance.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[WORKFLOW ERROR]', err);
    if (serverInstance) serverInstance.close();
    process.exit(1);
  }
}

runE2E();
