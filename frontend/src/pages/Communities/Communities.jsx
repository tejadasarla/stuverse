import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './Communities.css';

const Communities = () => {
    const [communities, setCommunities] = useState([
        {
            id: 1,
            name: "Mind Flayers",
            banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
            category: "Tech",
            members: "1.2k",
            admin: "Alex River",
            description: "A sanctuary for developers, designers, and tech enthusiasts to share code, collaborate on projects, and discuss the latest in tech.",
            joined: false
        },
        {
            id: 2,
            name: "The Art Collective",
            banner: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?q=80&w=800&auto=format&fit=crop",
            category: "Art",
            members: "850",
            admin: "Sarah Chen",
            description: "From digital art to classical sculpture, we celebrate all forms of creativity. Share your portfolio and get feedback.",
            joined: true
        },
        {
            id: 3,
            name: "Stranger Studies",
            banner: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
            category: "Coding",
            members: "3.4k",
            admin: "Dr. Martin",
            description: "Intense study sessions, research collaboration, and exam prep. Perfect for those looking to excel academically.",
            joined: false
        },
        {
            id: 4,
            name: "Startup Pulse",
            banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=800&auto=format&fit=crop",
            category: "Startup",
            members: "2.1k",
            admin: "Elena Vance",
            description: "Where founders meet. Discuss pitch decks, finding co-founders, and scaling your student startup.",
            joined: false
        },
        {
            id: 5,
            name: "Vocalists & Vibes",
            banner: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop",
            category: "Music",
            members: "1.5k",
            admin: "Jason Derulo",
            description: "A community for singers, songwriters, and music producers to jam and collaborate on new tracks.",
            joined: false
        },
        {
            id: 6,
            name: "Elite Athletes",
            banner: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop",
            category: "Sports",
            members: "5.6k",
            admin: "Coach K",
            description: "For varsity and intramural athletes. Training tips, game schedules, and sports psychology discussions.",
            joined: true
        }
    ]);

    const handleJoinToggle = (id) => {
        setCommunities(communities.map(c =>
            c.id === id ? { ...c, joined: !c.joined, members: c.joined ? (parseFloat(c.members) - 0.1).toFixed(1) + 'k' : (parseFloat(c.members) + 0.1).toFixed(1) + 'k' } : c
        ));
    };

    return (
        <div className="communities-page">
            <Navbar />

            <header className="communities-hero">
                <h1>Explore Communities</h1>
                <p>Find your tribe and start collaborating with peers who share your passions.</p>
            </header>

            <main className="communities-container">
                <div className="comm-grid">
                    {communities.map((community) => (
                        <div key={community.id} className="comm-card">
                            <div className="comm-banner">
                                <img src={community.banner} alt={community.name} />
                                <div className="comm-category">{community.category}</div>
                            </div>

                            <div className="comm-info">
                                <div className="comm-header">
                                    <h3 className="comm-name">{community.name}</h3>
                                    <span className="comm-members">
                                        <i className="fas fa-users"></i> {community.members} Members
                                    </span>
                                </div>

                                <p className="comm-desc">{community.description}</p>

                                <div className="comm-meta">
                                    <span className="comm-admin">
                                        <i className="fas fa-user-shield"></i> Created by <strong>{community.admin}</strong>
                                    </span>
                                </div>

                                <div className="comm-actions">
                                    <button
                                        className={`comm-join-btn ${community.joined ? 'joined' : ''}`}
                                        onClick={() => handleJoinToggle(community.id)}
                                    >
                                        {community.joined ? 'Joined' : 'Join Community'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Communities;
