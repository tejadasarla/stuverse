import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase.config';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, query, orderBy, increment } from 'firebase/firestore';
import CreateCommunityModal from './CreateCommunityModal';
import { Plus, Users, Shield, PlusCircle, LayoutDashboard, Globe, LogOut, X, School } from 'lucide-react';
import './Communities.css';

// Sub-component to fetch admin name dynamically
const AdminName = ({ adminId, initialName, currentUserId }) => {
    const [name, setName] = useState(initialName);

    useEffect(() => {
        if (!adminId || adminId === currentUserId) return;
        
        // Listen to the admin's user document for real-time name updates
        const unsub = onSnapshot(doc(db, 'users', adminId), (docSnap) => {
            if (docSnap.exists()) {
                setName(docSnap.data().username || initialName);
            }
        });
        return () => unsub();
    }, [adminId, currentUserId, initialName]);

    return <strong>{adminId === currentUserId ? 'you' : name}</strong>;
};

const Communities = () => {
    const { user, userData, refreshUserData } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const collegeParam = searchParams.get('college');

    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'joined', 'my'

    useEffect(() => {
        const q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const comms = snapshot.docs.map(doc => {
                const data = doc.data();
                const isMember = userData?.communities?.includes(doc.id);
                const isAdmin = data.adminId === user?.uid;
                return {
                    id: doc.id,
                    ...data,
                    joined: isMember || isAdmin
                };
            });
            setCommunities(comms);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching communities:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData, user]);

    const handleLeaveCommunity = async (id, name) => {
        if (!window.confirm(`Are you sure you want to leave the "${name}" community?`)) return;

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                communities: arrayRemove(id)
            });

            const commRef = doc(db, 'communities', id);
            await updateDoc(commRef, {
                memberCount: increment(-1),
                members: arrayRemove(user.uid)
            });

            await refreshUserData();
            alert(`Success: You have left "${name}".`);
        } catch (error) {
            console.error("Error leaving community:", error);
            alert(`Failed to leave: ${error.message}. If this is your tribe, you must delete it instead.`);
        }
    };

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
        if (!c.id) return false;

        // Apply URL College Filter first
        if (collegeParam && c.college !== collegeParam) return false;

        if (filter === 'joined') {
            const isJoined = userData?.communities?.includes(c.id);
            const isAdminMember = c.admins?.includes(user?.uid) || c.adminId === user?.uid;
            return isJoined || isAdminMember;
        }
        if (filter === 'my') {
            return c.admins?.includes(user?.uid) || c.adminId === user?.uid;
        }
        return true;
    });

    const clearCollegeFilter = () => {
        setSearchParams({});
    };

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
                {collegeParam && (
                    <div className="active-filter-banner">
                        <div className="filter-info">
                            <School size={20} />
                            <span>Showing communities for: <strong>{collegeParam}</strong></span>
                        </div>
                        <button className="clear-filter-btn" onClick={clearCollegeFilter}>
                            <X size={16} /> Clear Filter
                        </button>
                    </div>
                )}

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
                                            <Shield size={14} /> Created by <AdminName adminId={community.adminId} initialName={community.adminName} currentUserId={user?.uid} />
                                        </span>
                                    </div>

                                    <div className="comm-actions">
                                        {(community.joined || community.adminId === user?.uid) ? (
                                            <>
                                                <button 
                                                    className="comm-join-btn joined"
                                                    onClick={() => navigate(`/communities/${community.id}`)}
                                                >
                                                    Open Chat
                                                </button>
                                                {community.adminId !== user?.uid && (
                                                    <button 
                                                        className="leave-btn-card"
                                                        onClick={() => handleLeaveCommunity(community.id, community.name)}
                                                        title="Leave Community"
                                                    >
                                                        <LogOut size={18} />
                                                    </button>
                                                )}
                                            </>
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


