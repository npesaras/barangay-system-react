const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * Protects the API from abuse by limiting request rates
 */

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
  max: process.env.NODE_ENV === 'development' ? 100 : 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoints rate limiter
const authLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 60 * 60 * 1000, // 1 minute in dev, 1 hour in prod
  max: process.env.NODE_ENV === 'development' ? 20 : 10, // Higher limit in development
  message: 'Too many login attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false, // Count failed requests against the rate limit
  skipSuccessfulRequests: true // Don't count successful logins against the rate limit
});

module.exports = {
  apiLimiter,
  authLimiter
}; 