import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase.config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, where } from 'firebase/firestore';
import { Send, ArrowLeft, Hash, Users, Image as ImageIcon, Smile, Bell, MoreVertical } from 'lucide-react';
import './CommunityChat.css';

// Using the same mock communities data for resolving community info
const MOCK_COMMUNITIES = [
    { id: '1', name: "Inter-College Tech Syndicate", category: "Tech", icon: "https://ui-avatars.com/api/?name=MF&background=1a1a1a&color=fff" },
    { id: '2', name: "Global Student Art Collective", category: "Art", icon: "https://ui-avatars.com/api/?name=AA&background=f0c&color=fff" },
    { id: '3', name: "Cross-Campus Coding Circle", category: "Coding", icon: "https://ui-avatars.com/api/?name=SS&background=444&color=fff" },
    { id: '4', name: "Inter-University Startup Pulse", category: "Startup", icon: "https://ui-avatars.com/api/?name=SP&background=0045ff&color=fff" },
    { id: '5', name: "The Collegiate Vocalists", category: "Music", icon: "https://ui-avatars.com/api/?name=V&background=222&color=fff" },
    { id: '6', name: "The Multi-Campus Athletics League", category: "Sports", icon: "https://ui-avatars.com/api/?name=AL&background=e63946&color=fff" }
];

