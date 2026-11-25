import { z } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Input validation failed',
        errors: formattedErrors,
      });
    }
    next(err);
  }
};

// Password complexity rule
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerPatientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name must contain only letters and spaces (no numbers or special symbols)'),
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, 'Phone number must contain between 10 and 15 digits (numbers only)')
    .or(z.literal(''))
    .optional()
    .default(''),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().default('prefer_not_to_say'),
  address: z.string().optional().default(''),
});

export const sendOtpSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  purpose: z.enum(['login', 'register_patient']).optional().default('login'),
});

export const verifyLoginOtpSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric digits'),
  forceLogin: z.boolean().optional().default(false),
});

export const registerPatientWithOtpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name must contain only letters and spaces (no numbers allowed)'),
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, 'Phone number must contain between 10 and 15 digits (numbers only)'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric digits'),
  password: passwordSchema.optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().default('prefer_not_to_say'),
  address: z.string().optional().default(''),
});

export const registerDoctorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: passwordSchema,
  phone: z.string().optional().default(''),
  specialization: z.string().min(2, 'Medical specialization is required'),
  licenseNumber: z.string().min(3, 'Medical license number is required'),
  hospitalAffiliation: z.string().min(2, 'Hospital affiliation is required'),
  experienceYears: z.coerce.number().min(0, 'Experience years must be positive').optional().default(0),
  qualification: z.string().min(2, 'Medical qualifications are required'),
  bio: z.string().optional().default(''),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  forceLogin: z.boolean().optional().default(false),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
  forceLogin: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
