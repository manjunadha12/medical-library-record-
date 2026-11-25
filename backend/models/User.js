import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    patientId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
    },
    // Active session details for Single Device Login enforcement
    activeSession: {
      sessionId: {
        type: String,
        default: null,
      },
      device: {
        type: String,
        default: '',
      },
      browser: {
        type: String,
        default: '',
      },
      os: {
        type: String,
        default: '',
      },
      ipAddress: {
        type: String,
        default: '',
      },
      userAgent: {
        type: String,
        default: '',
      },
      lastActivity: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Account Lockout check
userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incLoginAttempts = async function () {
  // If previous lock has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = null;
    return await this.save();
  }

  this.failedLoginAttempts += 1;
  // Lock for 15 minutes after 5 consecutive failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  return await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  if (this.failedLoginAttempts > 0 || this.lockUntil) {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    return await this.save();
  }
};

// Hash password before saving (cost 12)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
