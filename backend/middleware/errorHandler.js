export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum permitted limit (15MB).',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // Handle duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `An entry with this ${field} already exists in the system.`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
};
