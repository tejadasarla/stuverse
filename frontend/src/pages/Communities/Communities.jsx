import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase.config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import './Communities.css';

const Communities = () => {
    const { user, userData, refreshUserData } = useAuth();
    const [communities, setCommunities] = useState([
        {
            id: '1',
            name: "Inter-College Tech Syndicate",
            banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
            category: "Tech",
            members: "1.2k",
            admin: "Alex River",
            description: "A sanctuary for developers, designers, and tech enthusiasts across all colleges to share code and collaborate.",
            joined: false
        },
        {
            id: '2',
            name: "Global Student Art Collective",
            banner: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?q=80&w=800&auto=format&fit=crop",
            category: "Art",
            members: "850",
            admin: "Sarah Chen",
            description: "Uniting campus artists globally. From digital art to sculpture, share your portfolio and get cross-institution feedback.",
            joined: false
        },
        {
            id: '3',
            name: "Cross-Campus Coding Circle",
            banner: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
            category: "Coding",
            members: "3.4k",
            admin: "Dr. Martin",
            description: "Connect with study partners from different universities for research collaboration and exam prep.",
            joined: false
        },
        {
            id: '4',
            name: "Inter-University Startup Pulse",
            banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=800&auto=format&fit=crop",
            category: "Startup",
            members: "2.1k",
            admin: "Elena Vance",
            description: "Where student founders from all regions meet. Discuss pitch decks and scale your startup beyond your own campus.",
            joined: false
        },
        {
            id: '5',
            name: "The Collegiate Vocalists",
            banner: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop",
            category: "Music",
            members: "1.5k",
            admin: "Jason Derulo",
            description: "A community for singers and songwriters across colleges to jam and collaborate virtually.",
            joined: false
        },
        {
            id: '6',
            name: "The Multi-Campus Athletics League",
            banner: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop",
            category: "Sports",
            members: "5.6k",
            admin: "Coach K",
            description: "For varsity and intramural athletes to connect for inter-college tournaments and training tips.",
            joined: false
        }
    ]);

    useEffect(() => {
        if (userData?.communities) {
            setCommunities(prev => prev.map(c => ({
                ...c,
                joined: userData.communities.includes(c.id)
            })));
        }
    }, [userData]);

    const handleJoinToggle = async (id) => {
        if (!user) {
            alert("Please log in to join communities!");
            return;
        }

        const community = communities.find(c => c.id === id);
        const isJoining = !community.joined;

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                communities: isJoining ? arrayUnion(id) : arrayRemove(id)
            });

            // Optimistic update
            setCommunities(communities.map(c =>
                c.id === id ? { ...c, joined: isJoining, members: isJoining ? (parseFloat(c.members) + 0.1).toFixed(1) + 'k' : (parseFloat(c.members) - 0.1).toFixed(1) + 'k' } : c
            ));

            await refreshUserData();
        } catch (error) {
            console.error("Error joining community:", error);
            alert("Failed to join community. Please try again.");
        }
    };

    return (
        <div className="communities-page">
            <Navbar />

            <header className="communities-hero">
                <h1>Explore Inter-College Communities</h1>
                <p>Connect with student tribes across different institutions and start collaborating globally.</p>
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
