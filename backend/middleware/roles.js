export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const roles = allowedRoles.flat();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

export const requireVerifiedDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to medical doctors only.',
    });
  }

  if (!req.doctorProfile || req.doctorProfile.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Doctor account is pending verification by the system administrator. Record access is disabled until verified.',
      verificationStatus: req.doctorProfile?.verificationStatus || 'unregistered'
    });
  }

  next();
};
