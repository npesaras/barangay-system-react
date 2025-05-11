const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 16,
    max: 100
  },
  address: {
    type: String,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d+$/, 'Student ID must contain only numbers']
  },
  course: {
    type: String,
    trim: true
  },
  yearLevel: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  major: {
    type: String,
    trim: true
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
studentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Create indexes for frequently queried fields
studentSchema.index({ studentId: 1 });
studentSchema.index({ course: 1, yearLevel: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 