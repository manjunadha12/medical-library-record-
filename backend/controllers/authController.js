import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import RefreshToken from '../models/RefreshToken.js';
import EmailOtp from '../models/EmailOtp.js';
import { logAuditEvent } from '../middleware/audit.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendOtpEmail } from '../services/emailService.js';


const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes (seconds)
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days (seconds)

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const parseDeviceInfo = (req) => {
  const ua = req.headers['user-agent'] || '';
  let browser = 'Web Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';

  let os = 'Device';
  if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android Device';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS Device';
  else if (/Linux/i.test(ua)) os = 'Linux PC';

  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'Localhost';

  return {
    browser,
    os,
    device: `${browser} on ${os}`,
    ipAddress,
    userAgent: ua,
  };
};

const createAccessToken = (userId, role, sessionId) => {
  return jwt.sign({ id: userId, role, sessionId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const createRefreshToken = (userId, sessionId) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const token = jwt.sign({ id: userId, nonce: rawToken, sessionId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return token;
};

const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: maxAgeMs,
  path: '/',
});

const sendAuthResponse = async (user, doctorProfile, statusCode, res, req) => {
  // Generate a unique session ID for single-device tracking
  const sessionId = crypto.randomUUID();
  const deviceInfo = parseDeviceInfo(req);

  // Update user with active single-device session
  user.activeSession = {
    sessionId,
    device: deviceInfo.device,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    ipAddress: deviceInfo.ipAddress,
    userAgent: deviceInfo.userAgent,
    lastActivity: new Date(),
  };
  await user.save();

  // Invalidate all prior refresh tokens for this user to ensure only 1 active device
  await RefreshToken.updateMany(
    { userId: user._id, revoked: false },
    { $set: { revoked: true, revokedAt: new Date() } }
  );

  const accessToken = createAccessToken(user._id, user.role, sessionId);
  const refreshToken = createRefreshToken(user._id, sessionId);

  // Store hashed refresh token in DB
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    ipAddress: deviceInfo.ipAddress,
    userAgent: deviceInfo.userAgent,
  });

  // Set HTTP-Only cookies
  res.cookie('accessToken', accessToken, getCookieOptions(ACCESS_TOKEN_TTL * 1000));
  res.cookie('token', accessToken, getCookieOptions(ACCESS_TOKEN_TTL * 1000)); // Backward compatibility
  res.cookie('refreshToken', refreshToken, getCookieOptions(REFRESH_TOKEN_TTL * 1000));

  const userData = {
    id: user._id,
    patientId: user.patientId || null,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    avatar: user.avatar,
    lastLoginAt: user.lastLoginAt,
    activeSession: {
      device: user.activeSession.device,
      browser: user.activeSession.browser,
      os: user.activeSession.os,
      ipAddress: user.activeSession.ipAddress,
      lastActivity: user.activeSession.lastActivity,
    },
    createdAt: user.createdAt,
    doctorProfile: doctorProfile || null,
  };

  res.status(statusCode).json({
    success: true,
    user: userData,
    token: accessToken, // Retained for headless API clients / test runners
  });
};

export const registerPatient = async (req, res, next) => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, address } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const verificationRaw = crypto.randomBytes(32).toString('hex');
    const verificationHash = hashToken(verificationRaw);

    const user = await User.create({
      name,
      patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      email: email.toLowerCase(),
      password,
      role: 'patient',
      phone,
      dateOfBirth,
      gender,
      address,
      authProvider: 'local',
      isEmailVerified: false,
      emailVerificationToken: verificationHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    // Send verification email asynchronously
    sendVerificationEmail(user.email, verificationRaw, user.name).catch((e) =>
      console.warn('[EMAIL WARNING] Failed to send verification email:', e.message)
    );

    await logAuditEvent({
      req,
      actor: user,
      action: 'USER_REGISTER',
      outcome: 'success',
      details: `New patient account created: ${user.name} (${user.email})`,
    });

    await sendAuthResponse(user, null, 201, res, req);
  } catch (err) {
    next(err);
  }
};

