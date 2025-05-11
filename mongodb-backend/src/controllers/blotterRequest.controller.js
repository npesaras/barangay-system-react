const BlotterRequest = require('../models/blotterRequest.model');

module.exports = {
  // Create a new blotter request
  async createRequest(req, res) {
    try {
      const { complainant, respondent, complaint, incidentType, dateTimeIncident } = req.body;
      const userId = req.user._id;
      const request = await BlotterRequest.create({
        userId,
        complainant,
        respondent,
        complaint,
        incidentType,
        dateTimeIncident,
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
        requests = await BlotterRequest.find().sort({ createdAt: -1 });
      } else {
        requests = await BlotterRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
      }
      res.json({ success: true, data: requests });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Approve a request (admin only)
  async approveRequest(req, res) {
    try {
      const request = await BlotterRequest.findByIdAndUpdate(
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

  // Deny a request (admin only)
  async denyRequest(req, res) {
    try {
      const request = await BlotterRequest.findByIdAndUpdate(
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

  // Optional: Delete a request (admin only)
  async deleteRequest(req, res) {
    try {
      const request = await BlotterRequest.findByIdAndDelete(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
      res.json({ success: true, message: 'Request deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
}; 