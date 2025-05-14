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

  const handleViewPDF = (req) => {
    if (!barangayInfo) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const { fullname, address, purpose, createdAt } = req;
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
    const issuedText = `this ${new Date(createdAt).getDate()} day of ${new Date(createdAt).toLocaleString('default', { month: 'long' })}, ${new Date(createdAt).getFullYear()} at Barangay ${barangay}, ${municipality}, ${province} upon request of the interested party for whatever legal purposes it may serve.`;
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
    doc.text('', 45, y);
    doc.text('Date Issued:', 20, y + 6);
    doc.text(new Date(createdAt).toISOString().slice(0, 10), 45, y + 6);
    doc.text('Doc. Stamp:', 20, y + 12);
    doc.text('Paid', 45, y + 12);
    // Open PDF in new tab
    window.open(doc.output('bloburl'), '_blank');
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
                    <button className="btn-icon btn-generate" title="View Document" style={{ fontSize: '1em', color: '#2563eb', padding: '4px 6px' }} onClick={() => handleViewPDF(req)}>
                      <span style={{ fontWeight: 500, fontSize: '0.98em' }}>📄</span>
                    </button>
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

export default RequestClearance; 