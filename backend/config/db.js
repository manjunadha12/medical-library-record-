import mongoose from 'mongoose';
import env from './env.js';

/**
 * Connect to persistent MongoDB instance.
 * Exits immediately with code 1 if connection fails.
 */
export const connectDB = async () => {
  // If connection is already established, reuse it (crucial for Cloud Functions / serverless)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = env.MONGODB_URI;

  try {
    console.log('[DATABASE] Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[DATABASE] Connected successfully to persistent MongoDB cluster.');
  } catch (err) {
    console.error('\n=============================================================');
    console.error(` [DATABASE CRITICAL] MongoDB Connection Failed: ${err.message}`);
    console.error(' Please ensure MongoDB is running or update MONGODB_URI in backend/.env');
    console.error('=============================================================\n');
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
};
