import React, { useState, useEffect } from 'react';
import './BarangayInfo.css';
import { barangayInfoService } from '../services/barangayInfoService';

const defaultLogo = '/logo-placeholder.png'; // Use a placeholder or default logo path

const initialInfo = {
  barangay: 'Barangay Records',
  municipality: 'Dumaguete',
  province: 'Negros Oriental',
  phoneNumber: '0930624702',
  emailAddress: 'barangayrecords@gmail.com',
  logo: '', // Start with no logo to show placeholder/initials
};

function getInitials(name) {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length === 1) return words[0][0]?.toUpperCase() || '';
  return (words[0][0] + words[1][0]).toUpperCase();
}

const BarangayInfo = ({ isAdmin = false }) => {
  const [info, setInfo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    async function fetchInfo() {
      setLoading(true);
      try {
        const data = await barangayInfoService.getInfo();
        setInfo(data);
        setLogoError(false);
        if (data.logo) {
          setLogoPreview(barangayInfoService.getLogoUrl(data.logo) + '?t=' + Date.now());
        } else {
          setLogoPreview('');
        }
      } catch (err) {
        setInfo({
          barangay: '', municipality: '', province: '', phoneNumber: '', emailAddress: '', logo: ''
        });
        setLogoPreview('');
        setLogoError(false);
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, []);

  const handleChange = (e) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
      setLogoFile(file);
    }
  };

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setEditing(false);
    setLogoFile(null);
    if (info.logo) {
      setLogoPreview(barangayInfoService.getLogoUrl(info.logo) + '?t=' + Date.now());
    } else {
      setLogoPreview('');
    }
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!info.phoneNumber || !info.emailAddress) {
      alert('Phone number and email address are required.');
      return;
    }
    setLoading(true);
    try {
      const updated = await barangayInfoService.updateInfo(info, logoFile);
      setInfo(updated);
      if (updated.logo) {
        setLogoPreview(barangayInfoService.getLogoUrl(updated.logo) + '?t=' + Date.now());
      } else {
        setLogoPreview('');
      }
      setEditing(false);
      setLogoFile(null);
    } catch (err) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  if (loading || !info) return <div className="barangay-info-page"><div>Loading...</div></div>;

  const showLogo = logoPreview && !logoError;
  const showDefault = !showLogo;

  return (
    <div className="barangay-info-page">
      <div className="barangay-info-left">
        <div className="barangay-logo-container">
          {showLogo ? (
            <img src={logoPreview} alt="Barangay Logo" className="barangay-logo" onError={() => setLogoError(true)} />
          ) : (
            <div className="barangay-logo-placeholder">
              {getInitials(info.barangay) || <img src={defaultLogo} alt="Default Logo" style={{ width: '60%', opacity: 0.5 }} />}
            </div>
          )}
          {isAdmin && editing && (
            <label className="change-logo-link">
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
              Change Logo
            </label>
          )}
        </div>
        <div className="barangay-info-list">
          <div><b>Barangay</b><span>{info.barangay}</span></div>
          <div><b>Municipality</b><span>{info.municipality}</span></div>
          <div><b>Province</b><span>{info.province}</span></div>
          <div><b>Phone Number</b><span>{info.phoneNumber}</span></div>
          <div><b>Email</b><span>{info.emailAddress}</span></div>
        </div>
      </div>
      <div className="barangay-info-right">
        <div className="settings-header">
          <span className="settings-icon">⚙️</span> Settings
        </div>
        <form className="barangay-info-form" onSubmit={handleUpdate}>
          <label>Barangay
            <input name="barangay" value={info.barangay} onChange={handleChange} disabled={!isAdmin || !editing} />
          </label>
          <label>Municipality
            <input name="municipality" value={info.municipality} onChange={handleChange} disabled={!isAdmin || !editing} />
          </label>
          <label>Province
            <input name="province" value={info.province} onChange={handleChange} disabled={!isAdmin || !editing} />
          </label>
          <label>PhoneNumber
            <input name="phoneNumber" value={info.phoneNumber} onChange={handleChange} disabled={!isAdmin || !editing} />
          </label>
          <label>EmailAddress
            <input name="emailAddress" value={info.emailAddress} onChange={handleChange} disabled={!isAdmin || !editing} />
          </label>
          {isAdmin && (
            editing ? (
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Update</button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              </div>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleEdit}>Edit</button>
            )
          )}
        </form>
      </div>
    </div>
  );
};

export default BarangayInfo; 