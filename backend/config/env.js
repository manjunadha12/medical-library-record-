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
  
  // Mandatory database connection string - no hardcoded fallbacks
  MONGODB_URI: z
    .string({ required_error: 'MONGODB_URI is required' })
    .min(1, 'MONGODB_URI cannot be empty'),

  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),

  // Mandatory security secrets - minimum 32 characters, no hardcoded fallbacks
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters long for production security'),
  
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  COOKIE_SECRET: z
    .string({ required_error: 'COOKIE_SECRET is required' })
    .min(32, 'COOKIE_SECRET must be at least 32 characters long for cryptographic cookie signing'),

  // Email / SMTP settings for password reset and verification
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('SecureMed Share <no-reply@securemed.io>'),

  // Master Key (KEK) for Envelope Encryption: exactly 32 bytes (256 bits)
  MASTER_ENCRYPTION_KEY: z
    .string({ required_error: 'MASTER_ENCRYPTION_KEY is required' })
    .refine((val) => /^[a-f0-9]{64}$/i.test(val) || (val.length === 32 && Buffer.byteLength(val) === 32), {
      message: 'MASTER_ENCRYPTION_KEY must be a 32-byte key (32 ASCII characters or 64 Hex characters)',
    }),

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
  if (publicOrigin?.protocol !== 'https:' || publicOrigin.origin !== CLIENT_URL) {
    throw new Error('Production CLIENT_URL must be a single HTTPS origin with no trailing slash.');
  }
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Production requires SMTP_HOST, SMTP_USER and SMTP_PASS.');
  }
}

export const env = parsed.data;
export default env;
