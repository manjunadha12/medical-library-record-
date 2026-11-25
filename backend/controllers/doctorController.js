import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';

export const getDoctorsDirectory = async (req, res, next) => {
  try {
    const { specialization, search } = req.query;
    const query = { verificationStatus: 'verified' };

    if (specialization && specialization !== 'All') {
      query.specialization = specialization;
    }

    const profiles = await DoctorProfile.find(query)
      .populate('userId', 'name email phone status')
      .sort('specialization');

    let filtered = profiles.filter((p) => p.userId && p.userId.status === 'active');

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.userId?.name?.toLowerCase().includes(s) ||
          p.hospitalAffiliation?.toLowerCase().includes(s) ||
          p.specialization?.toLowerCase().includes(s)
      );
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      doctors: filtered.map((p) => ({
        id: p.userId._id,
        profileId: p._id,
        name: p.userId.name,
        email: p.userId.email,
        phone: p.userId.phone,
        specialization: p.specialization,
        licenseNumber: p.licenseNumber,
        hospitalAffiliation: p.hospitalAffiliation,
        experienceYears: p.experienceYears,
        qualification: p.qualification,
        bio: p.bio,
        verificationStatus: p.verificationStatus,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorProfile = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.params.id })
      .populate('userId', 'name email phone status');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    res.status(200).json({
      success: true,
      doctor: profile,
    });
  } catch (err) {
    next(err);
  }
};
