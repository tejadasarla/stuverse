import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">Stuverse</Link>
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
                <Link to="/login" className="login-link">Log-in</Link>
                <Link to="/signup" className="join-btn">Join Now</Link>
            </div>
        </nav>
    );
};

export default Navbar;
