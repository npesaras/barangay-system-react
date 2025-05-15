/**
 * Login Component
 * 
 * This component handles user authentication including login and user registration.
 * It provides a login form for existing users and a registration modal for creating
 * new accounts with role selection (admin or regular user).
 * 
 * Features:
 * - User login with username/password
 * - Role-based registration (admin/user)
 * - Form validation
 * - Toast notifications for success/error feedback
 * - Navigation to dashboard on successful login
 * 
 * @module components/Login
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { showToast } from '../utils/toast';
import './Login.css'; // We'll create this file next
import { barangayInfoService } from '../services/barangayInfoService';

const defaultLogo = '/logo-placeholder.png';
function getInitials(name) {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length === 1) return words[0][0]?.toUpperCase() || '';
}

/**
 * Login component for user authentication
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onLoginSuccess - Callback function to execute after successful login
 * @returns {JSX.Element} Rendered Login component
 */
const Login = ({ onLoginSuccess }) => {
  // State for login credentials
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  // State for registration modal visibility
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // State for registration form data
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Default role is user
    adminCode: ''
  });
  
  const [brgyInfo, setBrgyInfo] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [loadingBrgy, setLoadingBrgy] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInfo() {
      setLoadingBrgy(true);
      try {
        const data = await barangayInfoService.getInfo();
        setBrgyInfo(data);
        if (data.logo) {
          setLogoUrl(barangayInfoService.getLogoUrl() + '?t=' + Date.now());
        } else {
          setLogoUrl('');
        }
        setLogoError(false);
      } catch {
        setBrgyInfo(null);
        setLogoUrl('');
        setLogoError(false);
      } finally {
        setLoadingBrgy(false);
      }
    }
    fetchInfo();
  }, []);

  /**
   * Handles changes to login form input fields
   * 
   * @param {Object} e - Event object from input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handles changes to registration form input fields
   * 
   * @param {Object} e - Event object from input change
   */
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handles login form submission
   * Authenticates user and stores token in localStorage on success
   * 
   * @async
   * @param {Object} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        showToast.success('Login successful');
        onLoginSuccess();
        navigate('/dashboard');
      } else {
        showToast.error('Login failed - No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast.error(error.response?.data?.message || 'Login failed');
    }
  };

  /**
   * Handles registration form submission
   * Validates passwords match and sends registration request
   * 
   * @async
   * @param {Object} e - Form submission event
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    // Validate password confirmation
    if (registerData.password !== registerData.confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    // Validate admin code if admin role is selected
    if (registerData.role === 'admin' && !registerData.adminCode) {
      showToast.error('Admin code is required for admin registration');
      return;
    }

    try {
      const endpoint = registerData.role === 'admin' ? '/auth/register-admin' : '/auth/register-user';
      const payload = {
        username: registerData.username,
        password: registerData.password,
        ...(registerData.role === 'admin' && { adminCode: registerData.adminCode })
      };

      const response = await api.post(endpoint, payload);
      
      if (response.data.message) {
        showToast.success(`${registerData.role === 'admin' ? 'Admin' : 'User'} registration successful`);
        setShowRegisterModal(false);
        setRegisterData({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'user',
          adminCode: ''
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="brgy-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          {loadingBrgy ? (
            <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                {logoUrl && !logoError ? (
                  <img
                    src={logoUrl}
                    alt="Barangay Logo"
                    style={{ width: 120, height: 120, borderRadius: '50%', border: '3px solid #5271ff', objectFit: 'contain', background: '#fff', display: 'block', margin: '0 auto' }}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: '50%', border: '3px dashed #5271ff', background: '#f1f5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5271ff', fontSize: 48, margin: '0 auto' }}>
                    {getInitials(brgyInfo?.barangay) || <img src={defaultLogo} alt="Default Logo" style={{ width: '60%', opacity: 0.5 }} />}
                  </div>
                )}
              </div>
              <div className="brgy-text" style={{ textAlign: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: '#1976d2', letterSpacing: 1 }}>{brgyInfo?.barangay || 'Barangay'}</h1>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: '#444' }}>{brgyInfo ? `${brgyInfo.municipality}, ${brgyInfo.province}` : ''}</h2>
              </div>
            </>
          )}
        </div>
        <div className="login-form-container">
          <div className="login-form">
            <form onSubmit={handleSubmit} style={{ marginTop: 0 }}>
              <div className="form-group">
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
              </div>
              <button type="submit" className="login-btn">
                Login
              </button>
            </form>
            <div className="form-footer">
              <button 
                className="create-account"
                onClick={() => setShowRegisterModal(true)}
              >
                Create new account
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRegisterModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Register Account</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="Password"
                  required
                  minLength="6"
                />
                <small>Password must be at least 6 characters</small>
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Confirm Password"
                  required
                />
              </div>
              <div className="form-group">
                <select
                  name="role"
                  value={registerData.role}
                  onChange={handleRegisterChange}
                  className="role-select"
                >
                  <option value="user">Regular User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {registerData.role === 'admin' && (
                <div className="form-group">
                  <input
                    type="password"
                    name="adminCode"
                    value={registerData.adminCode}
                    onChange={handleRegisterChange}
                    placeholder="Admin Registration Code"
                    required
                  />
                  <small>Contact system administrator for the registration code</small>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login; 