export const registerDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      licenseNumber,
      hospitalAffiliation,
      experienceYears,
      qualification,
      bio,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const verificationRaw = crypto.randomBytes(32).toString('hex');
    const verificationHash = hashToken(verificationRaw);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'doctor',
      phone,
      authProvider: 'local',
      isEmailVerified: false,
      emailVerificationToken: verificationHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const doctorProfile = await DoctorProfile.create({
      userId: user._id,
      specialization,
      licenseNumber,
      hospitalAffiliation,
      experienceYears: Number(experienceYears) || 0,
      qualification,
      bio,
      verificationStatus: 'pending',
    });

    sendVerificationEmail(user.email, verificationRaw, user.name).catch((e) =>
      console.warn('[EMAIL WARNING] Failed to send verification email:', e.message)
    );

    await logAuditEvent({
      req,
      actor: user,
      action: 'USER_REGISTER',
      outcome: 'success',
      details: `New doctor registered (Pending verification): Dr. ${user.name} (License: ${licenseNumber})`,
    });

    await sendAuthResponse(user, doctorProfile, 201, res, req);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      await logAuditEvent({
        req,
        action: 'USER_LOGIN_FAILED',
        outcome: 'failed',
        details: `Login failure: non-existent email attempt (${email})`,
        securitySeverity: 'medium',
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account lockout
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      await logAuditEvent({
        req,
        actor: user,
        action: 'USER_ACCOUNT_LOCKED',
        outcome: 'denied',
        details: `Login blocked: account is temporarily locked for ${minutesLeft} more minutes`,
        securitySeverity: 'high',
      });
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to consecutive failed login attempts. Please try again in ${minutesLeft} minute(s).`,
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by system administrators. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      const attemptsRemaining = Math.max(0, 5 - user.failedLoginAttempts);

      await logAuditEvent({
        req,
        actor: user,
        action: 'USER_LOGIN_FAILED',
        outcome: 'failed',
        details: `Failed password attempt for ${user.email}. Attempts before lockout: ${attemptsRemaining}`,
        securitySeverity: user.failedLoginAttempts >= 5 ? 'high' : 'medium',
      });

      if (user.failedLoginAttempts >= 5) {
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
        });
      }

      return res.status(401).json({
        success: false,
        message: `Invalid email or password. (${attemptsRemaining} attempt(s) remaining before temporary lockout)`,
      });
    }

    // Single-device login check:
    // If the account has an active session on another device and `forceLogin` is not specified, alert the user!
    const { forceLogin } = req.body;
    const currentDevice = parseDeviceInfo(req);

    if (
      user.activeSession?.sessionId &&
      user.activeSession?.device &&
      !forceLogin
    ) {
      // Check if the active session is recent (within past 2 hours)
      const lastActive = user.activeSession.lastActivity || user.lastLoginAt || new Date();
      const sessionAgeMinutes = Math.round((Date.now() - new Date(lastActive).getTime()) / (60 * 1000));

      if (sessionAgeMinutes < 120) {
        return res.status(409).json({
          success: false,
          code: 'ACTIVE_SESSION_EXISTS',
          message: `This account is currently logged in on another device: ${user.activeSession.device} (IP: ${user.activeSession.ipAddress || 'unknown'}). Logging in here will terminate the other device's session.`,
          activeDevice: {
            device: user.activeSession.device,
            browser: user.activeSession.browser,
            os: user.activeSession.os,
            ipAddress: user.activeSession.ipAddress,
            lastActivity: lastActive,
          },
        });
      }
    }

    // Reset lockout counters on success
    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    await user.save();

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
    }

    await logAuditEvent({
      req,
      actor: user,
      action: 'USER_LOGIN_SUCCESS',
      outcome: 'success',
      details: `Successful login: ${user.name} (${user.role})`,
    });

    await sendAuthResponse(user, doctorProfile, 200, res, req);
  } catch (err) {
    next(err);
  }
};

/**
 * Silent Refresh Token Rotation
 */
