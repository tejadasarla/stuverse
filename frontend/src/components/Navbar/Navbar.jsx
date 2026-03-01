import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Search as SearchIcon } from 'lucide-react';
import './Navbar.css';
import logo from '../../assets/logo.png';

const Navbar = () => {
    const { user, userData, openAuthModal } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">
                    <img src={logo} alt="Stuverse Logo" className="logo-img" />
                    <span className="logo-text">Stuverse</span>
                </Link>
            </div>

            <div className="navbar-search">
                <form onSubmit={handleSearch}>
                    <div className="search-input-wrapper">
                        <SearchIcon className="search-icon-nav" size={22} />
                        <input
                            type="text"
                            placeholder="Search students, channels, events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </form>
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
