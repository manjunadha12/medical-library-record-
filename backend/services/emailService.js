import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    const secure = env.SMTP_PORT === 465;
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure,
      requireTLS: !secure,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  } else {
    // Development fallback mock transporter
    transporter = {
      sendMail: async (options) => {
        console.log('\n=============================================================');
        console.log(' [DEVELOPMENT EMAIL DISPATCH] SMTP Not Configured');
        console.log(` To:      ${options.to}`);
        console.log(` Subject: ${options.subject}`);
        console.log(' Content:');
        console.log(options.text || options.html);
        console.log('=============================================================\n');
        return { messageId: 'mock-dev-email-id' };
      },
    };
  }

  return transporter;
}

export const sendVerificationEmail = async (email, token, name) => {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  const mailer = getTransporter();

  try {
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'SecureMed Share — Verify Your Email Address',
      text: `Hello ${name},\n\nPlease verify your email address by clicking the link below:\n${verifyUrl}\n\nThis verification link expires in 24 hours.\n\nThank you,\nSecureMed Share Security Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #0284c7;">SecureMed Share</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
          <p style="margin: 24px 0;">
            <a href="${verifyUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">Or copy and paste this URL into your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 11px; color: #94a3b8;">This link expires in 24 hours. If you did not create this account, please ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn(`[EMAIL WARNING] Could not dispatch verification email via SMTP.`);
  }
};

export const sendPasswordResetEmail = async (email, token, name) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  const mailer = getTransporter();

  try {
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'SecureMed Share — Password Reset Request',
      text: `Hello ${name},\n\nA password reset request was received for your account. Reset your password using the link below:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please contact administrator immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #0284c7;">SecureMed Share</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to choose a new secure password:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">Or copy and paste this URL into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 11px; color: #94a3b8;">This password reset link expires in 1 hour. If you did not initiate this request, your account remains secure and you can disregard this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn(`[EMAIL WARNING] Could not dispatch password reset email via SMTP.`);
  }
};

export const sendOtpEmail = async (email, otp, purpose = 'login', name = '') => {
  const mailer = getTransporter();
  const title = purpose === 'login' ? 'Your Sign-In Passcode (OTP)' : 'Verify Your Email — OTP';
  const heading = purpose === 'login' ? 'Sign In Passcode' : 'Patient Registration Verification';
  const greeting = name ? `Hello <strong>${name}</strong>,` : 'Hello,';
  const actionText =
    purpose === 'login'
      ? 'Use the 6-digit one-time passcode below to securely sign in to your SecureMed Share account:'
      : 'Use the 6-digit one-time passcode below to verify your email and complete your patient registration:';

  try {
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: `SecureMed Share — ${title}`,
      text: `Hello ${name || 'User'},\n\nYour one-time verification passcode (OTP) is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this code, please ignore this email.\n\nSecureMed Share Security Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="margin-bottom: 20px;">
            <h1 style="font-size: 22px; font-weight: 800; color: #0284c7; margin: 0;">SecureMed Share</h1>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">Privacy-Preserving Medical Record Platform</p>
          </div>
          <h2 style="font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 12px;">${heading}</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 16px;">${greeting}</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 24px;">${actionText}</p>
          <div style="background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #0369a1; font-weight: 700; margin-bottom: 8px;">6-Digit Passcode</div>
            <div style="font-size: 36px; font-family: monospace; font-weight: 800; letter-spacing: 8px; color: #0284c7;">${otp}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for 10 minutes</div>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 20px;">
            If you did not request this code, please disregard this email. Never disclose this verification code to anyone.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; margin: 0; text-align: center;">
            SecureMed Share &bull; End-to-End Cryptographic Patient Protection
          </p>
        </div>
      `,
    });
  } catch (err) {
    throw Object.assign(new Error('Unable to send a code right now. Please try again.'), { status: 503 });
  }
};

