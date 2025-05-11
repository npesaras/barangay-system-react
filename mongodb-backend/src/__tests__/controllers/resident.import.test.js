const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const app = require('../../app');
const Resident = require('../../models/resident.model');
const User = require('../../models/user.model');
const bcrypt = require('bcryptjs');

describe('Resident CSV Import Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Create test admin user with hashed password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    // Get auth token through login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    authToken = loginResponse.body.token;
  });

  beforeEach(async () => {
    // Clear residents collection before each test
    await Resident.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Resident.deleteMany({});
  });

  // Helper function to create a test CSV file
  const createTestCSV = async (content) => {
    const filePath = path.join(__dirname, 'test.csv');
    await fs.writeFile(filePath, content);
    return filePath;
  };

  // Helper function to delete test CSV file
  const deleteTestCSV = async () => {
    const filePath = path.join(__dirname, 'test.csv');
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  };

  describe('POST /api/residents/import-csv', () => {
    afterEach(async () => {
      await deleteTestCSV();
    });

    test('should successfully import valid CSV data', async () => {
      const csvContent = `First Name,Middle Name,Last Name,Birthplace,Birthdate,Age,Civil Status,Gender,Purok,Voters Status
John,Doe,Smith,City,2000-01-01,23,Single,Male,Purok 1,Registered
Jane,Marie,Doe,Town,1995-05-15,28,Married,Female,Purok 2,Not-Registered`;

      const filePath = await createTestCSV(csvContent);

      const response = await request(app)
        .post('/api/residents/import-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', filePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(2);
      expect(response.body.errorCount).toBe(0);

      // Verify residents were created in database
      const residents = await Resident.find();
      expect(residents.length).toBe(2);
    });

    test('should handle invalid gender values', async () => {
      const csvContent = `First Name,Middle Name,Last Name,Birthplace,Birthdate,Age,Civil Status,Gender,Purok,Voters Status
John,Doe,Smith,City,2000-01-01,23,Single,InvalidGender,Purok 1,Registered`;

      const filePath = await createTestCSV(csvContent);

      const response = await request(app)
        .post('/api/residents/import-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', filePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(0);
      expect(response.body.errorCount).toBe(1);
      expect(response.body.errors[0].error).toContain('Invalid gender value');
    });

    test('should handle invalid civil status values', async () => {
      const csvContent = `First Name,Middle Name,Last Name,Birthplace,Birthdate,Age,Civil Status,Gender,Purok,Voters Status
John,Doe,Smith,City,2000-01-01,23,Invalid,Male,Purok 1,Registered`;

      const filePath = await createTestCSV(csvContent);

      const response = await request(app)
        .post('/api/residents/import-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', filePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(0);
      expect(response.body.errorCount).toBe(1);
      expect(response.body.errors[0].error).toContain('Invalid civil status');
    });

    test('should handle invalid voters status values', async () => {
      const csvContent = `First Name,Middle Name,Last Name,Birthplace,Birthdate,Age,Civil Status,Gender,Purok,Voters Status
John,Doe,Smith,City,2000-01-01,23,Single,Male,Purok 1,Invalid`;

      const filePath = await createTestCSV(csvContent);

      const response = await request(app)
        .post('/api/residents/import-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', filePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(0);
      expect(response.body.errorCount).toBe(1);
      expect(response.body.errors[0].error).toContain('Invalid voters status');
    });

    test('should handle invalid date format', async () => {
      const csvContent = `First Name,Middle Name,Last Name,Birthplace,Birthdate,Age,Civil Status,Gender,Purok,Voters Status
John,Doe,Smith,City,01/01/2000,23,Single,Male,Purok 1,Registered`;

      const filePath = await createTestCSV(csvContent);

      const response = await request(app)
        .post('/api/residents/import-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', filePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(1); // Should still succeed as date is parsed
      expect(response.body.errorCount).toBe(0);
    });

    test('should handle missing required fields', async () => {
      const csvContent = `First Name,Middle Name,Last Name,Birthplace,Birthdate,Age,Civil Status,Gender,Purok,Voters Status
,Doe,Smith,City,2000-01-01,23,Single,Male,Purok 1,Registered`;

      const filePath = await createTestCSV(csvContent);

      const response = await request(app)
        .post('/api/residents/import-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', filePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(0);
      expect(response.body.errorCount).toBe(1);
      expect(response.body.errors[0].error).toContain('First name and last name are required');
    });

    test('should handle non-CSV file upload', async () => {
      const filePath = path.join(__dirname, 'test.txt');
      await fs.writeFile(filePath, 'Not a CSV file');

      const response = await request(app)
        .post('/api/residents/import-csv')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', filePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      await fs.unlink(filePath);
    });

    test('should handle authentication', async () => {
      const csvContent = `First Name,Middle Name,Last Name,Birthplace,Birthdate,Age,Civil Status,Gender,Purok,Voters Status
John,Doe,Smith,City,2000-01-01,23,Single,Male,Purok 1,Registered`;

      const filePath = await createTestCSV(csvContent);

      const response = await request(app)
        .post('/api/residents/import-csv')
        .attach('file', filePath);

      expect(response.status).toBe(401);
    });
  });
}); 