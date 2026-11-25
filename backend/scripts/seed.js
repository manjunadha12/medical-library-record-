import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import env from '../config/env.js';

import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import MedicalRecord from '../models/MedicalRecord.js';
import ConsentRequest from '../models/ConsentRequest.js';
import ConsentGrant from '../models/ConsentGrant.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import SigningKeyMetadata from '../models/SigningKeyMetadata.js';

import { encryptFileBuffer } from '../crypto/encryption.js';
import { calculateSha256, createSigningPayload, signRecordPayload } from '../crypto/signature.js';
import { SYSTEM_SIGNING_KEYS } from '../config/keys.js';

const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generates synthetic realistic medical report PDF in memory
 */
function createMedicalPdfBuffer({ patientName, title, category, date, hospital, doctorName, reportBody }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Header Banner
    doc.rect(0, 0, 612, 80).fill('#0284c7');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('SECUREMED HEALTH SYSTEM', 50, 25);
    doc.fontSize(11).font('Helvetica').text('Certified Electronic Health Record & Diagnostic Summary', 50, 52);

    // Metadata Grid
    doc.moveDown(3);
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(title, 50, 110);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569');
    doc.text(`Category: ${category}`, 50, 140);
    doc.text(`Patient: ${patientName}`, 50, 155);
    doc.text(`Medical Date: ${new Date(date).toDateString()}`, 50, 170);

    doc.text(`Facility: ${hospital}`, 340, 140);
    doc.text(`Attending Physician: Dr. ${doctorName}`, 340, 155);
    doc.text(`Confidentiality: PROTECTED HEALTH RECORD`, 340, 170);

    doc.moveTo(50, 195).lineTo(562, 195).strokeColor('#cbd5e1').lineWidth(1).stroke();

    // Clinical Findings
    doc.moveDown(2);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Clinical Assessment & Lab Findings:', 50, 215);

    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    let yPos = 240;
    for (const line of reportBody) {
      doc.text(line, 50, yPos);
      yPos += 18;
    }

    // Cryptographic Attestation Footer
    yPos += 30;
    doc.rect(50, yPos, 512, 65).fill('#f8fafc').strokeColor('#0284c7').stroke();
    doc.fillColor('#0284c7').fontSize(9).font('Helvetica-Bold').text('CRYPTOGRAPHIC ATTESTATION & INTEGRITY SEAL', 65, yPos + 12);
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(
      'This document is sealed with AES-256-GCM envelope encryption and signed with RSA-PSS.\nAny modification of ciphertext or report findings will invalidate the cryptographic hash.',
      65,
      yPos + 28
    );

    doc.end();
  });
}

