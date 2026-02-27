import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthModal from '../../components/AuthModal/AuthModal';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
    const { authModal, closeAuthModal } = useAuth();

    return (
        <div className="layout-container" style={{ minWidth: '100%', minHeight: '100vh' }}>
            <Outlet />
            <AuthModal
                isOpen={authModal.isOpen}
                onClose={closeAuthModal}
                initialMode={authModal.mode}
                triggerRestricted={authModal.restricted}
            />
        </div>
    );
};

export default Layout;
