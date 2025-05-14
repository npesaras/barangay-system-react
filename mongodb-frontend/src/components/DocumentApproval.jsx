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

  return (
    <div className="document-approval">
      <h2>Document Approval (Admin)</h2>
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
                <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="btn-view" title="View Details" onClick={() => handleView(req)}><FaEye /></button>
                  {req.status === 'pending' && (
                    <>
                      <button className="btn-approve" onClick={() => handleApprove(req._id)}><FaCheck style={{marginRight: 4}} />Approve</button>
                      <button className="btn-delete" onClick={() => handleDeny(req._id)}><FaTimes style={{marginRight: 4}} />Deny</button>
                    </>
                  )}
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