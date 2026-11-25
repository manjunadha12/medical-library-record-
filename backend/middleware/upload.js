import multer from 'multer';

// Use memoryStorage so plaintext file bytes exist only in transient memory during encryption
// and are never written to disk in unencrypted form.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 Megabytes

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file format (${file.mimetype}). Only PDF documents, JPEG images, and PNG images are permitted.`
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});
