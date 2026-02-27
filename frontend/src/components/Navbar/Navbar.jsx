import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User } from 'lucide-react';
import './Navbar.css';
import logo from '../../assets/logo.png';

const Navbar = () => {
    const { user, userData, openAuthModal } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">
                    <img src={logo} alt="Stuverse Logo" className="logo-img" />
                    <span className="logo-text">Stuverse</span>
                </Link>
            </div>
            <div className="navbar-links">
                <div className="nav-pill">
                    <Link to="/communities">Communities</Link>
                    <Link to="/events">Events</Link>
                    <Link to="/mentorship">Mentorship</Link>
                    <Link to="/about">About</Link>
                </div>
            </div>
            <div className="navbar-auth">
                {user ? (
                    <Link to="/profile" className="profile-link">
                        <div className="profile-icon-wrapper">
                            <span className="user-initials">
                                {userData?.username ? userData.username[0].toUpperCase() : 'U'}
                            </span>
                        </div>
                    </Link>
                ) : (
                    <>
                        <button onClick={() => openAuthModal('login')} className="login-link-btn">Log-in</button>
                        <button onClick={() => openAuthModal('signup')} className="join-btn-nav">Join Now</button>
                        <button onClick={() => openAuthModal('login', true)} className="profile-link-btn">
                            <div className="profile-icon-wrapper guest">
                                <span className="user-initials">P</span>
                            </div>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
