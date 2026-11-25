import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import MedicalRecord from '../models/MedicalRecord.js';
import ConsentGrant from '../models/ConsentGrant.js';
import ConsentRequest from '../models/ConsentRequest.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { logAuditEvent } from '../middleware/audit.js';

export const getSystemStats = async (req, res, next) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const pendingVerifications = await DoctorProfile.countDocuments({ verificationStatus: 'pending' });
    const totalEncryptedRecords = await MedicalRecord.countDocuments({ isArchived: false });
    const totalSecurityEvents = await AuditLog.countDocuments({
      action: {
        $in: [
          'USER_LOGIN_FAILED',
          'ACCESS_DENIED_UNAUTHORIZED',
          'ACCESS_DENIED_CONSENT_EXPIRED',
          'ACCESS_DENIED_UNVERIFIED_DOCTOR',
          'RECORD_INTEGRITY_FAILED',
          'RECORD_TAMPER_SIMULATION',
        ],
      },
    });

    // Consent distribution
    const activeConsents = await ConsentGrant.countDocuments({
      status: 'active',
      validUntil: { $gt: new Date() },
    });
    const revokedConsents = await ConsentGrant.countDocuments({ status: 'revoked' });
    const expiredConsents = await ConsentGrant.countDocuments({
      $or: [{ status: 'expired' }, { validUntil: { $lte: new Date() } }],
    });

    // Records by category
    const categoryStats = await MedicalRecord.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    // Recent 7 days activity trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activityTrend = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalEvents: { $sum: 1 },
          securityAlerts: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$action',
                    [
                      'USER_LOGIN_FAILED',
                      'ACCESS_DENIED_UNAUTHORIZED',
                      'ACCESS_DENIED_CONSENT_EXPIRED',
                      'RECORD_INTEGRITY_FAILED',
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        pendingVerifications,
        totalEncryptedRecords,
        totalSecurityEvents,
        consents: {
          active: activeConsents,
          revoked: revokedConsents,
          expired: expiredConsents,
        },
        categoryStats,
        activityTrend,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingDoctors = async (req, res, next) => {
  try {
    const pendingProfiles = await DoctorProfile.find({ verificationStatus: 'pending' })
      .populate('userId', 'name email phone createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: pendingProfiles.length,
      doctors: pendingProfiles,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyDoctor = async (req, res, next) => {
  try {
    const { doctorProfileId } = req.params;
    const { status, notes } = req.body; // status: 'verified' | 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "verified" or "rejected".',
      });
    }

    const profile = await DoctorProfile.findById(doctorProfileId).populate('userId', 'name email');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    profile.verificationStatus = status;
    profile.verifiedAt = new Date();
    profile.verifiedBy = req.user._id;
    profile.verificationNotes = notes || '';
    await profile.save();

    // Notify doctor
    await Notification.create({
      userId: profile.userId._id,
      title: status === 'verified' ? 'Medical Credentials Verified' : 'Medical Credentials Rejected',
      message:
        status === 'verified'
          ? 'Your medical license has been verified by the administrator. You may now request and access patient records.'
          : `Your medical registration was rejected by administrator. Reason: ${notes || 'Credentials could not be verified.'}`,
      type: status === 'verified' ? 'doctor_verified' : 'doctor_rejected',
    });

    // Log audit event
    await logAuditEvent({
      req,
      action: status === 'verified' ? 'DOCTOR_VERIFIED_BY_ADMIN' : 'DOCTOR_REJECTED_BY_ADMIN',
      outcome: 'success',
      details: `Admin ${req.user.name} marked Dr. ${profile.userId.name} as ${status}. License: ${profile.licenseNumber}`,
    });

    res.status(200).json({
      success: true,
      message: `Doctor status updated to ${status}.`,
      profile,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort('-createdAt').lean();

    // Populate doctor profiles for doctor users
    const doctorUserIds = users.filter((u) => u.role === 'doctor').map((u) => u._id);
    const doctorProfiles = await DoctorProfile.find({ userId: { $in: doctorUserIds } });
    const profileMap = {};
    doctorProfiles.forEach((p) => {
      profileMap[p.userId.toString()] = p;
    });

    const enrichedUsers = users.map((u) => ({
      ...u,
      doctorProfile: profileMap[u._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'active' | 'suspended'

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Administrators cannot suspend their own account.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = status;
    await user.save();

    await logAuditEvent({
      req,
      action: 'USER_STATUS_CHANGED',
      outcome: 'success',
      details: `Admin ${req.user.name} changed status of ${user.email} to ${status}`,
      securitySeverity: status === 'suspended' ? 'high' : 'info',
    });

    res.status(200).json({
      success: true,
      message: `User account status updated to ${status}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSecurityEvents = async (req, res, next) => {
  try {
    const events = await AuditLog.find({
      $or: [
        { securitySeverity: { $in: ['medium', 'high', 'critical'] } },
        { outcome: { $in: ['denied', 'failed'] } },
      ],
    })
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (err) {
    next(err);
  }
};
