import React, { useState, useEffect } from 'react';
import { clearanceService } from '../services/clearanceService';
import { showToast } from '../utils/toast';
import './DocumentApproval.css';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import jsPDF from 'jspdf';
import { barangayInfoService } from '../services/barangayInfoService';

const DocumentApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState({});
  const [generateRequest, setGenerateRequest] = useState(null);
  const [barangayInfo, setBarangayInfo] = useState(null);
  const [logoImg, setLogoImg] = useState(null);

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
    // Fetch barangay info and logo
    (async () => {
      const info = await barangayInfoService.getInfo();
      setBarangayInfo(info);
      if (info.logo) {
        const logoUrl = barangayInfoService.getLogoUrl();
        // Fetch logo as base64 for jsPDF
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

  const handleGenerateClick = (req) => {
    setGenerateRequest(req);
    setGenerateData({
      ctcNo: '',
      issuedAt: '',
      issuedOn: '',
      dateIssued: new Date().toISOString().slice(0, 10),
    });
    setShowGenerateModal(true);
  };

  const handleGenerateInput = (e) => {
    setGenerateData({ ...generateData, [e.target.name]: e.target.value });
  };

  const handleGeneratePDF = () => {
    if (!generateRequest || !barangayInfo) return;
    // Use A4 size (210mm x 297mm)
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const { fullname, address, purpose } = generateRequest;
    const { ctcNo, issuedAt, issuedOn, dateIssued } = generateData;
    const { barangay, municipality, province, captainName } = barangayInfo;
    // Draw border
    doc.setLineWidth(0.7);
    doc.rect(10, 10, 190, 277);
    // Logo
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 18, 16, 28, 28, undefined, 'FAST');
    }
    // Header
    doc.setFont('times', '');
    doc.setFontSize(11);
    doc.text('Republic of the Philippines', 105, 22, { align: 'center' });
    doc.text(`Province of ${province || ''}`, 105, 28, { align: 'center' });
    doc.text(`Municipality of ${municipality || ''}`, 105, 34, { align: 'center' });
    doc.setFont('times', 'italic');
    doc.setTextColor(30, 60, 180);
    doc.setFontSize(18);
    doc.text(`Barangay ${barangay || ''}`, 105, 44, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', '');
    doc.setFontSize(13);
    doc.line(25, 50, 185, 50);
    // Office title
    doc.setFont('times', 'bold');
    doc.text('OFFICE OF THE BARANGAY CAPTAIN', 105, 58, { align: 'center' });
    // Clearance title
    doc.setFontSize(17);
    doc.text('BARANGAY CLEARANCE', 105, 70, { align: 'center' });
    // Body
    let y = 85;
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('TO WHOM IT MAY CONCERN:', 105, y, { align: 'center' });
    y += 10;
    doc.setFont('times', '');
    const cert1 = `This is to certify that `;
    doc.text(cert1, 105, y, { align: 'center' });
    doc.setFont('times', 'bolditalic');
    doc.text(fullname, 105, y + 8, { align: 'center' });
    doc.setFont('times', '');
    y += 16;
    const cert2 = `, a resident of Barangay ${barangay}, ${municipality}, ${province},`;
    doc.text(doc.splitTextToSize(cert2, 160), 105, y, { align: 'center' });
    y += 8 * (Math.ceil(doc.getTextWidth(cert2) / 160));
    const cert3 = `is known to be of good moral character and law-abiding citizen in the community.`;
    doc.text(doc.splitTextToSize(cert3, 160), 105, y, { align: 'center' });
    y += 8 * (Math.ceil(doc.getTextWidth(cert3) / 160));
    const cert4 = `To certify further, that he/she has no derogatory and/or criminal records filed in this barangay.`;
    doc.text(doc.splitTextToSize(cert4, 160), 105, y, { align: 'center' });
    y += 8 * (Math.ceil(doc.getTextWidth(cert4) / 160));
    y += 4;
    doc.setFont('times', 'bold');
    doc.text('ISSUED', 105, y, { align: 'center' });
    doc.setFont('times', '');
    const issuedText = `this ${new Date(dateIssued).getDate()} day of ${new Date(dateIssued).toLocaleString('default', { month: 'long' })}, ${new Date(dateIssued).getFullYear()} at Barangay ${barangay}, ${municipality}, ${province} upon request of the interested party for whatever legal purposes it may serve.`;
    doc.text(doc.splitTextToSize(issuedText, 160), 105, y + 8, { align: 'center' });
    y += 8 * (Math.ceil(doc.getTextWidth(issuedText) / 160)) + 16;
    // Signature line and captain
    doc.line(120, y, 190, y);
    y += 6;
    doc.setFont('times', 'bold');
    doc.text((captainName || 'Barangay Captain'), 190, y, { align: 'right' });
    doc.setFont('times', '');
    doc.text('Barangay Captain', 190, y + 7, { align: 'right' });
    y += 20;
    // Horizontal line above footer
    doc.setDrawColor(180);
    doc.line(20, y, 190, y);
    y += 8;
    // Footer fields
    doc.setFontSize(11);
    doc.text('O.R. No.:', 20, y);
    doc.text(ctcNo, 45, y);
    doc.text('Date Issued:', 20, y + 6);
    doc.text(dateIssued, 45, y + 6);
    doc.text('Doc. Stamp:', 20, y + 12);
    doc.text('Paid', 45, y + 12);
    doc.save(`Barangay_Clearance_${fullname.replace(/\s+/g, '_')}.pdf`);
    setShowGenerateModal(false);
    setGenerateRequest(null);
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
                  {req.status === 'approved' && (
                    <button className="btn-icon btn-generate" title="Generate Document" onClick={() => handleGenerateClick(req)}>
                      <FaCheck style={{ color: '#2563eb' }} />
                      <span style={{ marginLeft: 4, fontWeight: 500 }}>Generate Document</span>
                    </button>
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

      {showGenerateModal && generateRequest && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 10, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Generate Barangay Clearance</h3>
            <div style={{ marginBottom: 10 }}><b>Full Name:</b> {generateRequest.fullname}</div>
            <div style={{ marginBottom: 10 }}><b>Address:</b> {generateRequest.address}</div>
            <div style={{ marginBottom: 10 }}><b>Purpose:</b> {generateRequest.purpose}</div>
            <div style={{ marginBottom: 10 }}>
              <label>Date Issued</label>
              <input type="date" name="dateIssued" value={generateData.dateIssued} onChange={handleGenerateInput} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>CTC No.</label>
              <input name="ctcNo" value={generateData.ctcNo} onChange={handleGenerateInput} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Issued at</label>
              <input name="issuedAt" value={generateData.issuedAt} onChange={handleGenerateInput} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Issued on</label>
              <input name="issuedOn" value={generateData.issuedOn} onChange={handleGenerateInput} style={{ width: '100%' }} />
            </div>
            <button style={{ marginTop: 18, background: '#5271ff', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }} onClick={handleGeneratePDF}>Generate PDF</button>
            <button style={{ marginTop: 18, marginLeft: 10, background: '#eee', color: '#333', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowGenerateModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentApproval; 