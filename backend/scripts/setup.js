import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const path = new URL('../.env', import.meta.url);
const secret = () => randomBytes(32).toString('hex');
const config = [
  'MONGODB_URI=mongodb://127.0.0.1:27017/securemed_demo',
  `JWT_SECRET=${secret()}`,
  `JWT_REFRESH_SECRET=${secret()}`,
  `COOKIE_SECRET=${secret()}`,
  `MASTER_ENCRYPTION_KEY=${secret()}`,
  '',
].join('\n');

try {
  writeFileSync(path, config, { flag: 'wx', mode: 0o600 });
  console.log('Created backend/.env with unique local keys.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Using existing backend/.env.');
}
