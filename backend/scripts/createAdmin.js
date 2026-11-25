import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

async function createAdmin() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';
  const name = process.argv[4] || process.env.ADMIN_NAME || 'System Administrator';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || Buffer.byteLength(password) > 72) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12 characters minimum, 72 bytes maximum).');
    process.exit(1);
  }

  await connectDB();

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.role = 'admin';
      existingUser.status = 'active';
      existingUser.name = name;
      existingUser.password = password; // Will be hashed by pre-save hook
      await existingUser.save();

      console.log(`[ADMIN SETUP] Existing user "${email}" updated to Administrator with new password.`);
    } else {
      const user = await User.create({
        name,
        email,
        password,
        role: 'admin',
        status: 'active',
      });

      console.log(`[ADMIN SETUP] New Administrator account created:`);
      console.log(`  Name:  ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role:  ${user.role}`);
    }

    await AuditLog.create({
      action: 'ADMIN_ACCOUNT_CREATED',
      actorName: 'CLI Setup Script',
      actorEmail: email,
      actorRole: 'admin',
      outcome: 'success',
      details: `Administrator account initialized via CLI for ${email}`,
      securitySeverity: 'high',
    });

    console.log('[ADMIN SETUP] Setup completed successfully.');
  } catch (err) {
    console.error('[ADMIN SETUP ERROR]', err.message);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

createAdmin();
