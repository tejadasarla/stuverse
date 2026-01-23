import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="layout-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Content Area */}
            <div className="content-area" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