export const refreshToken = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not found in cookies.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET);
    } catch (tokenErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingRecord = await RefreshToken.findOne({ tokenHash });

    if (!existingRecord) {
      return res.status(401).json({ success: false, message: 'Refresh token unrecognized.' });
    }

    // Reuse detection: if token is already marked revoked, revoke all tokens for this user!
    if (existingRecord.revoked) {
      await RefreshToken.updateMany({ userId: existingRecord.userId }, { $set: { revoked: true, revokedAt: new Date() } });

      await logAuditEvent({
        req,
        action: 'TOKEN_REFRESH_REUSE_DETECTED',
        outcome: 'denied',
        details: `Suspicious refresh token reuse detected for user ${existingRecord.userId}. All sessions invalidated.`,
        securitySeverity: 'high',
      });

      res.clearCookie('accessToken', getCookieOptions(0));
      res.clearCookie('token', getCookieOptions(0));
      res.clearCookie('refreshToken', getCookieOptions(0));

      return res.status(401).json({
        success: false,
        message: 'Security violation: Refresh token reuse detected. Please log in again.',
      });
    }

    // Mark current refresh token as revoked
    existingRecord.revoked = true;
    existingRecord.revokedAt = new Date();
    await existingRecord.save();

    const user = await User.findById(existingRecord.userId);
    if (!user || user.status === 'suspended') {
      return res.status(401).json({ success: false, message: 'User account unavailable or suspended.' });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
    }

    await logAuditEvent({
      req,
      actor: user,
      action: 'TOKEN_REFRESH_SUCCESS',
      outcome: 'success',
      details: `Silent token rotation completed for ${user.email}`,
    });

    await sendAuthResponse(user, doctorProfile, 200, res, req);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.findOneAndUpdate({ tokenHash }, { $set: { revoked: true, revokedAt: new Date() } });
    }

    res.clearCookie('accessToken', getCookieOptions(0));
    res.clearCookie('token', getCookieOptions(0));
    res.clearCookie('refreshToken', getCookieOptions(0));

    if (req.user) {
      // Clear activeSession in user document
      await User.findByIdAndUpdate(req.user._id, {
        $set: {
          'activeSession.sessionId': null,
          'activeSession.device': '',
          'activeSession.browser': '',
          'activeSession.os': '',
          'activeSession.ipAddress': '',
          'activeSession.userAgent': '',
          'activeSession.lastActivity': null,
        },
      });

      await logAuditEvent({
        req,
        actor: req.user,
        action: 'USER_LOGOUT',
        outcome: 'success',
        details: `User logged out: ${req.user.name} (${req.user.email})`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Authentication tokens cleared.',
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        patientId: user.patientId || null,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        status: user.status,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
        lastLoginAt: user.lastLoginAt,
        activeSession: user.activeSession ? {
          device: user.activeSession.device,
          browser: user.activeSession.browser,
          os: user.activeSession.os,
          ipAddress: user.activeSession.ipAddress,
          lastActivity: user.activeSession.lastActivity,
        } : null,
        createdAt: user.createdAt,
        doctorProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, gender, dateOfBirth } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();

    let doctorProfile = null;
    if (user.role === 'doctor') {
      const { specialization, hospitalAffiliation, bio, experienceYears } = req.body;
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
      if (doctorProfile) {
        if (specialization) doctorProfile.specialization = specialization;
        if (hospitalAffiliation) doctorProfile.hospitalAffiliation = hospitalAffiliation;
        if (bio !== undefined) doctorProfile.bio = bio;
        if (experienceYears !== undefined) doctorProfile.experienceYears = Number(experienceYears) || 0;
        await doctorProfile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        patientId: user.patientId || null,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        doctorProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success even if user not found to prevent user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email address, a password reset link has been dispatched.',
      });
    }

    const resetRaw = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(resetRaw);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    sendPasswordResetEmail(user.email, resetRaw, user.name).catch((e) =>
      console.warn('[EMAIL WARNING] Failed to send password reset email:', e.message)
    );

    await logAuditEvent({
      req,
      actor: user,
      action: 'PASSWORD_RESET_REQUESTED',
      outcome: 'success',
      details: `Password reset requested for ${user.email}`,
      securitySeverity: 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired.',
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Revoke all existing sessions for security
    await RefreshToken.updateMany({ userId: user._id }, { $set: { revoked: true, revokedAt: new Date() } });

    await logAuditEvent({
      req,
      actor: user,
      action: 'PASSWORD_RESET_COMPLETED',
      outcome: 'success',
      details: `Password successfully reset for ${user.email}`,
      securitySeverity: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. Please log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password provided is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    await logAuditEvent({
      req,
      actor: user,
      action: 'PASSWORD_CHANGED',
      outcome: 'success',
      details: `Password changed by authenticated user ${user.email}`,
      securitySeverity: 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email verification token is invalid or has expired.',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await logAuditEvent({
      req,
      actor: user,
      action: 'EMAIL_VERIFIED',
      outcome: 'success',
      details: `Email address verified for ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: 'Your email address has been verified successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const sendOtp = async (req, res, next) => {
  try {
    const { email, purpose = 'login' } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (purpose === 'login') {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email. Please register as a patient or check the address entered.',
        });
      }
      if (user.isLocked()) {
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(423).json({
          success: false,
          message: `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`,
        });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Account suspended by administrator.',
        });
      }
    } else if (purpose === 'register_patient') {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please sign in.',
        });
      }
    }

    // Generate random 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashToken(rawOtp);

    // Remove any previous active OTP for this email and purpose
    await EmailOtp.deleteMany({ email: normalizedEmail, purpose });

    // Store in DB with 10-minute validity
    await EmailOtp.create({
      email: normalizedEmail,
      otpHash,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpEmail(normalizedEmail, rawOtp, purpose);

    const isSmtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

    res.status(200).json({
      success: true,
      message: isSmtpConfigured
        ? `A 6-digit OTP passcode has been sent to ${normalizedEmail}. Please check your email inbox.`
        : `[Demo Mode] Verification OTP is ${rawOtp} (SMTP credentials not yet configured)`,
      devOtp: isSmtpConfigured ? undefined : rawOtp,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await EmailOtp.findOne({
      email: normalizedEmail,
      purpose: 'login',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new passcode.',
      });
    }

    if (otpRecord.attempts >= 5) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a fresh OTP.',
      });
    }

    const candidateHash = hashToken(otp.trim());
    if (candidateHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const left = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP code. ${left} attempt(s) remaining.`,
      });
    }

    // OTP is valid - consume it
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended.',
      });
    }

    // Single-device login check for OTP login:
    const { forceLogin } = req.body;
    if (
      user.activeSession?.sessionId &&
      user.activeSession?.device &&
      !forceLogin
    ) {
      const lastActive = user.activeSession.lastActivity || user.lastLoginAt || new Date();
      const sessionAgeMinutes = Math.round((Date.now() - new Date(lastActive).getTime()) / (60 * 1000));

      if (sessionAgeMinutes < 120) {
        return res.status(409).json({
          success: false,
          code: 'ACTIVE_SESSION_EXISTS',
          message: `This account is currently logged in on another device: ${user.activeSession.device} (IP: ${user.activeSession.ipAddress || 'unknown'}). Logging in here will terminate the other device's session.`,
          activeDevice: {
            device: user.activeSession.device,
            browser: user.activeSession.browser,
            os: user.activeSession.os,
            ipAddress: user.activeSession.ipAddress,
            lastActivity: lastActive,
          },
        });
      }
    }

    // Mark email as verified since they verified through email OTP
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
    }
    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    await user.save();

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
    }

    await logAuditEvent({
      req,
      actor: user,
      action: 'USER_LOGIN',
      outcome: 'success',
      details: `User logged in via Email OTP: ${user.email} (${user.role})`,
    });

    await sendAuthResponse(user, doctorProfile, 200, res, req);
  } catch (err) {
    next(err);
  }
};

