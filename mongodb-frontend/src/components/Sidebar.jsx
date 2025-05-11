/**
 * Sidebar Component
 * 
 * A navigation sidebar component that provides links to different sections
 * of the application and handles user logout functionality.
 * 
 * Features:
 * - Navigation links to Dashboard and Data sections
 * - Expandable/collapsible submenu for Data section
 * - Active state highlighting based on current route
 * - Role indicator showing current user's permissions
 * - Logout functionality with toast notifications
 * - Responsive design
 * 
 * @module components/Sidebar
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaChartBar, FaDatabase, FaAngleRight, FaAngleDown, FaSignOutAlt, FaUser, FaUserShield } from 'react-icons/fa';
import { logoutUser } from '../App';
import { showToast } from '../utils/toast';

/**
 * Sidebar navigation component for the Barangay Management System
 * 
 * @returns {JSX.Element} Rendered Sidebar component
 */
const Sidebar = ({ setIsAuthenticated }) => {
  // State to track user role
  const [userRole, setUserRole] = useState('user');
  
  // Hooks for navigation and location tracking
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get user role from localStorage
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    try {
      logoutUser(navigate, setIsAuthenticated);
    } catch (error) {
      console.error('Error during logout:', error);
      showToast.error('Error logging out');
      window.location.href = '/login';
    }
  };

  return (
    <div className="sidebar">
      {/* Header with application name */}
      <div className="sidebar-header">
        <h3>BRM SYSTEM</h3>
      </div>
      
      {/* User role indicator */}
      <div className="user-role">
        {userRole === 'admin' ? (
          <>
            <FaUserShield className="role-icon admin" />
            <span className="role-text admin">Admin</span>
          </>
        ) : (
          <>
            <FaUser className="role-icon user" />
            <span className="role-text user">Regular User</span>
          </>
        )}
      </div>
      
      {/* Navigation menu with links */}
      <div className="sidebar-menu">
        {/* Dashboard link */}
        <Link 
          to="/dashboard"
          className={`sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          <FaChartBar className="sidebar-icon" />
          <span>Dashboard</span>
        </Link>
        
        {/* Residents link */}
        <Link 
          to="/residents"
          className={`sidebar-item ${location.pathname === '/residents' ? 'active' : ''}`}
        >
          <FaDatabase className="sidebar-icon" />
          <span>Residents</span>
        </Link>

        {/* Logout button */}
        <div className="sidebar-item logout" onClick={handleLogout}>
          <FaSignOutAlt className="sidebar-icon" />
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 