import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    const handleJoinClick = () => {
        navigate('/communities');
    };

    return (
        <div className="home-container">
            <Navbar />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">Connect with your Cult</h1>
                    <p className="hero-subtitle">
                        The ultimate community platform for students to connect with like-minded peers,
                        form study groups, and build lifelong friendships based on shared passions.
                    </p>
                    <button className="get-started-btn" onClick={() => navigate('/signup')}>Get Started &rarr;</button>
                </div>

                <div className="hero-images">
                    <div className="hero-card card-1">
                        <img src="https://images.unsplash.com/photo-1523240715630-6e46307fa914?q=80&w=600&auto=format&fit=crop" alt="Students studying" />
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
                    <p>We believe that college life is better when you're connected. Our mission is to bridge the gap between students across campus with similar interests.</p>
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

                <div className="communities-grid">
                    <div className="community-card" onClick={() => navigate('/communities')}>
                        <div className="card-image">
                            <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400&auto=format&fit=crop" alt="Mind Flayers" />
                            <span className="member-count">1.2k Members</span>
                        </div>
                        <div className="card-content">
                            <div className="card-top">
                                <img src="https://ui-avatars.com/api/?name=MF&background=1a1a1a&color=fff" alt="icon" className="community-icon" />
                                <h3>Mind Flayers</h3>
                            </div>
                            <p>For developers, designers, and tech enthusiasts to share code.</p>
                            <div className="card-footer">
                                <button className="join-link" onClick={(e) => { e.stopPropagation(); navigate('/login'); }}>Join</button>
                            </div>
                        </div>
                    </div>

                    <div className="community-card" onClick={() => navigate('/communities')}>
                        <div className="card-image">
                            <img src="https://images.unsplash.com/photo-1544967082-d9d25d867d66?q=80&w=400&auto=format&fit=crop" alt="The Arts of an Artist" />
                            <span className="member-count">850 Members</span>
                        </div>
                        <div className="card-content">
                            <div className="card-top">
                                <img src="https://ui-avatars.com/api/?name=AA&background=f0c&color=fff" alt="icon" className="community-icon" />
                                <h3>The Arts of an Artist</h3>
                            </div>
                            <p>Painters, digital artists, and sculptors sharing their portfolio work.</p>
                            <div className="card-footer">
                                <button className="join-link" onClick={(e) => { e.stopPropagation(); navigate('/login'); }}>Join</button>
                            </div>
                        </div>
                    </div>

                    <div className="community-card" onClick={() => navigate('/communities')}>
                        <div className="card-image">
                            <img src="https://images.unsplash.com/photo-1491843384427-bc97b7677b67?q=80&w=400&auto=format&fit=crop" alt="Stranger Studies" />
                            <span className="member-count">3.4k Members</span>
                        </div>
                        <div className="card-content">
                            <div className="card-top">
                                <img src="https://ui-avatars.com/api/?name=SS&background=444&color=fff" alt="icon" className="community-icon" />
                                <h3>Stranger Studies</h3>
                            </div>
                            <p>Find study partners for exams, assignments, and research.</p>
                            <div className="card-footer">
                                <button className="join-link" onClick={(e) => { e.stopPropagation(); navigate('/login'); }}>Join</button>
                            </div>
                        </div>
                    </div>

                    <div className="community-card" onClick={() => navigate('/communities')}>
                        <div className="card-image">
                            <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&auto=format&fit=crop" alt="Vocalists" />
                            <span className="member-count">920 Members</span>
                        </div>
                        <div className="card-content">
                            <div className="card-top">
                                <img src="https://ui-avatars.com/api/?name=V&background=222&color=fff" alt="icon" className="community-icon" />
                                <h3>Vocalists</h3>
                            </div>
                            <p>Jam sessions, concert buddies, and music production talk.</p>
                            <div className="card-footer">
                                <button className="join-link" onClick={(e) => { e.stopPropagation(); navigate('/login'); }}>Join</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