export const registerPatientWithOtp = async (req, res, next) => {
  try {
    const { name, email, phone, gender, dateOfBirth, address, password, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP first
    const otpRecord = await EmailOtp.findOne({
      email: normalizedEmail,
      purpose: 'register_patient',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new verification code.',
      });
    }

    if (otpRecord.attempts >= 5) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a fresh OTP.',
      });
    }

    const candidateHash = hashToken(otp.trim());
    if (candidateHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const left = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP code. ${left} attempt(s) remaining.`,
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Consume OTP
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    // Fallback secure password if patient only logs in via OTP
    const userPassword = password || `SM_${crypto.randomBytes(8).toString('hex')}!Aa1`;

    const user = await User.create({
      name: name.trim(),
      patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      email: normalizedEmail,
      password: userPassword,
      role: 'patient',
      phone: phone.trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || 'prefer_not_to_say',
      address: address ? address.trim() : '',
      authProvider: 'local',
      isEmailVerified: true,
    });

    await logAuditEvent({
      req,
      actor: user,
      action: 'USER_REGISTER',
      outcome: 'success',
      details: `New patient registered via Email OTP: ${user.name} (${user.email}, Phone: ${user.phone})`,
    });

    await sendAuthResponse(user, null, 201, res, req);
  } catch (err) {
    next(err);
  }
};

/**
 * Google OAuth Sign-in & Registration
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { credential, forceLogin } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required.',
      });
    }

    // Verify Google ID token via Google's tokeninfo endpoint (no client secret required)
    let payload;
    try {
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!googleRes.ok) {
        throw new Error('Google token validation failed');
      }
      payload = await googleRes.json();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google authentication token.',
      });
    }

    // Verify audience matches configured Google Client ID if configured
    if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({
        success: false,
        message: 'Google token audience mismatch.',
      });
    }

    const email = payload.email?.toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google profile does not contain an email address.',
      });
    }

    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email }],
    });

    if (user) {
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended by system administrators. Please contact support.',
        });
      }

      // Single-device login check
      if (
        user.activeSession?.sessionId &&
        user.activeSession?.device &&
        !forceLogin
      ) {
        const lastActive = user.activeSession.lastActivity || user.lastLoginAt || new Date();
        const sessionAgeMinutes = Math.round((Date.now() - new Date(lastActive).getTime()) / (60 * 1000));

        if (sessionAgeMinutes < 120) {
          return res.status(409).json({
            success: false,
            code: 'ACTIVE_SESSION_EXISTS',
            message: `This account is currently logged in on another device: ${user.activeSession.device} (IP: ${user.activeSession.ipAddress || 'unknown'}). Logging in here will terminate the other device's session.`,
            activeDevice: {
              device: user.activeSession.device,
              browser: user.activeSession.browser,
              os: user.activeSession.os,
              ipAddress: user.activeSession.ipAddress,
              lastActivity: lastActive,
            },
          });
        }
      }

      // Link googleId and verify email if not already done
      if (!user.googleId) user.googleId = payload.sub;
      if (!user.isEmailVerified && (payload.email_verified === 'true' || payload.email_verified === true)) {
        user.isEmailVerified = true;
      }
      if (!user.avatar && payload.picture) {
        user.avatar = payload.picture;
      }

      // Check if user qualifies as Admin
      const adminEmails = (process.env.ADMIN_EMAIL || 'admin@securemed.io')
        .toLowerCase()
        .split(',')
        .map((e) => e.trim());
      if (adminEmails.includes(email) && user.role !== 'admin') {
        user.role = 'admin';
      }

      user.lastLoginAt = new Date();
      await user.save();
    } else {
      const adminEmails = (process.env.ADMIN_EMAIL || 'admin@securemed.io')
        .toLowerCase()
        .split(',')
        .map((e) => e.trim());
      const isAdminEmail = adminEmails.includes(email);

      // Create new account with Google authentication
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        patientId: isAdminEmail ? null : `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        authProvider: 'google',
        googleId: payload.sub,
        avatar: payload.picture || '',
        role: isAdminEmail ? 'admin' : 'patient',
        isEmailVerified: payload.email_verified === 'true' || payload.email_verified === true,
        status: 'active',
        lastLoginAt: new Date(),
      });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
    }

    await logAuditEvent({
      req,
      actor: user,
      action: 'USER_LOGIN_GOOGLE',
      outcome: 'success',
      details: `Successful Google OAuth login: ${user.name} (${user.email})`,
    });

    await sendAuthResponse(user, doctorProfile, 200, res, req);
  } catch (err) {
    next(err);
  }
};
