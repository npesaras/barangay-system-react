/**
 * Response Formatting Middleware
 * Standardizes API response format across the application
 */

const formatResponse = (req, res, next) => {
  // Store original res.json
  const originalJson = res.json;

  // Override res.json
  res.json = function(data) {
    // If data is already in our format, send it as is
    if (data && (data.success !== undefined || data.error !== undefined)) {
      return originalJson.call(this, data);
    }

    // Format successful response
    const formattedData = {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };

    // If there's a message in the data, move it to the root level
    if (data && data.message) {
      formattedData.message = data.message;
      delete data.message;
    }

    return originalJson.call(this, formattedData);
  };

  // Add error response helper
  res.error = function(message, statusCode = 500, errors = null) {
    const errorResponse = {
      success: false,
      message: message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      errorResponse.errors = errors;
    }

    return res.status(statusCode).json(errorResponse);
  };

  next();
};

module.exports = formatResponse; 