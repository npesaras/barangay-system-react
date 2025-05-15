const mongoose = require('mongoose');

const blotterRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  complainant: { type: String, required: true },
  respondent: { type: String, required: true },
  complaint: { type: String, required: true },
  incidentType: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  dateTimeReported: { type: Date, default: Date.now },
  dateTimeIncident: { type: Date, required: true },
  dateRecorded: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('BlotterRequest', blotterRequestSchema); 