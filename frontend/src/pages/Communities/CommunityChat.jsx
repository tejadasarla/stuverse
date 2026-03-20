import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase.config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, where, deleteDoc, increment } from 'firebase/firestore';
import { Send, ArrowLeft, Hash, Users, Image as ImageIcon, Smile, Bell, MoreVertical, Plus, Trash2, UserMinus, LogOut, Info } from 'lucide-react';
import './CommunityChat.css';

// Community Chat Component


const CommunityChat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userData, refreshUserData } = useAuth();

    const [groups, setGroups] = useState([]);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [activeGroup, setActiveGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [showMembers, setShowMembers] = useState(false);
    const [communityMembers, setCommunityMembers] = useState([]);
    const [currentCommunity, setCurrentCommunity] = useState({ name: 'Loading...', icon: '' });
    const messagesEndRef = useRef(null);

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    const isJoined = userData?.communities?.includes(id) || currentCommunity?.adminId === user?.uid;

    // 1. Fetch community details
    useEffect(() => {
        if (!id) return;
        const unsub = onSnapshot(doc(db, 'communities', id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCurrentCommunity({
                    id: docSnap.id,
                    ...data,
                    icon: data.banner || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
                });
            } else {
                console.error("Community not found:", id);
                navigate('/communities');
            }
        });
        return () => unsub();
    }, [id, navigate]);

    // 2. Fetch groups and handle auto-migration
    useEffect(() => {
        if (!id || !currentCommunity?.id) return;

        const groupsRef = collection(db, 'communities', id, 'groups');
        const q = query(groupsRef, orderBy('createdAt', 'asc'));

        const unsub = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                // Check if the current user is the admin
                const isAdmin = currentCommunity.adminId === user?.uid;
                
                if (isAdmin) {
                    console.log("Groups empty. Auto-initializing default channels...");
                    try {
                        // Use a specific check to avoid race conditions with multiple snapshots
                        await addDoc(groupsRef, {
                            name: "📢 Announcements",
                            type: "announcements",
                            description: "Official updates from the admins.",
                            createdAt: serverTimestamp()
                        });
                        await addDoc(groupsRef, {
                            name: "💬 General",
                            type: "chat",
                            description: "General discussion for everyone.",
                            createdAt: serverTimestamp()
                        });
                        console.log("Default channels created successfully.");
                    } catch (err) {
                        console.error("Critical error during auto-migration:", err);
                    }
                } else {
                    setGroups([]);
                }
            } else {
                const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setGroups(groupsData);
                
                if (groupsData.length > 0) {
                    // Set default active group if none selected
                    if (!activeGroupId || !groupsData.find(g => g.id === activeGroupId)) {
                        setActiveGroupId(groupsData[0].id);
                    }
                }
            }
        });

        return () => unsub();
    }, [id, currentCommunity?.id, currentCommunity?.adminId, user?.uid, activeGroupId]);

    // 3. Update active group object when groups or activeGroupId changes
    useEffect(() => {
        if (activeGroupId && groups.length > 0) {
            const group = groups.find(g => g.id === activeGroupId);
            if (group) setActiveGroup(group);
        }
    }, [activeGroupId, groups]);

    // 4. Self-healing admin permissions
    useEffect(() => {
        if (!id || !user || !currentCommunity?.id || !currentCommunity?.adminId) return;
        
        const primeAdmin = async () => {
            // If user is admin but not in the members array, force add them to fix permissions
            if (currentCommunity.adminId === user.uid && (!currentCommunity.members || !currentCommunity.members.includes(user.uid))) {
                console.log("Admin detected but not in members array. Fixing permissions...");
                try {
                    const commRef = doc(db, 'communities', id);
                    await updateDoc(commRef, {
                        members: arrayUnion(user.uid),
                        memberCount: increment(1)
                    });
                    console.log("Admin permissions primed successfully.");
                } catch (err) {
                    console.error("Failed to prime admin permissions:", err);
                }
            }
        };
        primeAdmin();
    }, [id, user, currentCommunity.id, currentCommunity.adminId, currentCommunity.members]);

    // 4. Fetch members
    useEffect(() => {
        if (!id) return;
        
        // Use a more robust check: both explicit member documents and the community's admin
        const q = query(collection(db, 'users'), where('communities', 'array-contains', id));
        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedMembers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Safety: Ensure the admin is ALWAYS in the member list even if their doc isn't indexed yet
            if (currentCommunity?.adminId && !fetchedMembers.find(m => m.id === currentCommunity.adminId)) {
                fetchedMembers.push({
                    id: currentCommunity.adminId,
                    username: currentCommunity.adminName || 'Admin',
                    photoURL: currentCommunity.adminPhoto || '',
                    isAdmin: true
                });
            }
            
            setCommunityMembers(fetchedMembers);
        }, (err) => console.error("Error fetching members:", err));
        
        return () => unsub();
    }, [id, currentCommunity?.adminId, currentCommunity?.adminName, currentCommunity?.adminPhoto]);

    // 5. Fetch joined communities sidebar list
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const syncSidebar = async () => {
            // Include both user-joined and currently viewed community
            const ids = [...(userData?.communities || [])];
            if (id && !ids.includes(id)) ids.push(id);

            if (ids.length > 0) {
                const q = query(collection(db, 'communities'), where('__name__', 'in', ids.slice(0, 30)));
                return onSnapshot(q, (snapshot) => {
                    const comms = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        icon: doc.data().banner || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.data().name)}&background=random`
                    }));
                    setJoinedCommunities(comms);
                });
            } else {
                setJoinedCommunities([]);
            }
        };

        const unsub = syncSidebar();
        return () => { if (typeof unsub === 'function') unsub(); };
    }, [user, userData?.communities, id, navigate]);

    // 6. Fetch messages for the active group
    useEffect(() => {
        if (!id || !activeGroupId || !user) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, 'communities', id, 'groups', activeGroupId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setMessages([{
                    id: 'welcome',
                    text: `Welcome to ${activeGroup?.name || 'this group'}!`,
                    userId: 'admin',
                    username: 'System',
                    createdAt: Date.now()
                }]);
            } else {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMessages(msgs);
            }
            setTimeout(scrollToBottom, 50);
        }, (error) => {
            console.error("Firestore message error:", error);
        });

        return () => unsubscribe();
    }, [id, activeGroupId, user, activeGroup?.name]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleJoinClick = async () => {
        if (!user) {
            alert("Please log in to join.");
            return;
        }
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { communities: arrayUnion(id) });
            
            const commRef = doc(db, 'communities', id);
            await updateDoc(commRef, { 
                members: arrayUnion(user.uid),
                memberCount: (currentCommunity.memberCount || 0) + 1
            });

            await refreshUserData();
            alert(`Welcome to ${currentCommunity.name}!`);
        } catch (error) {
            console.error("Error joining:", error);
            alert("Failed to join.");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !activeGroupId) return;

        // Restriction for announcement groups
        if (activeGroup?.type === 'announcements' && currentCommunity.adminId !== user.uid) {
            alert("Only admins can post in announcements.");
            return;
        }

        const messageText = newMessage.trim();
        setNewMessage('');

        try {
            await addDoc(collection(db, 'communities', id, 'groups', activeGroupId, 'messages'), {
                text: messageText,
                userId: user.uid,
                username: userData?.username || 'User',
                userPhoto: userData?.photoURL || '',
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error.message);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const [showMenu, setShowMenu] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLeaveCommunity = async () => {
        if (!window.confirm("Are you sure you want to leave this community?")) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { 
                communities: userData.communities.filter(c => c !== id) 
            });
            const commRef = doc(db, 'communities', id);
            await updateDoc(commRef, { 
                members: currentCommunity.members.filter(m => m !== user.uid),
                memberCount: (currentCommunity.memberCount || 1) - 1
            });
            await refreshUserData();
            navigate('/communities');
        } catch (error) {
            console.error("Error leaving:", error);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Remove this student from the community?")) return;
        try {
            const memberRef = doc(db, 'users', memberId);
            // We need to fetch the member's data to get their communities
            // Or just use arrayRemove if we are confident.
            // But since we can't easily modify other user's docs without a function or admin SDK,
            // we'll focus on the community side first. 
            // In a real app, you'd use a Cloud Function.
            // For now, let's update the community document.
            const commRef = doc(db, 'communities', id);
            await updateDoc(commRef, { 
                members: currentCommunity.members.filter(m => m !== memberId),
                memberCount: (currentCommunity.memberCount || 1) - 1
            });
            alert("Student removed from community.");
        } catch (error) {
            console.error("Error removing member:", error);
        }
    };

    const handleDeleteCommunity = async () => {
        if (!window.confirm("CRITICAL: This will permanently delete this community. This action cannot be undone. Proceed?")) return;
        setIsDeleting(true);
        try {
            // 1. Update current user's local state and doc so they don't try to access it
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { 
                communities: userData.communities.filter(c => c !== id) 
            });

            // 2. Delete the community document
            await deleteDoc(doc(db, 'communities', id)); 
            
            // 3. Clear local auth state if needed
            await refreshUserData();
            
            navigate('/communities');
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete community. You might not have permission.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim() || !id) return;

        setIsCreatingGroup(true);
        try {
            console.log("Attempting to create group in community:", id);
            const groupsRef = collection(db, 'communities', id, 'groups');
            await addDoc(groupsRef, {
                name: newGroupName.trim(),
                description: newGroupDesc.trim(),
                type: 'chat',
                createdAt: serverTimestamp(),
                createdBy: user.uid
            });
            setIsGroupModalOpen(false);
            setNewGroupName('');
            setNewGroupDesc('');
        } catch (error) {
            console.error("Error creating group:", error);
            if (error.code === 'permission-denied') {
                alert("Permission Denied: Please ensure you have applied the required Firestore Security Rules in your Firebase Console. If you just applied them, wait 30 seconds and try again.");
            } else {
                alert(`Failed to create group: ${error.message}`);
            }
        } finally {
            setIsCreatingGroup(false);
        }
    };

    return (
        <div className="chat-layout">
            {/* Sidebar 1: Communities (Icon List) */}
            <div className="chat-sidebar communities-sidebar">
                <div className="sidebar-header">
                    <button className="back-btn" onClick={() => navigate('/communities')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2>My Hubs</h2>
                </div>

                <div className="sidebar-channels">
                    {joinedCommunities.length === 0 ? (
                        <p className="no-hubs">No communities yet.</p>
                    ) : (
                        joinedCommunities.map(comm => (
                            <div
                                key={comm.id}
                                className={`sidebar-item ${comm.id === id ? 'active' : ''}`}
                                onClick={() => navigate(`/communities/${comm.id}`)}
                                title={comm.name}
                            >
                                <img src={comm.icon} alt={comm.name} className="sidebar-item-icon" />
                                <span className="sidebar-item-name">{comm.name}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="sidebar-user">
                    <div className="user-mini-avatar">
                        {userData?.photoURL ? (
                            <img src={userData.photoURL} alt="Profile" />
                        ) : (
                            <span>{userData?.username ? userData.username[0].toUpperCase() : 'U'}</span>
                        )}
                    </div>
                    <div className="user-mini-info">
                        <span className="user-mini-name">{userData?.username || 'User'}</span>
                    </div>
                </div>
            </div>

            {/* Sidebar 2: Groups (Channel List) */}
            <div className="groups-sidebar">
                <div className="groups-header">
                    <h3>{currentCommunity.name}</h3>
                    {currentCommunity.adminId === user?.uid && (
                        <button className="add-group-btn" title="Create Group" onClick={() => setIsGroupModalOpen(true)}>
                            <Plus size={18} />
                        </button>
                    )}
                </div>
                
                <div className="groups-list">
                    <div className="groups-section">
                        <span className="section-title">CHANNELS</span>
                        {groups.map(group => (
                            <button 
                                key={group.id} 
                                className={`group-item ${activeGroupId === group.id ? 'active' : ''}`}
                                onClick={() => setActiveGroupId(group.id)}
                            >
                                {group.type === 'announcements' ? <Bell size={18} className="group-icon" /> : <Hash size={18} className="group-icon" />}
                                <span className="group-name">{group.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {/* Chat Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <button className="mobile-only-back" onClick={() => navigate('/communities')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="header-text-box">
                            <h2>{activeGroup?.name || 'Select a group'}</h2>
                            {activeGroup?.description && (
                                <p className="header-subtext">{activeGroup.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        <button className="header-btn">
                            <Bell size={20} />
                        </button>
                        <button className={`header-btn ${showMembers ? 'active' : ''}`} onClick={() => setShowMembers(!showMembers)}>
                            <Users size={20} />
                        </button>
                        <div className="menu-container">
                            <button className="header-btn" onClick={() => setShowMenu(!showMenu)}>
                                <MoreVertical size={20} />
                            </button>
                            {showMenu && (
                                <div className="header-dropdown">
                                    <button onClick={() => { setIsInfoModalOpen(true); setShowMenu(false); }}>
                                        <Info size={16} /> Community Info
                                    </button>
                                    {currentCommunity.adminId === user?.uid ? (
                                        <button className="delete-option" onClick={() => { handleDeleteCommunity(); setShowMenu(false); }}>
                                            <Trash2 size={16} /> Delete Community
                                        </button>
                                    ) : (
                                        <button className="leave-option" onClick={() => { handleLeaveCommunity(); setShowMenu(false); }}>
                                            <LogOut size={16} /> Leave Community
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Feed */}
                <div className="chat-messages">
                    <div className="chat-welcome">
                        <div className="welcome-icon">
                            <Hash size={40} />
                        </div>
                        <h2>Welcome to {activeGroup?.name || currentCommunity.name || 'the community'}!</h2>
                        <p>{activeGroup?.description || "This is the start of the conversation. Send a message to get things started!"}</p>
                    </div>

                    {messages.map((msg, index) => {
                        const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId;

                        return (
                            <div key={msg.id} className={`message-row ${showAvatar ? 'first' : 'consecutive'}`}>
                                {showAvatar ? (
                                    <div className="msg-avatar">
                                        {msg.userPhoto ? (
                                            <img src={msg.userPhoto} alt={msg.username} />
                                        ) : (
                                            <span>{msg.username ? msg.username[0].toUpperCase() : 'U'}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="msg-avatar-spacer">
                                        <span className="msg-hover-time">{formatTime(msg.createdAt)}</span>
                                    </div>
                                )}

                                <div className="msg-content-wrapper">
                                    {showAvatar && (
                                        <div className="msg-header">
                                            <span className="msg-username">{msg.username} {msg.userId === user?.uid && <span className="you-label">(You)</span>}</span>
                                            {msg.userId === currentCommunity.adminId && (
                                                <span className="admin-badge">Admin</span>
                                            )}
                                            <span className="msg-time">{formatTime(msg.createdAt)}</span>
                                        </div>
                                    )}
                                    <div className="msg-text">
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="chat-input-container">
                    {isJoined ? (
                        <>
                            {(activeGroup?.type === 'announcements' && currentCommunity.adminId !== user.uid) ? (
                                <div className="announcement-only-notice">
                                    Only admins can post in this group.
                                </div>
                            ) : (
                                <form className="discord-input-form" onSubmit={handleSendMessage}>
                                    <div className="discord-input-inner">
                                        <button type="button" className="action-btn">
                                            <Smile size={22} />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder={`Message ${activeGroup?.name || '...'}`}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className={`send-action-btn ${newMessage.trim() ? 'active' : ''}`}
                                            disabled={!newMessage.trim()}
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    ) : (
                        <div className="join-prompt-bar">
                            <h3>Preview Mode Activated</h3>
                            <button className="discord-join-btn" onClick={handleJoinClick}>
                                Join {currentCommunity.name} to participate
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Members Sidebar (Toggleable) */}
            {showMembers && (
                <div className="chat-members-sidebar">
                    <div className="members-header">
                        <h3>Members — {communityMembers.length}</h3>
                    </div>
                    <div className="members-list-content">
                        {communityMembers.map(member => (
                            <div key={member.id} className="member-card" onClick={() => navigate(`/profile/${member.id}`)}>
                                <div className="member-avatar">
                                    {member.photoURL ? (
                                        <img src={member.photoURL} alt={member.username} />
                                    ) : (
                                        <span>{member.username ? member.username[0].toUpperCase() : 'U'}</span>
                                    )}
                                </div>
                                <div className="member-info">
                                    <div className="member-name-row">
                                        <span className="member-name">{member.username || 'Student User'}</span>
                                        {member.id === currentCommunity.adminId && (
                                            <span className="admin-badge mini">Admin</span>
                                        )}
                                    </div>
                                    <span className="member-status">Student</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {isGroupModalOpen && (
                <div className="modal-overlay" onClick={() => setIsGroupModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Group</h2>
                            <button className="close-btn" onClick={() => setIsGroupModalOpen(false)}>
                                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="create-comm-form">
                            <div className="form-group">
                                <label>Group Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Study Materials, Off-topic"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea 
                                    placeholder="What's this group for?"
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                />
                            </div>
                            <div className="form-footer">
                                <button type="button" className="cancel-btn" onClick={() => setIsGroupModalOpen(false)}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={isCreatingGroup}>
                                    {isCreatingGroup ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Community Info Modal (Management) */}
            {isInfoModalOpen && (
                <div className="modal-overlay" onClick={() => setIsInfoModalOpen(false)}>
                    <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Community Info</h2>
                            <button className="close-btn" onClick={() => setIsInfoModalOpen(false)}>
                                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>
                        <div className="info-body">
                            <div className="info-hero">
                                <div className="info-avatar">
                                    <img src={currentCommunity.icon} alt={currentCommunity.name} />
                                </div>
                                <h3>{currentCommunity.name}</h3>
                                <p>{currentCommunity.description || "No description provided."}</p>
                            </div>

                            <div className="info-section">
                                <div className="section-header">
                                    <h4>{communityMembers.length} Members</h4>
                                </div>
                                <div className="member-management-list">
                                    {communityMembers.map(member => (
                                        <div key={member.id} className="mgmt-member-card">
                                            <div className="member-brief">
                                                <div className="mini-avatar">
                                                    {member.photoURL ? (
                                                        <img src={member.photoURL} alt={member.username} />
                                                    ) : (
                                                        <span>{member.username ? member.username[0].toUpperCase() : 'U'}</span>
                                                    )}
                                                </div>
                                                <span className="mgmt-name">{member.username}</span>
                                                {member.id === currentCommunity.adminId && <span className="admin-chip">Admin</span>}
                                            </div>
                                            {currentCommunity.adminId === user?.uid && member.id !== user?.uid && (
                                                <button className="remove-btn" onClick={() => handleRemoveMember(member.id)}>
                                                    <UserMinus size={16} /> Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="info-actions">
                                {currentCommunity.adminId === user?.uid ? (
                                    <button className="danger-btn" onClick={handleDeleteCommunity} disabled={isDeleting}>
                                        <Trash2 size={20} /> {isDeleting ? 'Deleting...' : 'Delete Community'}
                                    </button>
                                ) : (
                                    <button className="danger-btn outline" onClick={handleLeaveCommunity}>
                                        <LogOut size={20} /> Leave Community
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityChat;

