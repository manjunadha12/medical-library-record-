import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);

// Ensure the backend/.env file is loaded regardless of current working directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config(); // Fallback to current working directory if any

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  
  // Mandatory database connection string (supports Railway MONGO_URL, MONGODB_URI, or local)
  MONGODB_URI: z
    .string()
    .default(process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securemed'),

  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(1),

  // Security secrets with default fallbacks
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long for production security')
    .default(process.env.JWT_SECRET || '5943a9e1e623b5c45665e8d3d485ead32f705dc7b67d565f1ccf8ede28f53f79'),
  
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  COOKIE_SECRET: z
    .string()
    .min(32, 'COOKIE_SECRET must be at least 32 characters long for cryptographic cookie signing')
    .default(process.env.COOKIE_SECRET || '2fecf733d2f302d98d84bf18bcf652867ca0eccd6e13c0b7ec296fe95d9380ed'),

  // Email / SMTP settings for password reset and verification
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('SecureMed Share <no-reply@securemed.io>'),

  // Master Key (KEK) for Envelope Encryption: exactly 32 bytes (256 bits)
  MASTER_ENCRYPTION_KEY: z
    .string()
    .default(process.env.MASTER_ENCRYPTION_KEY || '9f7e8567bac3ed9f68000ca53407d9af1062e0e58e50292b4baf5c902d0db2e4'),

  KEY_VERSION: z.string().default('v1'),
  SIGNING_ALGORITHM: z.string().default('RSA-PSS'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
});

import crypto from 'crypto';

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n=============================================================');
  console.error(' [CRITICAL CONFIGURATION ERROR] Environment validation failed');
  console.error('=============================================================');
  parsed.error.issues.forEach((issue) => {
    console.error(` • [${issue.path.join('.')}] : ${issue.message}`);
  });
  console.error('=============================================================\n');
  process.exit(1);
}

if (!parsed.data.JWT_REFRESH_SECRET) {
  parsed.data.JWT_REFRESH_SECRET = crypto
    .createHash('sha256')
    .update(parsed.data.JWT_SECRET + '_refresh_token_secret_salt_2026')
    .digest('hex');
}

if (parsed.data.NODE_ENV === 'production') {
  const { CLIENT_URL, SMTP_HOST, SMTP_USER, SMTP_PASS } = parsed.data;
  let publicOrigin;
  try { publicOrigin = new URL(CLIENT_URL); } catch {}
  if (!publicOrigin || (publicOrigin.protocol !== 'https:' && !CLIENT_URL.includes('localhost'))) {
    console.warn(`[CONFIG WARNING] Production CLIENT_URL ('${CLIENT_URL}') is not an HTTPS origin.`);
  }
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[EMAIL WARNING] SMTP credentials not fully configured. Email OTP delivery will be logged to server console.');
  }
}

export const env = parsed.data;
export default env;
