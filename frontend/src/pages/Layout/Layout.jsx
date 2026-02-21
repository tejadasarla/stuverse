import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="layout-container" style={{ minWidth: '100%', minHeight: '100vh' }}>
            <Outlet />
        </div>
    );
};

export default Layout;
