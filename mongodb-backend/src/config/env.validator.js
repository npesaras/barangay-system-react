const validateEnv = () => {
  const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'ADMIN_REGISTRATION_CODE',
    'NODE_ENV'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  // Validate PORT
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate NODE_ENV
  const validEnvironments = ['development', 'production', 'test'];
  if (!validEnvironments.includes(process.env.NODE_ENV)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  // Validate MONGODB_URI format
  const mongoUrlPattern = /^mongodb(\+srv)?:\/\/.+/;
  if (!mongoUrlPattern.test(process.env.MONGODB_URI)) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }

  // Validate numeric values
  if (process.env.MAX_FILE_SIZE && isNaN(parseInt(process.env.MAX_FILE_SIZE))) {
    throw new Error('MAX_FILE_SIZE must be a valid number');
  }

  if (process.env.RATE_LIMIT_WINDOW && isNaN(parseInt(process.env.RATE_LIMIT_WINDOW))) {
    throw new Error('RATE_LIMIT_WINDOW must be a valid number');
  }

  if (process.env.RATE_LIMIT_MAX_REQUESTS && isNaN(parseInt(process.env.RATE_LIMIT_MAX_REQUESTS))) {
    throw new Error('RATE_LIMIT_MAX_REQUESTS must be a valid number');
  }

  console.log('Environment variables validated successfully');
  return true;
};

module.exports = validateEnv; 