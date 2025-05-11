import React, { useState, useEffect } from 'react';
import { residentService } from '../services/residentService';
import { blotterService } from '../services/blotterService';
import { showToast } from '../utils/toast';

const initialForm = {
  complainant: '',
  respondent: '',
  complaint: '',
  incidentType: '',
  dateTimeIncident: '',
};

const Blotter = () => {
  const [form, setForm] = useState(initialForm);
  const [residents, setResidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch residents for dropdowns
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const res = await residentService.getAllResidents();
        setResidents(res.data || []);
      } catch (err) {
        showToast.error('Failed to fetch residents');
      }
    };
    fetchResidents();
    fetchLogs();
  }, []);

  // Fetch user's own blotter logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await blotterService.getRequests();
      setLogs(res.data || []);
    } catch (err) {
      showToast.error('Failed to fetch blotter logs');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await blotterService.createRequest(form);
      showToast.success('Blotter request submitted!');
      setForm(initialForm);
      fetchLogs();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to submit blotter request');
    }
  };

  return (
    <div className="blotter-page blotter-request">
      <h2>Blotter Request</h2>
      <form className="blotter-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Complainant</label>
          <select name="complainant" value={form.complainant} onChange={handleChange} required>
            <option value="">Select...</option>
            {residents.map(r => (
              <option key={r._id} value={r.firstName + ' ' + (r.middleName ? r.middleName + ' ' : '') + r.lastName}>
                {r.firstName} {r.middleName ? r.middleName + ' ' : ''}{r.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Complain Statement</label>
          <textarea name="complaint" value={form.complaint} onChange={handleChange} required rows={4} />
        </div>
        <div className="form-group">
          <label>Select Respondent</label>
          <select name="respondent" value={form.respondent} onChange={handleChange} required>
            <option value="">Select...</option>
            {residents.map(r => (
              <option key={r._id} value={r.firstName + ' ' + (r.middleName ? r.middleName + ' ' : '') + r.lastName}>
                {r.firstName} {r.middleName ? r.middleName + ' ' : ''}{r.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Incident Type</label>
          <input name="incidentType" value={form.incidentType} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Date/Time of Incident</label>
          <input type="datetime-local" name="dateTimeIncident" value={form.dateTimeIncident} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>Submit Blotter</button>
      </form>

      <h3 style={{ marginTop: '2rem' }}>My Blotter Logs</h3>
      <table className="approval-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Incident Type</th>
            <th>DateTime Reported</th>
            <th>DateTime Incident</th>
            <th>Date Recorded</th>
            <th>Complainant</th>
            <th>Respondent</th>
            <th>Complaint</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan="8">No blotter logs found.</td></tr>
          ) : (
            logs.map(log => (
              <tr key={log._id}>
                <td><span className={`status-label ${log.status?.toLowerCase()}`}>{log.status.charAt(0).toUpperCase() + log.status.slice(1)}</span></td>
                <td>{log.incidentType}</td>
                <td>{log.dateTimeReported ? new Date(log.dateTimeReported).toLocaleString() : ''}</td>
                <td>{log.dateTimeIncident ? new Date(log.dateTimeIncident).toLocaleString() : ''}</td>
                <td>{log.dateRecorded ? new Date(log.dateRecorded).toLocaleString() : ''}</td>
                <td>{log.complainant}</td>
                <td>{log.respondent}</td>
                <td>{log.complaint}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Blotter; 