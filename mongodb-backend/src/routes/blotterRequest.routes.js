const express = require('express');
const router = express.Router();
const controller = require('../controllers/blotterRequest.controller');
const auth = require('../middleware/auth.middleware');

// All routes require authentication
router.use(auth);

// Create a new blotter request (user)
router.post('/', controller.createRequest);
// List requests (admin: all, user: own)
router.get('/', controller.listRequests);
// Approve a request (admin only)
router.patch('/:id/approve', controller.approveRequest);
// Deny a request (admin only)
router.patch('/:id/deny', controller.denyRequest);
// Delete a request (admin only)
router.delete('/:id', controller.deleteRequest);

module.exports = router; 