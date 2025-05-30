const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Authentication Middleware
 * Verifies JWT token and adds user to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('[auth.middleware] Authorization header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[auth.middleware] Decoded token:', decoded);
    } catch (err) {
      console.error('[auth.middleware] Token verification failed:', err);
      return res.status(401).json({
        success: false,
        message: 'Invalid token (decode failed)'
      });
    }

    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Admin Authorization Middleware
 * Checks if authenticated user has admin role
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

module.exports = authenticateToken; 