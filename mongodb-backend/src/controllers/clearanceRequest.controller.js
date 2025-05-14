const ClearanceRequest = require('../models/clearanceRequest.model');
const Resident = require('../models/resident.model');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

module.exports = {
  // Create a new clearance request
  async createRequest(req, res) {
    try {
      const { fullname, address, purpose, message } = req.body;
      const userId = req.user._id;
      // Optionally, find residentId if needed
      const resident = await Resident.findOne({ user: userId });
      const residentId = resident ? resident._id : undefined;
      const request = await ClearanceRequest.create({
        userId,
        residentId,
        fullname,
        address,
        purpose,
        message,
      });
      res.status(201).json({ success: true, data: request });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // List all requests (admin) or own requests (user)
  async listRequests(req, res) {
    try {
      let requests;
      if (req.user.role === 'admin') {
        requests = await ClearanceRequest.find().sort({ createdAt: -1 });
      } else {
        requests = await ClearanceRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
      }
      res.json({ success: true, data: requests });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Approve a request (admin only)
  async approveRequest(req, res) {
    try {
      const request = await ClearanceRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'approved' },
        { new: true }
      );
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      res.json({ success: true, data: request });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Delete (reject) a request (admin only)
  async deleteRequest(req, res) {
    try {
      const request = await ClearanceRequest.findByIdAndDelete(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      res.json({ success: true, message: 'Request deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Deny a request (admin only)
  async denyRequest(req, res) {
    try {
      const request = await ClearanceRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'denied' },
        { new: true }
      );
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      res.json({ success: true, data: request });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Generate and save QR code for a clearance request (admin only)
  async generateQRCode(req, res) {
    try {
      const requestId = req.params.id;
      console.log('[generateQRCode] Called with requestId:', requestId);
      const request = await ClearanceRequest.findById(requestId);
      if (!request) {
        console.warn(`[generateQRCode] No clearance request found for ID: ${requestId}`);
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      // Use request._id as hash
      const hash = request._id.toString();
      const qrDir = path.join(__dirname, '../../uploads/qrcodes');
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
      const qrPath = path.join(qrDir, `qr-${hash}.png`);
      // Generate QR code image
      await QRCode.toFile(qrPath, hash, { width: 300 });
      // Save relative path in DB
      request.qrCodePath = `qrcodes/qr-${hash}.png`;
      request.qrCodeHash = hash;
      await request.save();
      console.log(`[generateQRCode] QR code generated and saved for requestId: ${requestId}`);
      res.json({ success: true, qrCodePath: request.qrCodePath, qrCodeHash: hash });
    } catch (err) {
      console.error('[generateQRCode] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Serve QR code image
  async getQRCode(req, res) {
    try {
      const requestId = req.params.id;
      const request = await ClearanceRequest.findById(requestId);
      if (!request || !request.qrCodePath) return res.status(404).json({ success: false, message: 'QR code not found' });
      const qrPath = path.join(__dirname, '../../uploads', request.qrCodePath);
      if (!fs.existsSync(qrPath)) return res.status(404).json({ success: false, message: 'QR code file not found' });
      res.sendFile(qrPath);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
}; 