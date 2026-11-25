import mongoose from 'mongoose';

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['login', 'register_patient'],
      default: 'login',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: automatically deleted when expiresAt arrives
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('EmailOtp', emailOtpSchema);
