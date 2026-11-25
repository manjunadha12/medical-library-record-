import mongoose from 'mongoose';

export const MEDICAL_RECORD_CATEGORIES = [
  'Blood Tests',
  'Prescriptions',
  'X-rays',
  'MRI',
  'CT Scans',
  'Lab Reports',
  'Discharge Summaries',
  'Other'
];

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: MEDICAL_RECORD_CATEGORIES,
      index: true,
    },
    medicalDate: {
      type: Date,
      required: [true, 'Medical examination date is required'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    hospitalName: {
      type: String,
      required: [true, 'Hospital / clinic name is required'],
      trim: true,
    },
    doctorName: {
      type: String,
      default: '',
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    encryptedFileName: {
      type: String,
      required: true,
      unique: true,
    },
    // Envelope Encryption Metadata (AES-256-GCM)
    originalSha256: {
      type: String,
      required: true,
      length: 64,
    },
    ivHex: {
      type: String,
      required: true,
    },
    authTagHex: {
      type: String,
      required: true,
    },
    wrappedDekHex: {
      type: String,
      required: true,
    },
    keyVersion: {
      type: String,
      default: 'v1',
    },
    encryptionAlgorithm: {
      type: String,
      default: 'AES-256-GCM',
    },
    // Digital Signature Metadata (RSA-PSS)
    digitalSignature: {
      signatureHex: { type: String, required: true },
      algorithm: { type: String, default: 'RSA-PSS-SHA256' },
      signerRole: { type: String, default: 'system' },
      signerName: { type: String, default: 'SecureMed Share Automated Attestation Authority' },
      keyId: { type: String, default: 'system-rsa-pss-v1' },
      signedAt: { type: Date, default: Date.now },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

medicalRecordSchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.model('MedicalRecord', medicalRecordSchema);
