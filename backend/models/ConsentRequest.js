import mongoose from 'mongoose';

const consentRequestSchema = new mongoose.Schema(
  {
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
    doctorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
    },
    reason: {
      type: String,
      required: [true, 'Clinical reason for record access is required'],
      trim: true,
      maxlength: 500,
    },
    requestedPermission: {
      type: String,
      enum: ['view', 'view_download'],
      default: 'view',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revoked', 'expired'],
      default: 'pending',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    responseNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

consentRequestSchema.index({ patientId: 1, status: 1 });
consentRequestSchema.index({ doctorId: 1, status: 1 });

export default mongoose.model('ConsentRequest', consentRequestSchema);
