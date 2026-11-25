import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerPatient,
  registerDoctor,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  sendOtp,
  verifyLoginOtp,
  registerPatientWithOtp,
  googleLogin,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validate,
  registerPatientSchema,
  registerDoctorSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  sendOtpSchema,
  verifyLoginOtpSchema,
  registerPatientWithOtpSchema,
} from '../middleware/validation.js';

const router = express.Router();

// Sensitive authentication endpoints rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: {
    success: false,
    message: 'Too many registration requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration
router.post('/register/patient', registerLimiter, validate(registerPatientSchema), registerPatient);
router.post('/register/doctor', registerLimiter, validate(registerDoctorSchema), registerDoctor);

// Login
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', authLimiter, validate(googleLoginSchema), googleLogin);

// Email OTP Endpoints
router.post('/otp/send', authLimiter, validate(sendOtpSchema), sendOtp);
router.post('/otp/verify-login', authLimiter, validate(verifyLoginOtpSchema), verifyLoginOtp);
router.post('/otp/verify-register', registerLimiter, validate(registerPatientWithOtpSchema), registerPatientWithOtp);

// Token Refresh & Session
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

// User Profile
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

// Password Management
router.post('/forgot-password', resetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

// Email Verification
router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);

export default router;
