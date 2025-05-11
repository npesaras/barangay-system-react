const request = require('supertest');
const app = require('../../app');
const { connectDB, dropDB, dropCollections } = require('../setupDB');
const Resident = require('../../models/resident.model');
const { User } = require('../../models/user.model');
const bcrypt = require('bcryptjs');

let mongod;

beforeAll(async () => {
  mongod = await connectDB();
  // Create a test admin user
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  const testUser = await User.create({
    username: 'testadmin',
    password: hashedPassword,
    role: 'admin'
  });

  // Get auth token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'testadmin',
      password: 'testpassword123'
    });
  authToken = loginResponse.body.token;
}, 30000);

afterAll(async () => {
  await dropDB(mongod);
}, 30000);

afterEach(async () => {
  await dropCollections();
});

describe('PUT /api/residents/:id', () => {
  let resident;

  beforeEach(async () => {
    await dropCollections();
    // Create a test resident
    resident = await Resident.create({
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Smith',
      suffix: '',
      gender: 'Male',
      birthDate: '1990-01-01',
      birthPlace: 'Test City',
      civilStatus: 'Single',
      occupation: 'Engineer',
      citizenship: 'Filipino',
      religion: 'Catholic',
      contactNumber: '1234567890',
      emailAddress: 'john@example.com',
      address: {
        houseNumber: '123',
        streetName: 'Test Street',
        purok: 'Test Purok',
        barangay: 'Test Barangay',
        city: 'Test City',
        province: 'Test Province',
        region: 'Test Region',
        postalCode: '1234'
      },
      votersStatus: 'Registered'
    });
  });

  it('should update a resident successfully', async () => {
    const updatedData = {
      firstName: 'Jane',
      lastName: 'Doe',
      middleName: 'Smith',
      suffix: '',
      gender: 'Female',
      birthDate: '1990-01-01',
      birthPlace: 'Test City',
      civilStatus: 'Single',
      occupation: 'Doctor',
      citizenship: 'Filipino',
      religion: 'Catholic',
      contactNumber: '1234567890',
      emailAddress: 'jane@example.com',
      address: {
        houseNumber: '123',
        streetName: 'Test Street',
        purok: 'Test Purok',
        barangay: 'Test Barangay',
        city: 'Test City',
        province: 'Test Province',
        region: 'Test Region',
        postalCode: '1234'
      },
      votersStatus: 'Not-Registered'
    };

    const response = await request(app)
      .put(`/api/residents/${resident._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.data.firstName).toBe('Jane');
    expect(response.body.data.occupation).toBe('Doctor');
    expect(response.body.data.votersStatus).toBe('Not-Registered');
  });

  it('should return 400 for invalid data', async () => {
    const invalidData = {
      firstName: '', // Empty first name should be invalid
      lastName: 'Doe'
    };

    const response = await request(app)
      .put(`/api/residents/${resident._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData);

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent resident', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId that doesn't exist
    const updatedData = {
      firstName: 'Jane',
      lastName: 'Doe'
    };

    const response = await request(app)
      .put(`/api/residents/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedData);

    expect(response.status).toBe(404);
  });

  it('should require authentication', async () => {
    const updatedData = {
      firstName: 'Jane'
    };

    const response = await request(app)
      .put(`/api/residents/${resident._id}`)
      .send(updatedData);

    expect(response.status).toBe(401);
  });

  it('should validate required fields if provided', async () => {
    const updatedData = {
      firstName: '',  // Empty string should be invalid
      lastName: 'Doe'
    };

    const response = await request(app)
      .put(`/api/residents/${resident._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should handle partial updates correctly', async () => {
    const updatedData = {
      firstName: 'Jane'
    };

    const response = await request(app)
      .put(`/api/residents/${resident._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.firstName).toBe(updatedData.firstName);
    expect(response.body.data.lastName).toBe(resident.lastName);  // Should remain unchanged
  });
}); 