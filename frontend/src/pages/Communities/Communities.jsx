import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase.config';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, query, orderBy } from 'firebase/firestore';
import CreateCommunityModal from './CreateCommunityModal';
import { Plus, Users, Shield, PlusCircle, LayoutDashboard, Globe } from 'lucide-react';
import './Communities.css';

const Communities = () => {
    const { user, userData, refreshUserData } = useAuth();
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'joined', 'my'

    useEffect(() => {
        const q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const comms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                joined: userData?.communities?.includes(doc.id) || false
            }));
            setCommunities(comms);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching communities:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData]);

    const handleJoinToggle = async (id) => {
        if (!user) {
            alert("Please log in to join communities!");
            return;
        }

        const community = communities.find(c => c.id === id);
        const isJoining = !community?.joined;

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                communities: isJoining ? arrayUnion(id) : arrayRemove(id)
            });

            // Update member count in the community document (optional, but good for display)
            const commRef = doc(db, 'communities', id);
            await updateDoc(commRef, {
                memberCount: isJoining ? (community.memberCount || 0) + 1 : Math.max(0, (community.memberCount || 1) - 1),
                members: isJoining ? arrayUnion(user.uid) : arrayRemove(user.uid)
            });

            await refreshUserData();

            if (isJoining) {
                navigate(`/communities/${id}`);
            }
        } catch (error) {
            console.error("Error joining community:", error);
            alert("Failed to join community. Please try again.");
        }
    };

    const filteredCommunities = communities.filter(c => {
        if (!c.id) return false; // Extra safety
        if (filter === 'joined') return userData?.communities?.includes(c.id);
        if (filter === 'my') return c.adminId === user?.uid;
        return true;
    });

    return (
        <div className="communities-page">
            <header className="communities-hero">
                <h1>Explore Inter-College Communities</h1>
                <p>Connect with student tribes across different institutions and start collaborating globally.</p>
                
                {user && (
                    <div className="header-actions">
                        <button className="create-btn-main" onClick={() => setIsModalOpen(true)}>
                            <PlusCircle size={20} />
                            Create Community
                        </button>
                    </div>
                )}
            </header>

            <main className="communities-container">
                <div className="communities-nav">
                    <button 
                        className={`nav-btn ${filter === 'all' ? 'active' : ''}`} 
                        onClick={() => setFilter('all')}
                    >
                        <Globe size={18} /> All Communities
                    </button>
                    <button 
                        className={`nav-btn ${filter === 'joined' ? 'active' : ''}`} 
                        onClick={() => setFilter('joined')}
                    >
                        <Users size={18} /> My Hubs
                    </button>
                    <button 
                        className={`nav-btn ${filter === 'my' ? 'active' : ''}`} 
                        onClick={() => setFilter('my')}
                    >
                        <Shield size={18} /> Managed by Me
                    </button>
                </div>

                {loading ? (
                    <div className="comm-loading">
                        <div className="loader"></div>
                        <p>Loading Tribes...</p>
                    </div>
                ) : filteredCommunities.length === 0 ? (
                    <div className="no-communities">
                        <Users size={48} />
                        <h3>No communities found</h3>
                        <p>Be the first to create a tribe in this category!</p>
                        {user && (
                            <button className="create-btn-sub" onClick={() => setIsModalOpen(true)}>
                                Create Community
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="comm-grid">
                        {filteredCommunities.map((community) => (
                            <div key={community.id} className="comm-card">
                                <div className="comm-banner">
                                    <img src={community.banner} alt={community.name} />
                                    <div className="comm-category">{community.category}</div>
                                </div>

                                <div className="comm-info">
                                    <div className="comm-header">
                                        <h3 className="comm-name">{community.name}</h3>
                                        <span className="comm-members">
                                            <Users size={14} /> {community.memberCount || 0} Members
                                        </span>
                                    </div>

                                    <p className="comm-desc">{community.description}</p>

                                    <div className="comm-meta">
                                        <span className="comm-admin">
                                            <Shield size={14} /> Created by <strong>{community.adminId === user?.uid ? 'you' : community.adminName}</strong>
                                        </span>
                                    </div>

                                    <div className="comm-actions">
                                        {(community.joined || community.adminId === user?.uid) ? (
                                            <button 
                                                className="comm-join-btn joined"
                                                onClick={() => navigate(`/communities/${community.id}`)}
                                            >
                                                Open Chat
                                            </button>
                                        ) : (
                                            <button 
                                                className="comm-join-btn"
                                                onClick={() => handleJoinToggle(community.id)}
                                            >
                                                Join Community
                                            </button>
                                        )}
                                        
                                        {community.adminId === user?.uid && (
                                            <button 
                                                className="manage-btn"
                                                onClick={() => navigate(`/communities/${community.id}`)}
                                                title="Manage Community"
                                            >
                                                <LayoutDashboard size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <CreateCommunityModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
};

export default Communities;