const CommunityChat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userData } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [showMembers, setShowMembers] = useState(false);
    const [communityMembers, setCommunityMembers] = useState([]);
    const messagesEndRef = useRef(null);

    const currentCommunity = MOCK_COMMUNITIES.find(c => c.id === id) || { name: 'Unknown Community', icon: '' };
    const { refreshUserData } = useAuth();
    const isJoined = userData?.communities?.includes(id);

    const generateMockMessages = () => [
        {
            id: 'mock1',
            text: `Welcome to ${currentCommunity.name}! Let's get the conversation started.`,
            userId: 'admin_id',
            username: 'Community Admin',
            createdAt: Date.now() - 3600000
        },
        {
            id: 'mock2',
            text: "Hi everyone! Glad to be here. Has anyone checked out the recent updates?",
            userId: 'user_1',
            username: 'Sarah Chen',
            userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
            createdAt: Date.now() - 3000000
        },
        {
            id: 'mock3',
            text: "Yes, looks amazing so far!",
            userId: user?.uid || 'me',
            username: userData?.username || 'Me',
            userPhoto: userData?.photoURL || '',
            createdAt: Date.now() - 2500000
        }
    ];

    useEffect(() => {
        if (!id) return;

        const q = query(collection(db, 'users'), where('communities', 'array-contains', id));
        const unsub = onSnapshot(q, (snapshot) => {
            const membersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setCommunityMembers(membersData);
        }, (err) => console.error("Error fetching members:", err));

        return () => unsub();
    }, [id]);

    const handleJoinClick = async () => {
        if (!user) {
            alert("Please log in to join.");
            return;
        }
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { communities: arrayUnion(id) });
            await refreshUserData();
            alert(`Welcome to ${currentCommunity.name}!`);
        } catch (error) {
            console.error("Error joining:", error);
            alert("Failed to join.");
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Setup joined communities sidebar list
        if (userData?.communities) {
            const joined = MOCK_COMMUNITIES.filter(c => userData.communities.includes(c.id));
            setJoinedCommunities(joined);
        }

        // Listen for messages from Firestore
        const q = query(
            collection(db, 'communities', id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const loadLocalMessages = () => {
            const saved = localStorage.getItem(`comm_msgs_${id}`);
            return saved ? JSON.parse(saved) : [];
        };

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const localMsgs = loadLocalMessages();
            const mocks = generateMockMessages();

            if (snapshot.empty) {
                setMessages([...mocks, ...localMsgs]);
            } else {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                const combined = [...mocks, ...msgs, ...localMsgs].reduce((acc, current) => {
                    const x = acc.find(item => item.id === current.id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                // Sort by createdAt safely
                const sorted = combined.sort((a, b) => {
                    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : a.createdAt;
                    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : b.createdAt;
                    return timeA - timeB;
                });
                setMessages(sorted);
            }
            setTimeout(scrollToBottom, 50);
        }, (error) => {
            console.error("Firestore error:", error);
            setMessages([...generateMockMessages(), ...loadLocalMessages()]);
        });

        return () => unsubscribe();
    }, [id, user, userData, navigate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !user) return;

        const messageText = newMessage.trim();
        setNewMessage('');

        const tempMsg = {
            id: 'local-' + Date.now(),
            text: messageText,
            userId: user.uid,
            username: userData?.username || 'User',
            userPhoto: userData?.photoURL || '',
            createdAt: Date.now()
        };

        // Cache in local storage so it persists if Firebase writes are blocked
        const saved = localStorage.getItem(`comm_msgs_${id}`);
        const localMsgs = saved ? JSON.parse(saved) : [];
        localMsgs.push(tempMsg);
        localStorage.setItem(`comm_msgs_${id}`, JSON.stringify(localMsgs));

        // Optimistic UI append
        setMessages(prev => [...prev, tempMsg]);
        setTimeout(scrollToBottom, 50);

        try {
            await addDoc(collection(db, 'communities', id, 'messages'), {
                text: messageText,
                userId: user.uid,
                username: userData?.username || 'User',
                userPhoto: userData?.photoURL || '',
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message (requires Firestore rules setup):", error.message);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-layout">
            {/* Sidebar (Discord Style) */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <button className="back-btn" onClick={() => navigate('/communities')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2>My Hubs</h2>
                </div>

                <div className="sidebar-channels">
                    {joinedCommunities.length === 0 ? (
                        <p className="no-hubs">You haven't joined any communities yet.</p>
                    ) : (
                        joinedCommunities.map(comm => (
                            <div
                                key={comm.id}
                                className={`sidebar-item ${comm.id === id ? 'active' : ''}`}
                                onClick={() => navigate(`/communities/${comm.id}`)}
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

            {/* Main Chat Area */}
            <div className="chat-main">
                {/* Chat Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <button className="mobile-only-back" onClick={() => navigate('/communities')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="header-text-box">
                            <h2>{currentCommunity.name}</h2>
                            <p className="header-subtext">+ {joinedCommunities.length} Active Hubs</p>
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        <button className="header-btn">
                            <Bell size={20} />
                        </button>
                        <button className={`header-btn ${showMembers ? 'active' : ''}`} onClick={() => setShowMembers(!showMembers)}>
                            <Users size={20} />
                        </button>
                        <button className="header-btn">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {/* Messages Feed */}
                <div className="chat-messages">
                    <div className="chat-welcome">
                        <div className="welcome-icon">
                            <Hash size={40} />
                        </div>
                        <h2>Welcome to #{currentCommunity.name}!</h2>
                        <p>This is the start of the community chat. Say hi to the group!</p>
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
                                            <span className="msg-username">{msg.username}</span>
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
                        <form className="discord-input-form" onSubmit={handleSendMessage}>
                            <div className="discord-input-inner">
                                <button type="button" className="action-btn">
                                    <Smile size={22} />
                                </button>
                                <input
                                    type="text"
                                    placeholder={`Message #${currentCommunity.name}`}
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
                        <h3>Members — {communityMembers.length > 0 ? communityMembers.length : currentCommunity.members}</h3>
                    </div>
                    <div className="members-list-content">
                        {communityMembers.length > 0 ? (
                            communityMembers.map(member => (
                                <div key={member.id} className="member-card" onClick={() => navigate(`/profile/${member.id}`)}>
                                    <div className="member-avatar">
                                        {member.photoURL ? (
                                            <img src={member.photoURL} alt={member.username} />
                                        ) : (
                                            <span>{member.username ? member.username[0].toUpperCase() : 'U'}</span>
                                        )}
                                    </div>
                                    <div className="member-info">
                                        <span className="member-name">{member.username || 'Student User'}</span>
                                        <span className="member-status">Student</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                Be the first member!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityChat;

