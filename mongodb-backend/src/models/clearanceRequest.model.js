const mongoose = require('mongoose');

const clearanceRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: false },
  fullname: { type: String, required: true },
  address: { type: String, required: true },
  purpose: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('ClearanceRequest', clearanceRequestSchema); 