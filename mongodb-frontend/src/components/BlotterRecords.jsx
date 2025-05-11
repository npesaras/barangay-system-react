import React, { useState, useEffect } from 'react';
import { blotterService } from '../services/blotterService';
import { showToast } from '../utils/toast';

const statusColors = {
  pending: { color: '#fbbf24', label: 'Pending' },
  approved: { color: '#22c55e', label: 'Approved' },
  denied: { color: '#ef4444', label: 'Denied' },
};

const BlotterRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, record: null, action: null });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await blotterService.getRequests();
      setRecords(res.data || []);
    } catch (err) {
      showToast.error('Failed to fetch blotter records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleApprove = async (id) => {
    try {
      await blotterService.approveRequest(id);
      showToast.success('Blotter approved');
      fetchRecords();
    } catch (err) {
      showToast.error('Failed to approve blotter');
    }
  };

  const handleDeny = async (id) => {
    try {
      await blotterService.denyRequest(id);
      showToast.success('Blotter denied');
      fetchRecords();
    } catch (err) {
      showToast.error('Failed to deny blotter');
    }
  };

  const openConfirmDialog = (record, action) => {
    setConfirmDialog({ open: true, record, action });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, record: null, action: null });
  };

  const confirmAction = async () => {
    if (!confirmDialog.record || !confirmDialog.action) return;
    if (confirmDialog.action === 'approve') {
      await handleApprove(confirmDialog.record._id);
    } else if (confirmDialog.action === 'deny') {
      await handleDeny(confirmDialog.record._id);
    }
    closeConfirmDialog();
  };

  const pendingRecords = records.filter(r => r.status === 'pending');
  const approvedDeniedRecords = records.filter(r => r.status === 'approved' || r.status === 'denied');

  return (
    <div>
      {/* Pending Approval Table */}
      <div className="blotter-logs-container">
        <h4 className="blotter-heading" style={{ fontSize: '1.08rem', fontWeight: 700, borderLeft: '3px solid #2563eb', paddingLeft: 8, marginBottom: 10 }}>Pending Approval</h4>
        <table className="approval-table compact-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Incident Type</th>
              <th>DateTime Reported</th>
              <th>DateTime Incident</th>
              <th>Complainant</th>
              <th>Tools</th>
            </tr>
          </thead>
          <tbody>
            {pendingRecords.length === 0 ? (
              <tr><td colSpan="6">No pending blotter records found.</td></tr>
            ) : (
              pendingRecords.map(record => (
                <tr key={record._id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: statusColors[record.status]?.color || '#bbb',
                        marginRight: 5
                      }}></span>
                      {statusColors[record.status]?.label || record.status}
                    </span>
                  </td>
                  <td>{record.incidentType}</td>
                  <td>{record.dateTimeReported ? new Date(record.dateTimeReported).toLocaleString() : ''}</td>
                  <td>{record.dateTimeIncident ? new Date(record.dateTimeIncident).toLocaleString() : ''}</td>
                  <td>{record.complainant}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                      <button
                        className="btn-action btn-view"
                        title="View"
                        style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.18rem 0.38rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}
                        onClick={() => { setSelectedRecord(record); setViewModal(true); }}
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      {record.status === 'pending' && (
                        <>
                          <button
                            className="btn-action btn-approve"
                            title="Approve"
                            style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 4, padding: '0.18rem 0.38rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}
                            onClick={() => openConfirmDialog(record, 'approve')}
                          >
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          </button>
                          <button
                            className="btn-action btn-deny"
                            title="Deny"
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '0.18rem 0.38rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}
                            onClick={() => openConfirmDialog(record, 'deny')}
                          >
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {viewModal && selectedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Blotter Details</h3>
            <div style={{ marginBottom: 10 }}><b>Status:</b> {statusColors[selectedRecord.status]?.label || selectedRecord.status}</div>
            <div style={{ marginBottom: 10 }}><b>Incident Type:</b> {selectedRecord.incidentType}</div>
            <div style={{ marginBottom: 10 }}><b>DateTime Reported:</b> {selectedRecord.dateTimeReported ? new Date(selectedRecord.dateTimeReported).toLocaleString() : ''}</div>
            <div style={{ marginBottom: 10 }}><b>DateTime Incident:</b> {selectedRecord.dateTimeIncident ? new Date(selectedRecord.dateTimeIncident).toLocaleString() : ''}</div>
            <div style={{ marginBottom: 10 }}><b>Complainant:</b> {selectedRecord.complainant}</div>
            <div style={{ marginBottom: 10 }}><b>Respondent:</b> {selectedRecord.respondent}</div>
            <div style={{ marginBottom: 10 }}><b>Complaint:</b> {selectedRecord.complaint}</div>
            <button style={{ marginTop: 18, background: '#5271ff', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setViewModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Approved/Denied Table */}
      <div className="blotter-logs-container" style={{ marginTop: '2.2rem' }}>
        <h4 className="blotter-heading" style={{ fontSize: '1.08rem', fontWeight: 700, borderLeft: '3px solid #22c55e', paddingLeft: 8, marginBottom: 10 }}>Approved/Denied Blotter Records</h4>
        <table className="approval-table compact-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Incident Type</th>
              <th>DateTime Reported</th>
              <th>DateTime Incident</th>
              <th>Complainant</th>
            </tr>
          </thead>
          <tbody>
            {approvedDeniedRecords.length === 0 ? (
              <tr><td colSpan="5">No approved or denied blotter records found.</td></tr>
            ) : (
              approvedDeniedRecords.map(record => (
                <tr key={record._id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: statusColors[record.status]?.color || '#bbb',
                        marginRight: 5
                      }}></span>
                      {statusColors[record.status]?.label || record.status}
                    </span>
                  </td>
                  <td>{record.incidentType}</td>
                  <td>{record.dateTimeReported ? new Date(record.dateTimeReported).toLocaleString() : ''}</td>
                  <td>{record.dateTimeIncident ? new Date(record.dateTimeIncident).toLocaleString() : ''}</td>
                  <td>{record.complainant}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Confirmation Dialog */}
      {confirmDialog.open && confirmDialog.record && (
        <div className="confirm-dialog-backdrop">
          <div className="confirm-dialog-content fade-in">
            <div style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 10 }}>
              {confirmDialog.action === 'approve' ? 'Approve' : 'Deny'} Blotter Record
            </div>
            <div style={{ marginBottom: 16 }}>
              Are you sure you want to <b>{confirmDialog.action === 'approve' ? 'approve' : 'deny'}</b> this blotter record for <b>{confirmDialog.record.incidentType}</b>?
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeConfirmDialog} style={{ background: '#e5e7eb', color: '#223046', border: 'none', borderRadius: 4, padding: '0.4rem 1.1rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmAction} style={{ background: confirmDialog.action === 'approve' ? '#22c55e' : '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '0.4rem 1.1rem', fontWeight: 600, cursor: 'pointer' }}>{confirmDialog.action === 'approve' ? 'Approve' : 'Deny'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlotterRecords; 