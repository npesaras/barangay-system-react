import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { ResidentsRecord } from './components/ResidentsRecord';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './components/Login';
import { showToast } from './utils/toast';
import DocumentApproval from './components/DocumentApproval';
import RequestClearance from './components/RequestClearance';
import Blotter from './components/Blotter';
import BlotterRecords from './components/BlotterRecords';
import BarangayInfo from './components/BarangayInfo';
import './App.css';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true; // Enable credentials for CORS

// Create axios instance with default config
export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  timeout: 10000 // 10 second timeout
});

// Global logout function
export const logoutUser = (navigate, setIsAuthenticated) => {
  try {
    // Cancel any pending requests
    if (axios.CancelToken) {
      const source = axios.CancelToken.source();
      source.cancel('Logout initiated');
    }
    
    // Clear all local storage
    localStorage.clear();
    
    // Clear axios defaults
    delete api.defaults.headers.common['Authorization'];
    
    // Update authentication state
    if (setIsAuthenticated) setIsAuthenticated(false);
    
    // Redirect to login page
    if (navigate) {
      navigate('/login');
    } else {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error during logout:', error);
    if (setIsAuthenticated) setIsAuthenticated(false);
    window.location.href = '/login';
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const navigate = useNavigate();

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor to add auth token
    const requestInterceptor = api.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    const responseInterceptor = api.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (error.response.status === 401) {
            showToast.error('Your session has expired. Please log in again.');
            logoutUser(navigate, setIsAuthenticated);
          } else {
            showToast.error(error.response.data?.message || 'An error occurred');
          }
        } else if (error.request) {
          // The request was made but no response was received
          showToast.error('No response from server. Please check your connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          showToast.error('Error setting up the request. Please try again.');
        }
        return Promise.reject(error);
      }
    );

    // Check authentication status
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (token) {
          await api.get('/auth/verify');
          setIsAuthenticated(true);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.clear();
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate, setIsAuthenticated]);

  // Update userRole after login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setUserRole(localStorage.getItem('userRole'));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={handleLoginSuccess} />
        } />
        
        <Route path="/dashboard" element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated} userRole={userRole}>
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </Layout>
          ) : <Navigate to="/login" />
        } />
        
        <Route path="/residents" element={
          isAuthenticated ? (
            <Layout setIsAuthenticated={setIsAuthenticated} userRole={userRole}>
              <ErrorBoundary>
                <ResidentsRecord />
              </ErrorBoundary>
            </Layout>
          ) : <Navigate to="/login" />
        } />
        
        <Route path="/document-approval" element={
          isAuthenticated && userRole === 'admin' ? (
            <Layout setIsAuthenticated={setIsAuthenticated} userRole={userRole}>
              <ErrorBoundary>
                <DocumentApproval />
              </ErrorBoundary>
            </Layout>
          ) : <Navigate to="/login" />
        } />
        
        <Route path="/request-clearance" element={
          isAuthenticated && userRole !== 'admin' ? (
            <Layout setIsAuthenticated={setIsAuthenticated} userRole={userRole}>
              <ErrorBoundary>
                <RequestClearance />
              </ErrorBoundary>
            </Layout>
          ) : <Navigate to="/login" />
        } />
        
        <Route path="/blotter" element={
          isAuthenticated && userRole !== 'admin' ? (
            <Layout setIsAuthenticated={setIsAuthenticated} userRole={userRole}>
              <ErrorBoundary>
                <Blotter />
              </ErrorBoundary>
            </Layout>
          ) : <Navigate to="/login" />
        } />
        
        <Route path="/blotter-requests" element={
          isAuthenticated && userRole === 'admin' ? (
            <Layout setIsAuthenticated={setIsAuthenticated} userRole={userRole}>
              <ErrorBoundary>
                <BlotterRecords />
              </ErrorBoundary>
            </Layout>
          ) : <Navigate to="/login" />
        } />
        
        <Route path="/barangay-info" element={<BarangayInfo isAdmin={userRole === 'admin'} />} />
        
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;