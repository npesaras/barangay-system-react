import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { showToast } from '../utils/toast';

const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AccountSettings = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', phoneNumber: '' });
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${backendBase}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUser(res.data.user);
      setForm({
        username: res.data.user.username || '',
        email: res.data.user.email || '',
        phoneNumber: res.data.user.phoneNumber || ''
      });
      if (res.data.user.profileImage) {
        let imgPath = res.data.user.profileImage;
        // If the path is already absolute or starts with /uploads, use as is
        if (imgPath.startsWith('http')) {
          setPreview(imgPath);
        } else if (imgPath.startsWith('/uploads')) {
          setPreview(`${backendBase.replace('/api', '')}${imgPath}`);
        } else {
          // Assume it's just a filename
          setPreview(`${backendBase.replace('/api', '')}/uploads/account-pictures/${imgPath}`);
        }
      } else {
        setPreview('');
      }
    } catch (err) {
      showToast.error('Failed to fetch account info');
    }
  };

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = e => {
    const file = e.target.files[0];
    setProfileImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('email', form.email);
      formData.append('phoneNumber', form.phoneNumber);
      if (profileImage instanceof File) {
        formData.append('profileImage', profileImage);
      }
      const res = await fetch(`${backendBase}/auth/update`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Account updated');
        fetchUser();
      } else {
        showToast.error(data.message || 'Failed to update account');
      }
    } catch (err) {
      showToast.error('Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async e => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${backendBase}/auth/password`, {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast.success('Password updated');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div className="account-settings-page" style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '2rem' }}>
      <h2 style={{ marginBottom: 24 }}>Account Settings</h2>
      <form onSubmit={handleUpdate} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: '#f3f3f3', border: '2px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {preview && !imgError ? (
              <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
            ) : (
              <img src="/profile-placeholder.png" alt="Placeholder" style={{ width: '70%', opacity: 0.5 }} />
            )}
          </div>
          <label style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 500 }}>
            Change Photo
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
          </label>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Username</label>
          <input name="username" value={form.username} onChange={handleInput} required style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleInput} type="email" style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Phone Number</label>
          <input name="phoneNumber" value={form.phoneNumber} onChange={handleInput} style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ddd' }} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 10 }}>Update Account</button>
      </form>
      <form onSubmit={handlePassword}>
        <h3 style={{ marginBottom: 16 }}>Change Password</h3>
        <div style={{ marginBottom: 14 }}>
          <label>Old Password</label>
          <input name="oldPassword" value={passwords.oldPassword} onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })} type="password" required style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>New Password</label>
          <input name="newPassword" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} type="password" required style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Confirm New Password</label>
          <input name="confirmPassword" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} type="password" required style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ddd' }} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>Change Password</button>
      </form>
    </div>
  );
};

export default AccountSettings; 