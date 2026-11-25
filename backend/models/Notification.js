import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'access_request',
        'consent_granted',
        'consent_rejected',
        'consent_revoked',
        'record_accessed',
        'doctor_verified',
        'doctor_rejected',
        'security_alert',
        'system'
      ],
      default: 'system',
    },
    relatedRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
    relatedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConsentRequest',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
