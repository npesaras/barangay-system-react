const express = require('express');
const router = express.Router();
const barangayInfoController = require('../controllers/barangayInfo.controller');
const { upload, handleUploadError } = require('../middleware/upload.middleware');

// Auth middleware (optional, add if available)
// const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', barangayInfoController.getInfo);
router.put('/', /*authenticateToken, isAdmin,*/ upload.single('logo'), handleUploadError, barangayInfoController.updateInfo);
router.get('/logo', barangayInfoController.getLogo);

module.exports = router; 