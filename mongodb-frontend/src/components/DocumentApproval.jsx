import React, { useState, useEffect } from 'react';
import { clearanceService } from '../services/clearanceService';
import { showToast } from '../utils/toast';
import './DocumentApproval.css';
import { FaCheck, FaTimes, FaEye, FaQrcode } from 'react-icons/fa';
import jsPDF from 'jspdf';
import { barangayInfoService } from '../services/barangayInfoService';
import QrScanner from 'react-qr-scanner';
import { BrowserQRCodeReader } from '@zxing/browser';
import api from '../services/axios';
import { toast } from 'react-toastify';

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
  const [qrModal, setQrModal] = useState({ open: false, qrUrl: '', loading: false });
  const [scanModal, setScanModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scannedDoc, setScannedDoc] = useState(null);
  const [showScannedDetails, setShowScannedDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  const handleGenerateQR = async (req) => {
    setQrModal({ open: true, qrUrl: '', loading: true });
    try {
      await clearanceService.generateQRCode(req._id);
      // After generation, get the QR code URL (absolute)
      const qrUrl = `${backendBase}/clearance-requests/${req._id}/qr?t=${Date.now()}`;
      setQrModal({ open: true, qrUrl, loading: false });
      fetchRequests();
    } catch (err) {
      showToast.error('Failed to generate QR code');
      setQrModal({ open: false, qrUrl: '', loading: false });
    }
  };

  const handleViewQR = (req) => {
    const qrUrl = `${backendBase}/clearance-requests/${req._id}/qr`;
    setQrModal({ open: true, qrUrl, loading: false });
  };

  const handleScan = async (data) => {
    console.log('handleScan called with:', data);
    if (data) {
      setScanResult(data);
      setScanError('');
      // Call backend to check document
      try {
        const res = await api.post('/clearance-requests/scan', { qr: data });
        const result = res.data;
        console.log('Scan API response:', result);
        if (result.data && result.data.exists) {
          setScannedDoc(result.data);
          // Only show a success toast, no View Details button
          toast.success('QR code exists!', { autoClose: 3000 });
        } else {
          setScannedDoc(null);
          showToast.error('No such document for this QR code.');
        }
      } catch (err) {
        setScannedDoc(null);
        showToast.error('Error checking QR code.');
      }
    }
  };

  const handleError = (err) => {
    setScanError('Error scanning QR code');
  };

  const handleImageUpload = async (event) => {
    console.log('handleImageUpload called');
    setScanError('');
    setUploading(true);
    setScannedDoc(null);
    setScanResult(null);
    setUploadedImage(null);

    const file = event.target.files[0];
    if (!file) { setUploading(false); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      setUploadedImage(e.target.result);

      // Try to extract hash from file name if present
      const hashMatch = file.name.match(/hash-([a-fA-F0-9]{24})/);
      if (hashMatch && hashMatch[1]) {
        const hash = hashMatch[1];
        setScanResult(hash);
        setUploading(false);
        handleScan(hash);
        return;
      }

      // Fallback: try to decode the QR code from the image
      try {
        const qrReader = new BrowserQRCodeReader();
        const result = await qrReader.decodeFromImage(undefined, e.target.result);
        if (result && result.text) {
          setScanResult(result.text);
          handleScan(result.text);
        } else {
          showToast.error('No QR code found in the image.');
        }
      } catch (err) {
        showToast.error('No QR code found in the image.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
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
                    <button className="btn-icon btn-generate" title="Generate Document" style={{ fontSize: '1em', color: '#2563eb', padding: '4px 6px' }} onClick={() => handleGenerateClick(req)}>
                      <span style={{ fontWeight: 500, fontSize: '0.98em' }}>📄</span>
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
            {selectedRequest.status === 'approved' && (
              <div style={{ margin: '18px 0 0 0', textAlign: 'center' }}>
                <img
                  src={`${backendBase}/clearance-requests/${selectedRequest._id}/qr?t=${Date.now()}`}
                  alt="QR Code"
                  style={{ width: 180, height: 180, margin: '0 auto', border: '1px solid #eee', background: '#fafafa', borderRadius: 10 }}
                  onError={e => { e.target.onerror = null; e.target.src = '/qr-placeholder.png'; }}
                />
                <div style={{ marginTop: 10, color: '#444', fontSize: '0.98em' }}>
                  This is the auto-generated QR code for this document.
                </div>
              </div>
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

      {qrModal.open && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 10, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>QR Code</h3>
            {qrModal.loading ? (
              <div>Generating QR code...</div>
            ) : (
              <>
                {console.log('QR Modal URL:', qrModal.qrUrl)}
                <img
                  src={qrModal.qrUrl}
                  alt="QR Code"
                  style={{ width: 200, height: 200, margin: '0 auto' }}
                  onError={e => { e.target.onerror = null; e.target.src = '/qr-placeholder.png'; }}
                />
              </>
            )}
            <button style={{ marginTop: 18, background: '#5271ff', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setQrModal({ open: false, qrUrl: '', loading: false })}>Close</button>
          </div>
        </div>
      )}

      <button style={{ marginBottom: 18, background: '#059669', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setScanModal(true)}>
        Scan QR Code
      </button>

      {scanModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 10, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontWeight: 800, fontSize: '1.35em', letterSpacing: 0.5, color: '#2563eb', textShadow: '0 2px 8px rgba(37,99,235,0.07)' }}>Scan QR Code</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
              {uploadedImage ? (
                <div style={{
                  background: '#fff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '12px 12px 6px 12px',
                  minWidth: 0,
                  maxWidth: 220,
                  marginBottom: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <img src={uploadedImage} alt="Uploaded QR Preview" style={{ width: 200, height: 200, objectFit: 'contain', borderRadius: 8, background: '#fafafa', marginBottom: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                  <span style={{ fontSize: '0.97em', color: '#444', fontWeight: 500, textAlign: 'center' }}>Preview</span>
                  {scanResult && (
                    <div style={{ marginTop: 8, color: '#2563eb', fontSize: '0.98em', wordBreak: 'break-all', textAlign: 'center', width: '100%' }}>
                      <b>Hash code:</b> <span style={{ wordBreak: 'break-all' }}>{scanResult}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: '#f3f4f6',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: 12,
                  width: 120,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#b0b6c1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="10" y="10" width="4" height="4" rx="1"/><rect x="17" y="17" width="4" height="4" rx="1"/><rect x="14" y="14" width="4" height="4" rx="1"/></svg>
                </div>
              )}
            </div>
            <div style={{ margin: '16px 0 0 0', padding: '10px 0', borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '1.01em', color: '#222' }}>Or upload a QR code image:</label>
              <label htmlFor="qr-upload-input" style={{
                background: '#f3f6fd',
                color: '#2563eb',
                border: '1.5px solid #dbeafe',
                borderRadius: 7,
                padding: '0.5rem 1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 8,
                boxShadow: '0 2px 8px rgba(37,99,235,0.04)',
                transition: 'background 0.2s, color 0.2s',
                display: 'inline-block',
              }}>
                {uploading ? 'Uploading...' : 'Choose Image'}
                <input id="qr-upload-input" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: 'none' }} />
              </label>
            </div>
            {scanError && <div style={{ color: '#fff', background: '#ef4444', borderRadius: 6, padding: '8px 0', marginTop: 18, fontWeight: 600, fontSize: '1.05em', letterSpacing: 0.2 }}> {scanError} </div>}
            {scannedDoc && (
              <div style={{ marginTop: 16, textAlign: 'left' }}>
                <div><strong>Full Name:</strong> {scannedDoc.fullname}</div>
                <div><strong>Address:</strong> {scannedDoc.address}</div>
                <div><strong>Purpose:</strong> {scannedDoc.purpose}</div>
                <div><strong>Status:</strong> {scannedDoc.status}</div>
                <div><strong>Requested At:</strong> {new Date(scannedDoc.createdAt).toLocaleString()}</div>
              </div>
            )}
            <button style={{ marginTop: 18, background: '#5271ff', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setScanModal(false); setScanResult(null); setScannedDoc(null); setScanError(''); setUploadedImage(null); }}>Close</button>
          </div>
        </div>
      )}

      {showScannedDetails && scannedDoc && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 10, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Request Actions</h3>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              <button style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600, minWidth: 120 }} onClick={() => { handleGenerateClick(scannedDoc); setShowScannedDetails(false); }}>Generate Document</button>
              <button style={{ background: '#5271ff', color: '#fff', border: 'none', borderRadius: 5, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600, minWidth: 100 }} onClick={() => setShowScannedDetails(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentApproval; 