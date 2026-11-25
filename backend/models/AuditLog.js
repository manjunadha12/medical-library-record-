import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    actorName: {
      type: String,
      default: 'System / Anonymous',
    },
    actorEmail: {
      type: String,
      default: '',
    },
    actorRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin', 'anonymous', 'system'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_LOGIN_SUCCESS',
        'USER_LOGIN_FAILED',
        'USER_LOGIN_GOOGLE',
        'USER_ACCOUNT_LOCKED',
        'TOKEN_REFRESH_SUCCESS',
        'TOKEN_REFRESH_REUSE_DETECTED',
        'USER_LOGOUT',
        'USER_REGISTER',
        'ADMIN_ACCOUNT_CREATED',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'PASSWORD_CHANGED',
        'EMAIL_VERIFIED',
        'RECORD_UPLOAD',
        'RECORD_VIEW',
        'RECORD_DOWNLOAD',
        'RECORD_INTEGRITY_VERIFIED',
        'RECORD_INTEGRITY_FAILED',
        'RECORD_TAMPER_SIMULATION',
        'CONSENT_REQUEST_SUBMITTED',
        'CONSENT_GRANTED',
        'CONSENT_REJECTED',
        'CONSENT_REVOKED',
        'ACCESS_DENIED_UNAUTHORIZED',
        'ACCESS_DENIED_CONSENT_EXPIRED',
        'ACCESS_DENIED_UNVERIFIED_DOCTOR',
        'DOCTOR_VERIFIED_BY_ADMIN',
        'DOCTOR_REJECTED_BY_ADMIN',
        'USER_STATUS_CHANGED'
      ],
      index: true,
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
      required: false,
      index: true,
    },
    recordTitle: {
      type: String,
      default: '',
    },
    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConsentGrant',
      required: false,
    },
    outcome: {
      type: String,
      enum: ['success', 'denied', 'failed'],
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    securitySeverity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      default: 'info',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only audit trail
  }
);

// Prevent modifications or deletions of existing audit log entries (strictly immutable)
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function (next) {
  if (this.getOptions && this.getOptions()?.bypassAuditImmutability) {
    return next();
  }
  next(new Error('AUDIT VIOLATION: Audit logs are strictly immutable and cannot be modified or deleted.'));
});

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
