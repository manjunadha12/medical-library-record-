import mongoose from 'mongoose';

const consentGrantSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConsentRequest',
      required: false,
      index: true,
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    permission: {
      type: String,
      enum: ['view', 'view_download'],
      default: 'view',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired'],
      default: 'active',
      index: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify if grant is currently active and not expired
consentGrantSchema.methods.isCurrentlyActive = function () {
  if (this.status !== 'active') return false;
  const now = new Date();
  if (now > this.validUntil) {
    this.status = 'expired';
    return false;
  }
  return true;
};

consentGrantSchema.index({ recordId: 1, doctorId: 1, status: 1 });

export default mongoose.model('ConsentGrant', consentGrantSchema);
