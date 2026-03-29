import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, ArrowRight, Star } from 'lucide-react';
import { db } from '../../firebase.config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './Home.css';

// Import local assets
import heroStudents from '../../assets/hero-students.png';

const Home = () => {
    const navigate = useNavigate();
    const { user, userData, openAuthModal } = useAuth();
    const [topCommunities, setTopCommunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const q = query(
                    collection(db, 'communities'),
                    orderBy('memberCount', 'desc'),
                    limit(4)
                );
                const snapshot = await getDocs(q);
                const communities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTopCommunities(communities);
            } catch (err) {
                console.error("Error fetching popular tribes:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPopular();
    }, []);

    const handleJoinClick = (e, communityId) => {
        e.stopPropagation();
        if (!user) {
            openAuthModal('login');
        } else {
            navigate(`/communities/${communityId}`);
        }
    };

    return (
        <div className="home-container">

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    {user && (
                        <div className="welcome-badge" onClick={() => navigate('/profile')}>
                            <div className="welcome-avatar">
                                {userData?.username ? userData.username[0].toUpperCase() : 'U'}
                            </div>
                            <span className="welcome-text">Welcome back, {userData?.username || 'Student'}!</span>
                        </div>
                    )}
                    <h1 className="hero-title">Connect with your Cult</h1>
                    <p className="hero-subtitle">
                        The ultimate community platform for students to connect with like-minded peers,
                        form study groups, and build lifelong friendships based on shared passions.
                    </p>
                    <div className="hero-actions">
                        {!user ? (
                            <button className="get-started-btn" onClick={() => openAuthModal('signup')}>
                                Get Started <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button className="get-started-btn" onClick={() => navigate('/profile')}>
                                My Dashboard <User size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="hero-images">
                    <div className="hero-card card-1">
                        <img src={heroStudents} alt="Students studying" />
                    </div>
                    <div className="hero-card card-2">
                        <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=600&auto=format&fit=crop" alt="Students laughing" />
                    </div>
                </div>

                <div className="hero-bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>
            </section>

            {/* Middle Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>More than just a platform</h2>
                    <p>We believe that college life is better when you're connected. Our mission is to bridge the gap between students across different campuses with similar interests.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon blue">
                            <i className="fas fa-users"></i>
                        </div>
                        <h3>Connect Instantly</h3>
                        <p>Find students who share your major, interests, or hobbies. Filter by campus, year, or passion.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon purple">
                            <i className="fas fa-rocket"></i>
                        </div>
                        <h3>Spark Collaboration</h3>
                        <p>Launch projects, start study groups, or organize hackathons with tools built for teamwork.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon dark-blue">
                            <i className="fas fa-heart"></i>
                        </div>
                        <h3>Belong Anywhere</h3>
                        <p>Whether you're a freshman or a senior, find a welcoming community that feels like home.</p>
                    </div>
                </div>
            </section>

            {/* Communities Section */}
            <section className="communities-section">
                <div className="communities-header">
                    <div className="header-left">
                        <span className="label">DISCOVER TRIBES</span>
                        <h2>Popular Communities</h2>
                    </div>
                    <button onClick={() => navigate('/communities')} className="view-all" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', color: '#0045ff', fontWeight: 'bold' }}>
                        View all communities &rarr;
                    </button>
                </div>

                {loading ? (
                    <div className="loading-grid">
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"></div>)}
                    </div>
                ) : (
                    <div className="communities-grid">
                        {topCommunities.map((comm) => (
                            <div key={comm.id} className="community-card" onClick={() => navigate(`/communities/${comm.id}`)}>
                                <div className="card-image">
                                    <img src={comm.banner || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop'} alt={comm.name} />
                                    <span className="member-count">{comm.memberCount || 0} Members</span>
                                </div>
                                <div className="card-content">
                                    <div className="card-top">
                                        <img 
                                            src={comm.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(comm.name)}&background=random`} 
                                            alt={comm.name} 
                                            className="community-icon" 
                                        />
                                        <h3>{comm.name}</h3>
                                    </div>
                                    <p>{comm.description?.substring(0, 100)}{comm.description?.length > 100 ? '...' : ''}</p>
                                    <div className="card-footer">
                                        <div className="comm-badge">
                                            <Star size={14} fill="#ffb800" color="#ffb800" />
                                            <span>Popular</span>
                                        </div>
                                        <button className="join-link" onClick={(e) => handleJoinClick(e, comm.id)}>
                                            {user && comm.members?.includes(user.uid) ? 'View' : 'Join'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};


export default Home;
