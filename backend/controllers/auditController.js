import AuditLog from '../models/AuditLog.js';
import MedicalRecord from '../models/MedicalRecord.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, role, outcome, search, limit = 100, page = 1 } = req.query;
    const query = {};

    // Patient can view audit events relating to their records or actions
    if (req.user.role === 'patient') {
      const patientRecords = await MedicalRecord.find({ patientId: req.user._id }).select('_id');
      const recordIds = patientRecords.map((r) => r._id);
      query.$or = [
        { actorId: req.user._id },
        { recordId: { $in: recordIds } },
        { details: { $regex: req.user.name, $options: 'i' } },
      ];
    } else if (req.user.role === 'doctor') {
      query.$or = [{ actorId: req.user._id }];
    }
    // Admin sees all audit logs

    if (action && action !== 'all') query.action = action;
    if (role && role !== 'all') query.actorRole = role;
    if (outcome && outcome !== 'all') query.outcome = outcome;

    if (search) {
      query.$or = [
        { actorName: { $regex: search, $options: 'i' } },
        { actorEmail: { $regex: search, $options: 'i' } },
        { recordTitle: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
      ];
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort('-createdAt').skip(skip).limit(parsedLimit).lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      logs,
    });
  } catch (err) {
    next(err);
  }
};

export const exportAuditLogsCSV = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') {
      const patientRecords = await MedicalRecord.find({ patientId: req.user._id }).select('_id');
      const recordIds = patientRecords.map((r) => r._id);
      query.$or = [
        { actorId: req.user._id },
        { recordId: { $in: recordIds } },
        { details: { $regex: req.user.name, $options: 'i' } },
      ];
    } else if (req.user.role === 'doctor') {
      query.$or = [{ actorId: req.user._id }];
    }

    const logs = await AuditLog.find(query).sort('-createdAt').limit(2000).lean();

    // Create CSV header
    const headers = [
      'Timestamp (ISO)',
      'Action',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'Record Title',
      'Outcome',
      'IP Address',
      'Security Severity',
      'Details',
    ];

    const escapeCsv = (str) => {
      if (!str) return '""';
      const escaped = String(str).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = logs.map((log) => [
      escapeCsv(new Date(log.createdAt).toISOString()),
      escapeCsv(log.action),
      escapeCsv(log.actorName),
      escapeCsv(log.actorEmail),
      escapeCsv(log.actorRole),
      escapeCsv(log.recordTitle || 'N/A'),
      escapeCsv(log.outcome),
      escapeCsv(log.ipAddress),
      escapeCsv(log.securitySeverity),
      escapeCsv(log.details),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="securemed_audit_trail_${Date.now()}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
