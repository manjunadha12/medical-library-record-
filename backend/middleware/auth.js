import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first (accessToken or token)
    if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
      token = req.cookies.accessToken || req.cookies.token;
    } 
    // 2. Fallback to Authorization header Bearer token
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User no longer exists.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended by system administrator.',
      });
    }

    // Check single device session invalidation:
    // If the token contains a sessionId and user has an activeSession that doesn't match, this device was logged out!
    if (decoded.sessionId && user.activeSession?.sessionId && decoded.sessionId !== user.activeSession.sessionId) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_TERMINATED',
        message: 'Your account was signed in on another device. You have been logged out from this device.',
      });
    }

    // Update session last activity periodically
    if (user.activeSession?.sessionId && decoded.sessionId === user.activeSession.sessionId) {
      const now = new Date();
      if (!user.activeSession.lastActivity || now - user.activeSession.lastActivity > 60000) {
        user.activeSession.lastActivity = now;
        user.save().catch(() => {});
      }
    }

    req.user = user;

    // If doctor, populate profile
    if (user.role === 'doctor') {
      const doctorProfile = await DoctorProfile.findOne({ userId: user._id });
      req.doctorProfile = doctorProfile;
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Session token has expired. Please refresh session.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.',
    });
  }
};
