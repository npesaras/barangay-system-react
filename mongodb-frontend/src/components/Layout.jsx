import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, setIsAuthenticated, userRole }) => {
  return (
    <div className="app-layout">
      <Sidebar setIsAuthenticated={setIsAuthenticated} userRole={userRole} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout; 