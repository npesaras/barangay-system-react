import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, setIsAuthenticated }) => {
  return (
    <div className="app-layout">
      <Sidebar setIsAuthenticated={setIsAuthenticated} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout; 