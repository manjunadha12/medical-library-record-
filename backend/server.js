import fs from 'node:fs';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';

import env from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import consentRoutes from './routes/consentRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';

const __filename = fileURLToPath(import.meta.url || 'file://' + __filename);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.PORT;
const CLIENT_URL = env.CLIENT_URL;
const allowedOrigins = CLIENT_URL.split(',').map((url) => url.trim());
const production = env.NODE_ENV === 'production';
const frontend = path.resolve(__dirname, '../frontend/dist');
const index = path.join(frontend, 'index.html');
const hasFrontend = fs.existsSync(index);
app.set('trust proxy', env.TRUST_PROXY_HOPS);

// Connect to Database
const databaseReady = connectDB().catch((err) => {
  console.error('[DATABASE INIT ERROR]', err);
  process.exit(1);
});

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://accounts.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'https://*.googleusercontent.com'],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        connectSrc: ["'self'", 'https://accounts.google.com'],
        upgradeInsecureRequests: production ? [] : null,
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// Prevent NoSQL query injection
app.use(mongoSanitize());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      // In development or if explicitly allowed, permit origin
      if (
        allowedOrigins.includes(origin) ||
        (env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Origin '${origin}' is not permitted.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthy = mongoose.connection.readyState === 1;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'database unavailable',
    system: 'SecureMed Share Privacy-Preserving Health Platform',
    timestamp: new Date(),
    encryption: 'AES-256-GCM Envelope Encryption Active',
    signatures: 'RSA-PSS Digital Signatures Active',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/verify', verifyRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

if (hasFrontend) {
  app.use('/assets', express.static(path.join(frontend, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use('/assets', (_req, res) => res.sendStatus(404));
  app.use(express.static(frontend, { index: false }));
  app.get('*', (_req, res) => {
    res.set('Cache-Control', 'no-cache').sendFile(index);
  });
} else {
  app.get('/', (_req, res) => res.json({ status: 'online', healthCheck: '/api/health' }));
}

// Error Handling Middleware
app.use(errorHandler);

// Start HTTP server only when run directly (not when imported into test harnesses)
let server;
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  if (production && !hasFrontend) {
    throw new Error('Build the frontend before starting the production server.');
  }
  await databaseReady;
  server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  SecureMed Share Backend API Server running on port ${PORT}`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Client Allowed: ${CLIENT_URL}`);
    console.log(`=======================================================`);
  });
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, () => {
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    });
  }
}

export default app;
