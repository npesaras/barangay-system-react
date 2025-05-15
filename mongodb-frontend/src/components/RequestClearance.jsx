import React, { useState, useEffect } from 'react';
import { clearanceService } from '../services/clearanceService';
import { showToast } from '../utils/toast';
import jsPDF from 'jspdf';
import { barangayInfoService } from '../services/barangayInfoService';

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
  const [barangayInfo, setBarangayInfo] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, qrUrl: '' });
  const [viewModal, setViewModal] = useState({ open: false, request: null });
  const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    // Fetch barangay info and logo
    (async () => {
      const info = await barangayInfoService.getInfo();
      setBarangayInfo(info);
      if (info.logo) {
        const logoUrl = barangayInfoService.getLogoUrl();
        fetch(logoUrl)
          .then(res => res.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => setLogoImg(reader.result);
            reader.readAsDataURL(blob);
          });
      }
    })();
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr><td colSpan="6">No requests found.</td></tr>
          ) : (
            requests.map(req => (
              <tr key={req._id}>
                <td>{req.fullname}</td>
                <td>{req.address}</td>
                <td>{req.purpose}</td>
                <td><span className={`status-label ${req.status}`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span></td>
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td>
                  {req.status === 'approved' && (
                    <>
                      <button className="btn-icon btn-qr" title="View QR Code" style={{ fontSize: '1em', color: '#059669', padding: '4px 6px', marginLeft: 4 }} onClick={() => setQrModal({ open: true, qrUrl: `${backendBase}/clearance-requests/${req._id}/qr?t=${Date.now()}` })}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#059669" strokeWidth="1.5"/>
                          <rect x="12" y="2" width="6" height="6" rx="1.5" stroke="#059669" strokeWidth="1.5"/>
                          <rect x="2" y="12" width="6" height="6" rx="1.5" stroke="#059669" strokeWidth="1.5"/>
                          <rect x="7" y="7" width="2" height="2" fill="#059669"/>
                          <rect x="15" y="15" width="2" height="2" fill="#059669"/>
                          <rect x="12" y="12" width="2" height="2" fill="#059669"/>
                        </svg>
                      </button>
                      <button className="btn-icon btn-view" title="View Details" style={{ fontSize: '1em', color: '#2563eb', padding: '4px 6px', marginLeft: 4 }} onClick={() => setViewModal({ open: true, request: req })}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 4C5 4 1.73 8.11 1.13 8.93a1.5 1.5 0 0 0 0 2.14C1.73 11.89 5 16 10 16s8.27-4.11 8.87-4.93a1.5 1.5 0 0 0 0-2.14C18.27 8.11 15 4 10 4Zm0 10c-3.31 0-6.13-2.94-7.19-4C3.87 8.94 6.69 6 10 6s6.13 2.94 7.19 4C16.13 11.06 13.31 14 10 14Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" fill="#2563eb"/>
                        </svg>
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {qrModal.open && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 10, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>QR Code</h3>
            <img
              src={qrModal.qrUrl}
              alt="QR Code"
              style={{ width: 200, height: 200, margin: '0 auto' }}
              onError={e => { e.target.onerror = null; e.target.src = '/qr-placeholder.png'; }}
            />
            <button style={{ marginTop: 18, background: '#5271ff', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setQrModal({ open: false, qrUrl: '' })}>Close</button>
          </div>
        </div>
      )}

      {viewModal.open && viewModal.request && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 10, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Request Details</h3>
            <div style={{ textAlign: 'left', marginBottom: 16 }}>
              <div><strong>Full Name:</strong> {viewModal.request.fullname}</div>
              <div><strong>Address:</strong> {viewModal.request.address}</div>
              <div><strong>Purpose:</strong> {viewModal.request.purpose}</div>
              <div><strong>Message:</strong> {viewModal.request.message || <span style={{ color: '#888' }}>(none)</span>}</div>
              <div><strong>Status:</strong> {viewModal.request.status}</div>
              <div><strong>Requested At:</strong> {new Date(viewModal.request.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <img
                src={`${backendBase}/clearance-requests/${viewModal.request._id}/qr?t=${Date.now()}`}
                alt="QR Code"
                style={{ width: 200, height: 200, margin: '0 auto', border: '1px solid #eee', background: '#fafafa' }}
                onError={e => { e.target.onerror = null; e.target.src = '/qr-placeholder.png'; }}
                id="qr-detail-img"
              />
            </div>
            <button
              style={{ marginBottom: 18, background: '#059669', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => {
                const img = document.getElementById('qr-detail-img');
                if (img) {
                  const link = document.createElement('a');
                  link.href = img.src;
                  link.download = `qr-code-${viewModal.request._id}.png`;
                  link.click();
                }
              }}
            >Download QR Code</button>
            <button style={{ background: '#5271ff', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600, marginLeft: 8 }} onClick={() => setViewModal({ open: false, request: null })}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestClearance; 