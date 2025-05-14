import React, { useState, useEffect } from 'react';
import { clearanceService } from '../services/clearanceService';
import { showToast } from '../utils/toast';
import './DocumentApproval.css';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';

const DocumentApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await clearanceService.getRequests();
      setRequests(res.data || []);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await clearanceService.approveRequest(id);
      showToast.success('Request approved');
      fetchRequests();
    } catch (err) {
      showToast.error('Failed to approve request');
    }
  };

  const handleDelete = async (id) => {
    try {
      await clearanceService.deleteRequest(id);
      showToast.success('Request deleted');
      fetchRequests();
    } catch (err) {
      showToast.error('Failed to delete request');
    }
  };

  const handleDeny = async (id) => {
    try {
      await clearanceService.denyRequest(id);
      showToast.success('Request denied');
      fetchRequests();
    } catch (err) {
      showToast.error('Failed to deny request');
    }
  };

  const handleView = (req) => {
    setSelectedRequest(req);
    setViewModal(true);
  };

  const closeModal = () => {
    setViewModal(false);
    setSelectedRequest(null);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status === 'approved' || r.status === 'denied');

  return (
    <div className="document-approval">
      <h2 style={{ borderLeft: '3px solid #2563eb', paddingLeft: 10, marginBottom: 18, fontWeight: 700, color: '#222', fontSize: '1.18rem' }}>Pending Approval</h2>
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
          {pendingRequests.length === 0 ? (
            <tr><td colSpan="6">No pending document requests found.</td></tr>
          ) : (
            pendingRequests.map(req => (
              <tr key={req._id}>
                <td>{req.fullname}</td>
                <td>{req.address}</td>
                <td>{req.purpose}</td>
                <td><span className={`status-label ${req.status}`}>Pending</span></td>
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <button className="btn-icon" title="View Details" onClick={() => handleView(req)}>
                    <FaEye />
                  </button>
                  <button className="btn-icon btn-approve" title="Approve" onClick={() => handleApprove(req._id)}>
                    <FaCheck />
                  </button>
                  <button className="btn-icon btn-deny" title="Deny" onClick={() => handleDeny(req._id)}>
                    <FaTimes />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 style={{ borderLeft: '3px solid #22c55e', paddingLeft: 10, marginTop: 36, marginBottom: 18, fontWeight: 700, color: '#222', fontSize: '1.18rem' }}>Approved/Denied Document Requests</h2>
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
          {processedRequests.length === 0 ? (
            <tr><td colSpan="6">No approved or denied document requests found.</td></tr>
          ) : (
            processedRequests.map(req => (
              <tr key={req._id}>
                <td>{req.fullname}</td>
                <td>{req.address}</td>
                <td>{req.purpose}</td>
                <td><span className={`status-label ${req.status}`}>
                  {req.status === 'approved' && <><FaCheck style={{marginRight: 4}} />Approved</>}
                  {req.status === 'denied' && <><FaTimes style={{marginRight: 4}} />Denied</>}
                </span></td>
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <button className="btn-icon" title="View Details" onClick={() => handleView(req)}>
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {viewModal && selectedRequest && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 10, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Request Details</h3>
            <div style={{ marginBottom: 10 }}><b>Full Name:</b> {selectedRequest.fullname}</div>
            <div style={{ marginBottom: 10 }}><b>Address:</b> {selectedRequest.address}</div>
            <div style={{ marginBottom: 10 }}><b>Purpose:</b> {selectedRequest.purpose}</div>
            <div style={{ marginBottom: 10 }}><b>Status:</b> {selectedRequest.status}</div>
            <div style={{ marginBottom: 10 }}><b>Requested At:</b> {new Date(selectedRequest.createdAt).toLocaleString()}</div>
            {selectedRequest.message && (
              <div style={{ marginBottom: 10 }}><b>Message:</b> {selectedRequest.message}</div>
            )}
            <button style={{ marginTop: 18, background: '#5271ff', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }} onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentApproval; 