const ClearanceRequest = require('../models/clearanceRequest.model');
const Resident = require('../models/resident.model');

module.exports = {
  // Create a new clearance request
  async createRequest(req, res) {
    try {
      const { fullname, address, purpose } = req.body;
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
}; 