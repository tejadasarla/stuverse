import React, { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, query, where, onSnapshot, getDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, SquarePlus } from 'lucide-react';
import DirectChat from './DirectChat';
import './Messages.css';

const Messages = () => {
    const { user } = useAuth();
    const { chatId } = useParams();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        // Query chats where user is a participant, sorted by newest message first
        const q = query(
            collection(db, 'direct_chats'),
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageTime', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chatPromises = snapshot.docs.map(async (chatDoc) => {
                const data = chatDoc.data();
                
                // If the chat is cleared, we Skip processing it for the list
                if (data.isCleared) {
                    return null;
                }

                const otherUserId = data.participants.find(id => id !== user.uid);
                
                // Fetch other user profile
                let otherUserData = { username: 'Student' };
                if (otherUserId) {
                    const userSnap = await getDoc(doc(db, 'users', otherUserId));
                    if (userSnap.exists()) otherUserData = { id: otherUserId, ...userSnap.data() };
                }

                return {
                    id: chatDoc.id,
                    otherUser: otherUserData,
                    lastMessage: data.lastMessage || 'Sent a message',
                    lastMessageTime: data.lastMessageTime,
                    unreadCount: data[`unreadCount_${user.uid}`] || 0,
                    otherUserId
                };
            });

            const resolvedChats = (await Promise.all(chatPromises)).filter(chat => chat !== null);
            setChats(resolvedChats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (!user) {
        return <div className="messages-empty">Please login to see your messages.</div>;
    }

    return (
        <div className={`messages-page ${chatId ? 'chat-active' : ''}`}>
            {/* Left Sidebar: Conversations List */}
            <div className="messages-sidebar">
                <header className="sidebar-header">
                    <h1>{user.displayName || 'Messages'}</h1>
                    <button 
                        className="new-chat-btn" 
                        onClick={() => navigate('/search')}
                        title="New Chat"
                    >
                        <SquarePlus size={24} />
                    </button>
                </header>

                {loading ? (
                    <div className="msg-loading">Loading chats...</div>
                ) : chats.length === 0 ? (
                    <div className="msg-empty-state">
                        <MessageCircle size={48} />
                        <h3>No messages yet</h3>
                        <p>Start a conversation from a student's profile.</p>
                        <button onClick={() => navigate('/search')}>Find people</button>
                    </div>
                ) : (
                    <div className="chats-list">
                        {chats.map(chat => (
                            <div 
                                key={chat.id} 
                                className={`chat-card ${chatId === chat.id ? 'active' : ''}`} 
                                onClick={() => navigate(`/messages/${chat.id}`)}
                            >
                                <div className="chat-avatar">
                                    {chat.otherUser.photoURL ? (
                                        <img src={chat.otherUser.photoURL} alt={chat.otherUser.username} />
                                    ) : (
                                        <span>{chat.otherUser.username?.[0].toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="chat-info">
                                    <h3>{chat.otherUser.username}</h3>
                                    {chat.unreadCount > 0 && (
                                        <span className="unread-badge">{chat.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Content: Active Chat or Placeholder */}
            <div className="messages-content">
                {chatId ? (
                    <DirectChat />
                ) : (
                    <div className="no-chat-selected">
                        <div className="no-chat-selected-icon">
                            <MessageCircle size={48} />
                        </div>
                        <h2>Your Messages</h2>
                        <p>Send private photos and messages to a friend or group.</p>
                        <button onClick={() => navigate('/search')}>Send Message</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
