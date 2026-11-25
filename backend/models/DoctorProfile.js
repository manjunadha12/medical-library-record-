import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Medical license / registration number is required'],
      unique: true,
      trim: true,
    },
    hospitalAffiliation: {
      type: String,
      required: [true, 'Hospital or clinic affiliation is required'],
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    qualification: {
      type: String,
      default: 'MBBS, MD',
    },
    bio: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('DoctorProfile', doctorProfileSchema);
