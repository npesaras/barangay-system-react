const express = require('express');
const router = express.Router();
const { validateRegisterAdmin, validateRegisterUser, validateLogin } = require('../middleware/validation.middleware');
const AuthController = require('../controllers/auth.controller');
const { upload, handleUploadError, uploadAccountPicture } = require('../middleware/upload.middleware');
const authenticateToken = require('../middleware/auth.middleware');

// Admin registration route (protected by registration code)
router.post('/register-admin', validateRegisterAdmin, AuthController.registerAdmin);

// Regular user registration route
router.post('/register-user', validateRegisterUser, AuthController.registerUser);

// Login route
router.post('/login', validateLogin, AuthController.login);

// Verify token route
router.get('/verify', AuthController.verify);

// Logout route
router.post('/logout', AuthController.logout);

// Account info routes (all require authentication)
router.get('/me', authenticateToken, AuthController.getMe);
router.put('/update', authenticateToken, uploadAccountPicture.single('profileImage'), handleUploadError, AuthController.updateMe);
router.put('/password', authenticateToken, AuthController.changePassword);

module.exports = router; 