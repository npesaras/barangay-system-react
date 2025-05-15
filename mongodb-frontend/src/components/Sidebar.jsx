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
import { Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { FaChartBar, FaDatabase, FaAngleRight, FaAngleDown, FaSignOutAlt, FaUser, FaUserShield, FaFileExport } from 'react-icons/fa';
import { logoutUser } from '../App';
import { showToast } from '../utils/toast';

/**
 * Sidebar navigation component for the Barangay Management System
 * 
 * @returns {JSX.Element} Rendered Sidebar component
 */
const Sidebar = ({ setIsAuthenticated, userRole: userRoleProp }) => {
  // State to track user role
  const [userRole, setUserRole] = useState(userRoleProp || 'user');
  
  // Hooks for navigation and location tracking
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Use prop if available, otherwise fallback to localStorage
    if (userRoleProp) {
      setUserRole(userRoleProp);
    } else {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) {
        setUserRole(storedRole);
      }
    }
  }, [location.pathname, userRoleProp]);

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
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="sidebar-header">
        <h3>BRM SYSTEM</h3>
      </div>
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
      <ul className="sidebar-menu" style={{ flex: 1 }}>
        <li>
          <NavLink to="/barangay-info" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}> 
            <FaUserShield className="sidebar-icon" />
            <span>Barangay Info</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}> 
            <FaChartBar className="sidebar-icon" />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/residents" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}> 
            <FaDatabase className="sidebar-icon" />
            <span>Residents</span>
          </NavLink>
        </li>
        <li>
          {userRole === 'admin' ? (
            <NavLink to="/document-approval" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}> 
              <FaFileExport className="sidebar-icon" />
              <span>Document Approval</span>
            </NavLink>
          ) : (
            <NavLink to="/request-clearance" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}> 
              <FaFileExport className="sidebar-icon" />
              <span>Request Clearance</span>
            </NavLink>
          )}
        </li>
        <li>
          {userRole === 'admin' ? (
            <NavLink to="/blotter-requests" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}> 
              <FaFileExport className="sidebar-icon" />
              <span>Blotter Requests</span>
            </NavLink>
          ) : (
            <NavLink to="/blotter" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}> 
              <FaFileExport className="sidebar-icon" />
              <span>Blotter</span>
            </NavLink>
          )}
        </li>
        <li>
          <NavLink to="/account" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <FaUser className="sidebar-icon" />
            <span>Account Settings</span>
          </NavLink>
        </li>
      </ul>
      <button className="sidebar-item logout" onClick={handleLogout} style={{ width: '100%' }}>
        <FaSignOutAlt className="sidebar-icon" />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar; 