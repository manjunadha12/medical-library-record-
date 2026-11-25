import AuditLog from '../models/AuditLog.js';

/**
 * Creates an immutable audit log entry.
 */
export const logAuditEvent = async ({
  req = null,
  actor = null,
  action,
  recordId = null,
  recordTitle = '',
  consentId = null,
  outcome = 'success',
  details = '',
  securitySeverity = 'info',
}) => {
  try {
    const actorId = actor?._id || req?.user?._id || null;
    const actorName = actor?.name || req?.user?.name || 'Anonymous/System';
    const actorEmail = actor?.email || req?.user?.email || '';
    const actorRole = actor?.role || req?.user?.role || (req ? 'anonymous' : 'system');
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || '';

    await AuditLog.create({
      actorId,
      actorName,
      actorEmail,
      actorRole,
      action,
      recordId,
      recordTitle,
      consentId,
      outcome,
      ipAddress: String(ipAddress).replace('::ffff:', ''),
      userAgent,
      details,
      securitySeverity,
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR] Failed to record audit entry:', err.message);
  }
};
