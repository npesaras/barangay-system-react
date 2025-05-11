const validateEnv = require('../../config/env.validator');

describe('Environment Variable Validator', () => {
  // Store original env variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env variables before each test
    process.env = {
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET: 'test-jwt-secret-key-minimum-32-characters-long',
      ADMIN_REGISTRATION_CODE: 'test-admin-code',
      NODE_ENV: 'test',
      MAX_FILE_SIZE: '5242880',
      RATE_LIMIT_WINDOW: '15',
      RATE_LIMIT_MAX_REQUESTS: '100'
    };
  });

  afterAll(() => {
    // Restore original env variables
    process.env = originalEnv;
  });

  it('should validate correct environment variables', () => {
    expect(validateEnv()).toBe(true);
  });

  it('should throw error for missing required variables', () => {
    delete process.env.PORT;
    expect(() => validateEnv()).toThrow('Missing required environment variables: PORT');
  });

  it('should throw error for invalid PORT', () => {
    process.env.PORT = 'invalid';
    expect(() => validateEnv()).toThrow('PORT must be a valid number between 1 and 65535');

    process.env.PORT = '0';
    expect(() => validateEnv()).toThrow('PORT must be a valid number between 1 and 65535');

    process.env.PORT = '65536';
    expect(() => validateEnv()).toThrow('PORT must be a valid number between 1 and 65535');
  });

  it('should throw error for invalid JWT_SECRET length', () => {
    process.env.JWT_SECRET = 'short';
    expect(() => validateEnv()).toThrow('JWT_SECRET must be at least 32 characters long');
  });

  it('should throw error for invalid NODE_ENV', () => {
    process.env.NODE_ENV = 'invalid';
    expect(() => validateEnv()).toThrow('NODE_ENV must be one of: development, production, test');
  });

  it('should throw error for invalid MONGODB_URI format', () => {
    process.env.MONGODB_URI = 'invalid-uri';
    expect(() => validateEnv()).toThrow('MONGODB_URI must be a valid MongoDB connection string');
  });

  it('should throw error for invalid MAX_FILE_SIZE', () => {
    process.env.MAX_FILE_SIZE = 'invalid';
    expect(() => validateEnv()).toThrow('MAX_FILE_SIZE must be a valid number');
  });

  it('should throw error for invalid RATE_LIMIT_WINDOW', () => {
    process.env.RATE_LIMIT_WINDOW = 'invalid';
    expect(() => validateEnv()).toThrow('RATE_LIMIT_WINDOW must be a valid number');
  });

  it('should throw error for invalid RATE_LIMIT_MAX_REQUESTS', () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = 'invalid';
    expect(() => validateEnv()).toThrow('RATE_LIMIT_MAX_REQUESTS must be a valid number');
  });
}); 