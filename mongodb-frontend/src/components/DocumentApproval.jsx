import React, { useState, useEffect } from 'react';
import { clearanceService } from '../services/clearanceService';
import { showToast } from '../utils/toast';
import './DocumentApproval.css';

const DocumentApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await clearanceService.getRequests();
      setRequests(res.data || []);
    } catch (err) {
      showToast.error('Failed to fetch requests');
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
            <th>Action</th>
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
                  {req.status === 'pending' ? (
                    <>
                      <button className="btn-approve" onClick={() => handleApprove(req._id)}>Approve</button>
                      <button className="btn-delete" onClick={() => handleDeny(req._id)}>Deny</button>
                    </>
                  ) : (
                    <span style={{ color: '#bbb' }}>—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentApproval; 