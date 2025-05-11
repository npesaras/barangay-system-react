const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import middleware
const corsOptions = require('./config/cors.config');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter.middleware');
const formatResponse = require('./middleware/response.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const residentRoutes = require('./routes/resident.routes');
const clearanceRequestRoutes = require('./routes/clearanceRequest.routes');
const blotterRequestRoutes = require('./routes/blotterRequest.routes');

// Create Express app
const app = express();

// Basic middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers with image serving enabled
app.use(cors(corsOptions)); // CORS configuration
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger
app.use(formatResponse); // Response formatting

// Serve static files
app.use('/uploads/profiles', express.static(path.join(__dirname, '../uploads/profiles')));

// Apply rate limiting only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', apiLimiter);
  app.use('/api/auth', authLimiter);
} else {
  console.log('Rate limiting disabled in development mode');
}

// Mount routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/clearance-requests', clearanceRequestRoutes);
app.use('/api/blotter-requests', blotterRequestRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app; 