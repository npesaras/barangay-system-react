const mongoose = require('mongoose');

const barangayInfoSchema = new mongoose.Schema({
  barangay: { type: String, required: true },
  municipality: { type: String, required: true },
  province: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  emailAddress: { type: String, required: true },
  logo: { type: String, default: '' }, // Path to logo image
}, { timestamps: true });

module.exports = mongoose.model('BarangayInfo', barangayInfoSchema); 