const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  alias: {
    type: String,
    trim: true,
    default: ''
  },
  birthplace: {
    type: String,
    required: true
  },
  birthdate: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  civilStatus: {
    type: String,
    required: true,
    enum: ['Single', 'Married', 'Widowed', 'Divorced']
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  purok: {
    type: String,
    required: true
  },
  votersStatus: {
    type: String,
    required: true,
    enum: ['Registered', 'Not-Registered']
  },
  identifiedAs: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  contactNumber: {
    type: String,
    trim: true,
    default: ''
  },
  occupation: {
    type: String,
    default: ''
  },
  citizenship: {
    type: String,
    default: 'Filipino'
  },
  householdNo: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    required: true
  },
  precinctNo: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
residentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Resident', residentSchema); 