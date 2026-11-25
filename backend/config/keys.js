import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import env from './env.js';

const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);

// Master Key (KEK) for Envelope Encryption: Must be exactly 32 bytes (256 bits)
const envKey = env.MASTER_ENCRYPTION_KEY;
export const MASTER_KEY = envKey.length === 64
  ? Buffer.from(envKey, 'hex')
  : Buffer.from(envKey, 'utf-8');

export const KEY_VERSION = env.KEY_VERSION;

// RSA-PSS Key Pair for System Digital Signatures (Module 4)
// Generates or loads RSA-PSS 2048-bit keypair
const KEYS_DIR = path.join(__dirname, '..', 'keys_store');
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

const PRIV_KEY_PATH = path.join(KEYS_DIR, 'system_rsa_pss_private.pem');
const PUB_KEY_PATH = path.join(KEYS_DIR, 'system_rsa_pss_public.pem');

let systemPrivateKey;
let systemPublicKey;

if (fs.existsSync(PRIV_KEY_PATH) && fs.existsSync(PUB_KEY_PATH)) {
  systemPrivateKey = fs.readFileSync(PRIV_KEY_PATH, 'utf8');
  systemPublicKey = fs.readFileSync(PUB_KEY_PATH, 'utf8');
} else {
  // Generate real RSA key pair for PSS signing
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  systemPrivateKey = privateKey;
  systemPublicKey = publicKey;
  fs.writeFileSync(PRIV_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUB_KEY_PATH, publicKey, { mode: 0o644 });
}

export const SYSTEM_SIGNING_KEYS = {
  keyId: 'system-rsa-pss-v1',
  algorithm: 'RSA-PSS-SHA256',
  publicKeyPem: systemPublicKey,
  privateKeyPem: systemPrivateKey
};
