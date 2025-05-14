const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create multer upload instance
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Error uploading file'
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// New: Barangay logo upload middleware
const barangayLogoDir = path.join(__dirname, '../../uploads/barangay-logos');
if (!fs.existsSync(barangayLogoDir)) {
  fs.mkdirSync(barangayLogoDir, { recursive: true });
}
const barangayLogoStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, barangayLogoDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadBarangayLogo = multer({
  storage: barangayLogoStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// New: Account picture upload middleware
const accountPictureDir = path.join(__dirname, '../../uploads/account-pictures');
if (!fs.existsSync(accountPictureDir)) {
  fs.mkdirSync(accountPictureDir, { recursive: true });
}
const accountPictureStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, accountPictureDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'account-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadAccountPicture = multer({
  storage: accountPictureStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = {
  upload: uploadMiddleware,
  handleUploadError,
  uploadBarangayLogo,
  uploadAccountPicture
}; 