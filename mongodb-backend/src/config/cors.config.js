/**
 * CORS Configuration
 * Configures Cross-Origin Resource Sharing for the API
 */
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

module.exports = corsOptions; 