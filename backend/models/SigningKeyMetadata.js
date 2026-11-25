import mongoose from 'mongoose';

const signingKeyMetadataSchema = new mongoose.Schema(
  {
    keyId: {
      type: String,
      required: true,
      unique: true,
    },
    algorithm: {
      type: String,
      default: 'RSA-PSS-SHA256',
    },
    publicKeyPem: {
      type: String,
      required: true,
    },
    ownerRole: {
      type: String,
      default: 'system',
    },
    ownerName: {
      type: String,
      default: 'SecureMed Share Automated Attestation Authority',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('SigningKeyMetadata', signingKeyMetadataSchema);
