const express = require('express');
const router = express.Router();
const multer = require('multer');
const { upload, handleUploadError } = require('../middleware/upload.middleware');
const { validateResident } = require('../middleware/validation.middleware');
const auth = require('../middleware/auth.middleware');
const ResidentController = require('../controllers/resident.controller');

// Configure multer for CSV uploads
const csvUpload = multer({
  dest: 'uploads/csv/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  }
});

// Get all residents
router.get('/', auth, ResidentController.getAllResidents);

// Get resident statistics
router.get('/stats', auth, ResidentController.getResidentStats);

// Import residents from CSV
router.post('/import-csv', auth, csvUpload.single('file'), ResidentController.importCSV);

// Export residents to CSV
router.get('/export-csv', auth, ResidentController.exportCSV);

// Get resident's profile image
router.get('/:id/profile-image', ResidentController.getProfileImage);

// Get resident by ID
router.get('/:id', auth, ResidentController.getResidentById);

// Create new resident
router.post('/',
  auth,
  upload.single('profileImage'),
  handleUploadError,
  validateResident,
  ResidentController.createResident
);

// Update resident
router.put('/:id',
  auth,
  upload.single('profileImage'),
  handleUploadError,
  validateResident,
  ResidentController.updateResident
);

// Delete resident
router.delete('/:id', auth, ResidentController.deleteResident);

module.exports = router; 