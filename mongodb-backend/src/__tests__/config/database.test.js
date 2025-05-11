const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Database Configuration', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Disconnect from any existing connections
    await mongoose.disconnect();
  });

  it('should connect to MongoDB successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    // Set the MongoDB URI to the in-memory server
    process.env.MONGODB_URI = mongoServer.getUri();
    
    // Import the database module after setting the URI
    const connectDB = require('../../config/database');
    await connectDB();
    
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MongoDB Connected:'));
  });

  it('should handle connection errors properly', async () => {
    // Set invalid URI
    process.env.MONGODB_URI = 'mongodb://invalid:27017/test';

    const consoleErrorSpy = jest.spyOn(console, 'error');
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Import the database module after setting the URI
    const connectDB = require('../../config/database');

    try {
      await connectDB();
    } catch (error) {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error connecting to MongoDB:')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    }
  });

  it('should handle disconnection events', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    // Set the MongoDB URI to the in-memory server
    process.env.MONGODB_URI = mongoServer.getUri();
    
    // Import the database module after setting the URI
    const connectDB = require('../../config/database');
    await connectDB();

    // Trigger disconnection event
    mongoose.connection.emit('disconnected');
    
    expect(consoleSpy).toHaveBeenCalledWith('Mongoose disconnected');
  });

  it('should handle connection error events', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');
    
    // Set the MongoDB URI to the in-memory server
    process.env.MONGODB_URI = mongoServer.getUri();
    
    // Import the database module after setting the URI
    const connectDB = require('../../config/database');
    await connectDB();

    const testError = new Error('Test connection error');
    mongoose.connection.emit('error', testError);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Mongoose connection error:',
      testError
    );
  });
}); 