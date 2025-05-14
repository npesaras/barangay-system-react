import React, { useState, useEffect } from 'react';
import { clearanceService } from '../services/clearanceService';
import { showToast } from '../utils/toast';

const initialForm = {
  fullname: '',
  address: '',
  purpose: '',
  message: '',
};

const RequestClearance = () => {
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's own requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await clearanceService.getRequests();
      setRequests(res.data || []);
    } catch (err) {
      // No toast for failed fetch, just set requests to empty
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await clearanceService.createRequest(form);
      showToast.success('Request submitted!');
      setForm(initialForm);
      fetchRequests();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <div className="request-clearance">
      <h2>Request Barangay Clearance</h2>
      <form className="clearance-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input name="fullname" value={form.fullname} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input name="address" value={form.address} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Purpose</label>
          <select
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            required
          >
            <option value="">Select Purpose</option>
            <option value="Barangay Clearance">Barangay Clearance</option>
            <option value="Certificate">Certificate</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Additional Info / Message (optional)</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Add any additional information for the admin..."
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>Submit Request</button>
      </form>

      <h3 style={{ marginTop: '2rem' }}>My Requests</h3>
      <table className="approval-table">
        <thead>
          <tr>
            <th>Fullname</th>
            <th>Address</th>
            <th>Purpose</th>
            <th>Status</th>
            <th>Requested At</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr><td colSpan="5">No requests found.</td></tr>
          ) : (
            requests.map(req => (
              <tr key={req._id}>
                <td>{req.fullname}</td>
                <td>{req.address}</td>
                <td>{req.purpose}</td>
                <td><span className={`status-label ${req.status}`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span></td>
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestClearance; 