export async function seedDatabase(isAuto = false) {
  if (env.NODE_ENV === 'production' || process.env.ALLOW_TEST_SEED !== 'true') {
    throw new Error('Seeding requires ALLOW_TEST_SEED=true and a disposable non-production database.');
  }
  try {
    console.log('--- STARTING SECUREMED SHARE DATABASE SEED ---');
    if (!isAuto) {
      await connectDB();
    }

    // Clean existing collections
    console.log('[SEED] Clearing previous data...');
    await Promise.all([
      User.deleteMany({}),
      DoctorProfile.deleteMany({}),
      MedicalRecord.deleteMany({}),
      ConsentRequest.deleteMany({}),
      ConsentGrant.deleteMany({}),
      AuditLog.deleteMany({}, { bypassAuditImmutability: true }),
      Notification.deleteMany({}),
      SigningKeyMetadata.deleteMany({}),
    ]);

    // 1. Register Signing Key Metadata
    console.log('[SEED] Registering System Signing Key Metadata...');
    await SigningKeyMetadata.create({
      keyId: SYSTEM_SIGNING_KEYS.keyId,
      algorithm: SYSTEM_SIGNING_KEYS.algorithm,
      publicKeyPem: SYSTEM_SIGNING_KEYS.publicKeyPem,
      ownerRole: 'system',
      ownerName: 'SecureMed Share Automated Attestation Authority',
      isActive: true,
      validFrom: new Date(),
    });

    // 2. Create Users
    console.log('[SEED] Creating Users (Admin, Patients, Doctors)...');

    // Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@securemed.io',
      password: 'AdminPassword123!',
      role: 'admin',
      phone: '+1-800-555-0100',
      status: 'active',
    });

    // Patients
    const patient1 = await User.create({
      name: 'Alex Morgan',
      email: 'patient@securemed.io',
      password: 'PatientPassword123!',
      role: 'patient',
      phone: '+1-555-019-2834',
      dateOfBirth: new Date('1992-04-15'),
      gender: 'female',
      address: '742 Evergreen Terrace, Springfield',
      status: 'active',
    });

    const patient2 = await User.create({
      name: 'David Chen',
      email: 'david.chen@securemed.io',
      password: 'PatientPassword123!',
      role: 'patient',
      phone: '+1-555-018-9921',
      dateOfBirth: new Date('1985-09-22'),
      gender: 'male',
      address: '10880 Wilshire Blvd, Los Angeles, CA',
      status: 'active',
    });

    // Doctors
    // Doctor 1 (Verified - Cardiology)
    const doctor1User = await User.create({
      name: 'Sarah Jenkins',
      email: 'doctor@securemed.io',
      password: 'DoctorPassword123!',
      role: 'doctor',
      phone: '+1-555-014-4488',
      status: 'active',
    });

    const doctor1Profile = await DoctorProfile.create({
      userId: doctor1User._id,
      specialization: 'Cardiology',
      licenseNumber: 'MD-CARDIO-88392',
      hospitalAffiliation: 'St. Jude Academic Medical Center',
      experienceYears: 12,
      qualification: 'MD, FACC, Board Certified Cardiologist',
      bio: 'Senior Clinical Cardiologist with focus on non-invasive diagnostics, preventive cardiology, and cardiovascular risk reduction.',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: admin._id,
      verificationNotes: 'Verified against State Board of Medical Examiners Registry.',
    });

    // Doctor 2 (Verified - Neurology)
    const doctor2User = await User.create({
      name: 'Marcus Vance',
      email: 'dr.marcus@securemed.io',
      password: 'DoctorPassword123!',
      role: 'doctor',
      phone: '+1-555-017-3312',
      status: 'active',
    });

    const doctor2Profile = await DoctorProfile.create({
      userId: doctor2User._id,
      specialization: 'Neurology',
      licenseNumber: 'MD-NEURO-77401',
      hospitalAffiliation: 'Metropolitan General Hospital',
      experienceYears: 15,
      qualification: 'MBBS, MD (Neurology), FAAN',
      bio: 'Consultant Neurologist specializing in neuroimaging evaluation, migraine therapeutics, and cognitive disorders.',
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: admin._id,
      verificationNotes: 'Credentials authenticated via National Medical Database.',
    });

    // Doctor 3 (Pending Verification - Oncology)
    const doctor3User = await User.create({
      name: 'Elena Rostova',
      email: 'dr.elena@securemed.io',
      password: 'DoctorPassword123!',
      role: 'doctor',
      phone: '+1-555-012-7788',
      status: 'active',
    });

    const doctor3Profile = await DoctorProfile.create({
      userId: doctor3User._id,
      specialization: 'Oncology',
      licenseNumber: 'MD-ONCO-99234',
      hospitalAffiliation: 'Sunrise Memorial Clinic',
      experienceYears: 8,
      qualification: 'MD, Medical Oncology Specialist',
      bio: 'Clinical oncologist focusing on targeted systemic therapies and personalized medical protocols.',
      verificationStatus: 'pending', // Pending admin verification
      verificationNotes: '',
    });

    console.log('[SEED] Generating and Encrypting Medical Records for Alex Morgan...');

    // 3. Generate Realistic Medical Records
    const sampleReports = [
      {
        title: 'Complete Blood Count (CBC) & Metabolic Panel',
        category: 'Blood Tests',
        medicalDate: new Date('2026-05-12'),
        hospitalName: 'St. Jude Academic Medical Center',
        doctorName: 'Sarah Jenkins',
        originalFileName: 'blood_test_cbc_metabolic.pdf',
        description: 'Annual comprehensive blood chemistry, complete blood count, and lipid profile screening.',
        findings: [
          '• Hemoglobin: 14.2 g/dL (Normal: 12.0 - 15.5 g/dL)',
          '• White Blood Cells (WBC): 6.8 x 10^3/uL (Normal: 4.5 - 11.0)',
          '• Platelets: 245 x 10^3/uL (Normal: 150 - 450)',
          '• Fasting Blood Glucose: 92 mg/dL (Normal: 70 - 99 mg/dL)',
          '• Total Cholesterol: 182 mg/dL (Desirable: < 200 mg/dL)',
          '• Serum Creatinine: 0.9 mg/dL (Normal: 0.6 - 1.2 mg/dL)',
          '• Overall Impression: All hematological and metabolic parameters within normal clinical limits.',
        ],
      },
      {
        title: 'Brain MRI with IV Contrast Diagnostic Report',
        category: 'MRI',
        medicalDate: new Date('2026-04-18'),
        hospitalName: 'Metropolitan Imaging Center',
        doctorName: 'Marcus Vance',
        originalFileName: 'brain_mri_contrast_scan.pdf',
        description: 'Magnetic resonance imaging of brain parenchyma and vascular structures following reported chronic tension headache.',
        findings: [
          '• Multiplanar T1, T2, FLAIR, and post-gadolinium sequence evaluation.',
          '• Ventricles and sulci are symmetric and age-appropriate in morphology.',
          '• No acute intracranial hemorrhage, mass effect, or midline shift detected.',
          '• Basal ganglia, brainstem, and cerebellum reveal normal signal intensities.',
          '• No pathologic parenchymal or meningeal enhancement seen on post-contrast scans.',
          '• Impression: Unremarkable intracranial MRI with normal parenchymal architecture.',
        ],
      },
      {
        title: 'Cardiology Exercise Stress Echocardiogram',
        category: 'Lab Reports',
        medicalDate: new Date('2026-03-05'),
        hospitalName: 'Heart & Vascular Diagnostic Institute',
        doctorName: 'Sarah Jenkins',
        originalFileName: 'exercise_stress_echo_report.pdf',
        description: 'Treadmill exercise stress echocardiogram protocol evaluated for atypical chest discomfort.',
        findings: [
          '• Resting baseline Left Ventricular Ejection Fraction (LVEF): 62%.',
          '• Patient exercised for 9 minutes 30 seconds on standard Bruce Protocol.',
          '• Achieved 94% of maximum predicted heart rate (172 bpm).',
          '• Post-exercise echocardiogram demonstrated normal hyperdynamic systolic response.',
          '• No regional wall motion abnormalities observed at peak workload.',
          '• Impression: Negative for exercise-induced myocardial ischemia.',
        ],
      },
      {
        title: 'Post-Operative Inpatient Discharge Summary',
        category: 'Discharge Summaries',
        medicalDate: new Date('2026-02-14'),
        hospitalName: 'St. Jude Academic Medical Center',
        doctorName: 'Sarah Jenkins',
        originalFileName: 'post_op_discharge_summary.pdf',
        description: 'Complete discharge orders, medication reconciliation, and activity guidance following elective laparoscopic procedure.',
        findings: [
          '• Admission Date: February 11, 2026 | Discharge Date: February 14, 2026',
          '• Surgical procedure completed uneventfully without complications.',
          '• Patient ambulating well, tolerating regular diet, and vital signs stable.',
          '• Surgical sites clean, dry, and intact with no signs of erythema or drainage.',
          '• Discharge Medications: Acetaminophen 500mg PRN, Amoxicillin 500mg completed.',
          '• Follow-up appointment scheduled in Cardiology Clinic in 4 weeks.',
        ],
      },
      {
        title: 'Diagnostic Chest Radiograph 2-View (PA & Lateral)',
        category: 'X-rays',
        medicalDate: new Date('2026-01-20'),
        hospitalName: 'St. Jude Academic Medical Center',
        doctorName: 'Sarah Jenkins',
        originalFileName: 'chest_xray_two_view.pdf',
        description: 'Routine preoperative two-view pulmonary radiograph.',
        findings: [
          '• Both lung fields are clear without focal consolidation, effusion, or pneumothorax.',
          '• Cardiothoracic ratio is within normal limits; cardiac silhouette normal.',
          '• Mediastinal contours, hilar shadows, and osseous structures are intact.',
          '• Impression: Normal upright two-view chest examination.',
        ],
      },
    ];

    const createdRecords = [];

    for (const report of sampleReports) {
      // 1. Generate real PDF buffer
      const pdfBytes = await createMedicalPdfBuffer({
        patientName: patient1.name,
        title: report.title,
        category: report.category,
        date: report.medicalDate,
        hospital: report.hospitalName,
        doctorName: report.doctorName,
        reportBody: report.findings,
      });

      // 2. Compute SHA-256
      const originalSha256 = calculateSha256(pdfBytes);

      // 3. Encrypt with AES-256-GCM envelope encryption
      const encrypted = encryptFileBuffer(pdfBytes);
      const encryptedFileName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}.enc`;
      const encryptedFilePath = path.join(UPLOADS_DIR, encryptedFileName);
      await fs.promises.writeFile(encryptedFilePath, encrypted.ciphertext);

      // 4. Digitally sign with RSA-PSS
      const payload = createSigningPayload({
        recordId: null,
        originalSha256,
        patientId: patient1._id,
        category: report.category,
        title: report.title,
        medicalDate: report.medicalDate,
      });
      const digitalSignature = signRecordPayload(payload);

      // 5. Store MedicalRecord
      const record = await MedicalRecord.create({
        patientId: patient1._id,
        title: report.title,
        category: report.category,
        medicalDate: report.medicalDate,
        description: report.description,
        hospitalName: report.hospitalName,
        doctorName: report.doctorName,
        originalFileName: report.originalFileName,
        mimeType: 'application/pdf',
        fileSize: pdfBytes.length,
        encryptedFileName,
        originalSha256,
        ivHex: encrypted.ivHex,
        authTagHex: encrypted.authTagHex,
        wrappedDekHex: encrypted.wrappedDekHex,
        keyVersion: encrypted.keyVersion,
        encryptionAlgorithm: encrypted.algorithm,
        digitalSignature,
      });

      createdRecords.push(record);

      await AuditLog.create({
        actorId: patient1._id,
        actorName: patient1.name,
        actorEmail: patient1.email,
        actorRole: 'patient',
        action: 'RECORD_UPLOAD',
        recordId: record._id,
        recordTitle: record.title,
        outcome: 'success',
        details: `Initial synthetic record created and encrypted with AES-256-GCM. SHA-256: ${originalSha256.substring(0, 16)}...`,
        securitySeverity: 'info',
      });
    }

    console.log('[SEED] Configuring Pre-Built Consent Scenarios...');

    // Scenario A: Doctor 1 (Dr. Sarah) has active approved consent for Record 1 (CBC)
    const record1 = createdRecords[0];
    const consentReq1 = await ConsentRequest.create({
      recordId: record1._id,
      patientId: patient1._id,
      doctorId: doctor1User._id,
      doctorProfileId: doctor1Profile._id,
      reason: 'Routine cardiology diagnostic evaluation and cholesterol profile review.',
      requestedPermission: 'view_download',
      status: 'approved',
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      respondedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      responseNote: 'Approved for clinical consultation.',
    });

    const grant1 = await ConsentGrant.create({
      requestId: consentReq1._id,
      recordId: record1._id,
      patientId: patient1._id,
      doctorId: doctor1User._id,
      permission: 'view_download',
      status: 'active',
      validFrom: new Date(Date.now() - 1 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23 hours remaining
    });

    // Scenario B: Doctor 2 (Dr. Marcus) has pending request for Record 2 (Brain MRI)
    const record2 = createdRecords[1];
    const consentReq2 = await ConsentRequest.create({
      recordId: record2._id,
      patientId: patient1._id,
      doctorId: doctor2User._id,
      doctorProfileId: doctor2Profile._id,
      reason: 'Specialist neurological second opinion for patient chronic tension headache.',
      requestedPermission: 'view',
      status: 'pending',
      requestedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    });

    // Notifications
    await Notification.create({
      userId: patient1._id,
      title: 'New Access Request from Dr. Marcus Vance',
      message: `Dr. Marcus Vance (Neurology) requested View access for "${record2.title}". Reason: Specialist neurological second opinion.`,
      type: 'access_request',
      relatedRecordId: record2._id,
      relatedRequestId: consentReq2._id,
    });

    await Notification.create({
      userId: doctor1User._id,
      title: 'Access Consent Granted',
      message: `Alex Morgan approved your access request for "${record1.title}" (View & Download) valid for 24 hours.`,
      type: 'consent_granted',
      relatedRecordId: record1._id,
      relatedRequestId: consentReq1._id,
    });

    await Notification.create({
      userId: admin._id,
      title: 'Pending Doctor Verification',
      message: `Dr. Elena Rostova (Oncology, License: MD-ONCO-99234) has registered and requires admin review.`,
      type: 'doctor_verified',
    });

    // Initial audit logs for logins and consent
    await AuditLog.create({
      actorId: doctor1User._id,
      actorName: doctor1User.name,
      actorEmail: doctor1User.email,
      actorRole: 'doctor',
      action: 'CONSENT_REQUEST_SUBMITTED',
      recordId: record1._id,
      recordTitle: record1.title,
      outcome: 'success',
      details: 'Dr. Sarah Jenkins requested access to Complete Blood Count report.',
    });

    await AuditLog.create({
      actorId: patient1._id,
      actorName: patient1.name,
      actorEmail: patient1.email,
      actorRole: 'patient',
      action: 'CONSENT_GRANTED',
      recordId: record1._id,
      recordTitle: record1.title,
      consentId: grant1._id,
      outcome: 'success',
      details: 'Patient granted view_download permission valid for 24 hours.',
    });

    console.log('=======================================================');
    console.log('  SECUREMED SHARE SEED COMPLETED SUCCESSFULLY!        ');
    console.log('=======================================================');
    console.log('  DEMO CREDENTIALS:');
    console.log('  -----------------');
    console.log('  [Patient] Email: patient@securemed.io    | Pass: PatientPassword123!');
    console.log('  [Doctor]  Email: doctor@securemed.io     | Pass: DoctorPassword123!');
    console.log('  [Admin]   Email: admin@securemed.io      | Pass: AdminPassword123!');
    console.log('  -----------------');
    console.log('  [Doctor Pending]: dr.elena@securemed.io  | Pass: DoctorPassword123!');
    console.log('=======================================================');

    if (!isAuto) {
      await closeDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('[SEED CRITICAL ERROR]', err);
    if (!isAuto) {
      process.exit(1);
    }
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase(false);
}
