import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase.config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Search as SearchIcon, Users, Calendar, Hash, ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import './Search.css';

const Search = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userData, user } = useAuth();
    const queryParams = new URLSearchParams(location.search);
    const initialQuery = queryParams.get('q') || '';

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [results, setResults] = useState({
        students: [],
        channels: [],
        events: []
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    // Mock data for channels and events since they are not in DB yet
    const mockChannels = [
        { id: 1, name: "Inter-College Tech Syndicate", category: "Tech", members: "1.2k" },
        { id: 2, name: "Global Student Art Collective", category: "Art", members: "850" },
        { id: 3, name: "Cross-Campus Coding Circle", category: "Coding", members: "3.4k" },
        { id: 4, name: "Inter-University Startup Pulse", category: "Startup", members: "2.1k" },
        { id: 5, name: "The Collegiate Vocalists", category: "Music", members: "1.5k" },
        { id: 6, name: "The Multi-Campus Athletics League", category: "Sports", members: "5.6k" }
    ];

    const mockEvents = [
        { id: 1, name: "Global Hackathon 2026", date: "April 15, 2026", location: "Virtual" },
        { id: 2, name: "Student Art Expo", date: "May 20, 2026", location: "New York Hub" },
        { id: 3, name: "Inter-College Cricket Cup", date: "June 10, 2026", location: "London Grounds" },
        { id: 4, name: "Tech Talk: Future of AI", date: "March 25, 2026", location: "Zoom" }
    ];

    useEffect(() => {
        const fetchResults = async () => {
            if (!initialQuery.trim()) {
                setResults({ students: [], channels: [], events: [] });
                return;
            }

            setLoading(true);
            try {
                // 1. Search Students in Firestore
                let studentResults = [];
                if (user) {
                    const usersRef = collection(db, 'users');

                    // If user is logged in, only search students of the SAME YEAR
                    let q;
                    if (userData?.yearOfStudy) {
                        q = query(usersRef, where('yearOfStudy', '==', userData.yearOfStudy));
                    } else {
                        // If user doesn't have a year set yet, show all or restricted
                        q = query(usersRef);
                    }

                    const querySnapshot = await getDocs(q);
                    const students = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        // Simple client-side search for name/username, excluding self
                        if (doc.id !== user.uid &&
                            (data.username?.toLowerCase().includes(initialQuery.toLowerCase()) ||
                                data.email?.toLowerCase().includes(initialQuery.toLowerCase()))) {
                            students.push({ id: doc.id, ...data });
                        }
                    });
                    studentResults = students;
                }

                // 2. Search Channels (Mock)
                const channelResults = mockChannels.filter(c =>
                    c.name.toLowerCase().includes(initialQuery.toLowerCase()) ||
                    c.category.toLowerCase().includes(initialQuery.toLowerCase())
                );

                // 3. Search Events (Mock)
                const eventResults = mockEvents.filter(e =>
                    e.name.toLowerCase().includes(initialQuery.toLowerCase()) ||
                    e.location.toLowerCase().includes(initialQuery.toLowerCase())
                );

                setResults({
                    students: studentResults,
                    channels: channelResults,
                    events: eventResults
                });
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
        setSearchQuery(initialQuery);
    }, [initialQuery, userData, user]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const renderStudents = () => (
        <div className="search-section">
            <div className="section-title">
                <Users size={20} />
                <h2>Students {userData?.yearOfStudy && <span className="year-badge">{userData.yearOfStudy}</span>}</h2>
            </div>
            {!user ? (
                <div className="login-prompt">
                    <p>Log in to discover and connect with students from your year.</p>
                    <button onClick={() => navigate('/login')} className="mini-login-btn">Log In</button>
                </div>
            ) : (
                <div className="results-grid">
                    {results.students.length > 0 ? (
                        results.students.map(student => (
                            <div key={student.id} className="result-card student-card">
                                <div className="student-avatar" style={{ border: '2px solid #6a11cb' }}>
                                    {student.photoURL ? (
                                        <img src={student.photoURL} alt={student.username} />
                                    ) : (
                                        <span>{student.username ? student.username[0].toUpperCase() : 'U'}</span>
                                    )}
                                </div>
                                <div className="result-info">
                                    <h3>{student.username}</h3>
                                    <p>{student.collegeName || 'Student member'}</p>
                                    <div className="result-meta">
                                        <span>{student.branch || 'General'}</span>
                                    </div>
                                </div>
                                <button className="view-profile-btn" onClick={() => navigate(`/profile/${student.id}`)}>
                                    View <ArrowRight size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="no-results">No students found matching your year and query.</p>
                    )}
                </div>
            )}
        </div>
    );

    const renderChannels = () => (
        <div className="search-section">
            <div className="section-title">
                <Hash size={20} />
                <h2>Channels & Communities</h2>
            </div>
            <div className="results-grid">
                {results.channels.length > 0 ? (
                    results.channels.map(channel => (
                        <div key={channel.id} className="result-card channel-card">
                            <div className="channel-icon">
                                <Hash size={24} />
                            </div>
                            <div className="result-info">
                                <h3>{channel.name}</h3>
                                <p>{channel.category}</p>
                                <div className="result-meta">
                                    <span>{channel.members} Members</span>
                                </div>
                            </div>
                            <button className="join-btn-small" onClick={() => navigate('/communities')}>
                                Visit
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="no-results">No channels found matching your search.</p>
                )}
            </div>
        </div>
    );

    const renderEvents = () => (
        <div className="search-section">
            <div className="section-title">
                <Calendar size={20} />
                <h2>Events</h2>
            </div>
            <div className="results-grid">
                {results.events.length > 0 ? (
                    results.events.map(event => (
                        <div key={event.id} className="result-card event-card">
                            <div className="event-date-box">
                                <span className="date-icon"><Calendar size={20} /></span>
                            </div>
                            <div className="result-info">
                                <h3>{event.name}</h3>
                                <p>{event.date}</p>
                                <div className="result-meta">
                                    <span>{event.location}</span>
                                </div>
                            </div>
                            <button className="view-event-btn">
                                Details
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="no-results">No upcoming events found.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="search-page">
            <Navbar />

            <div className="search-header-bg">
                <div className="search-container">
                    <form onSubmit={handleSearchSubmit} className="main-search-form">
                        <SearchIcon className="main-search-icon" size={24} />
                        <input
                            type="text"
                            placeholder="Search for something awesome..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <button type="submit">Search</button>
                    </form>

                    <div className="search-tabs">
                        <button
                            className={activeTab === 'all' ? 'active' : ''}
                            onClick={() => setActiveTab('all')}
                        >
                            All Results
                        </button>
                        <button
                            className={activeTab === 'students' ? 'active' : ''}
                            onClick={() => setActiveTab('students')}
                        >
                            Students
                        </button>
                        <button
                            className={activeTab === 'channels' ? 'active' : ''}
                            onClick={() => setActiveTab('channels')}
                        >
                            Channels
                        </button>
                        <button
                            className={activeTab === 'events' ? 'active' : ''}
                            onClick={() => setActiveTab('events')}
                        >
                            Events
                        </button>
                    </div>
                </div>
            </div>

            <main className="search-results-container">
                {loading ? (
                    <div className="search-loading">
                        <div className="loader-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <p>Hunting down results...</p>
                    </div>
                ) : (
                    <div className="results-wrapper">
                        {initialQuery ? (
                            <>
                                {(activeTab === 'all' || activeTab === 'students') && renderStudents()}
                                {(activeTab === 'all' || activeTab === 'channels') && renderChannels()}
                                {(activeTab === 'all' || activeTab === 'events') && renderEvents()}
                            </>
                        ) : (
                            <div className="empty-search-state">
                                <div className="empty-icon">
                                    <SearchIcon size={64} />
                                </div>
                                <h2>Ready to explore?</h2>
                                <p>Search for students from your year, trending channels, or upcoming events.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Search;
