import { onRequest } from 'firebase-functions/v2/https';
import app from './server.js';
import { connectDB } from './config/db.js';

/**
 * Firebase Cloud Function (2nd Gen) API handler
 * Proxied via Firebase Hosting rewrites at /api/**
 */
export const api = onRequest(
  {
    cors: true,
    memory: '512MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (req, res) => {
    try {
      await connectDB();
    } catch (err) {
      console.error('[DATABASE INIT ERROR IN CLOUD FUNCTION]', err);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please verify your MongoDB configuration.',
      });
    }
    return app(req, res);
  }
);
