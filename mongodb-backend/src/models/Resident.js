const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  alias: {
    type: String,
    trim: true
  },
  birthplace: {
    type: String,
    trim: true
  },
  birthdate: {
    type: Date
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  civilStatus: {
    type: String,
    enum: ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'],
    default: 'Single'
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  purok: {
    type: String,
    trim: true
  },
  votersStatus: {
    type: String,
    enum: ['Registered', 'Not-Registered'],
    default: 'Not-Registered'
  },
  identifiedAs: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  contactNumber: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true
  },
  citizenship: {
    type: String,
    trim: true,
    default: 'Filipino'
  },
  address: {
    type: String,
    trim: true
  },
  householdNo: {
    type: String,
    trim: true
  },
  precinctNo: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String // Store the image path
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

// Virtual for full name
residentSchema.virtual('fullName').get(function() {
  const middle = this.middleName ? ` ${this.middleName} ` : ' ';
  return `${this.firstName}${middle}${this.lastName}`;
});

// Create indexes for frequently queried fields
residentSchema.index({ firstName: 1, lastName: 1 });
residentSchema.index({ votersStatus: 1 });
residentSchema.index({ purok: 1 });

const Resident = mongoose.model('Resident', residentSchema);

module.exports = Resident; 