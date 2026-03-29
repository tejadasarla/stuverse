import React, { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, query, where, onSnapshot, getDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, ArrowRight } from 'lucide-react';
import './Messages.css';

const MessageList = () => {
    const { user } = useAuth();
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
                const otherUserId = data.participants.find(id => id !== user.uid);
                
                // Fetch other user profile
                let otherUserData = { username: 'Student' };
                if (otherUserId) {
                    const userSnap = await getDoc(doc(db, 'users', otherUserId));
                    if (userSnap.exists()) otherUserData = userSnap.data();
                }

                return {
                    id: chatDoc.id,
                    otherUser: otherUserData,
                    lastMessage: data.lastMessage || 'Sent a message',
                    lastMessageTime: data.lastMessageTime,
                    otherUserId
                };
            });

            const resolvedChats = await Promise.all(chatPromises);
            setChats(resolvedChats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);


    if (!user) {
        return <div className="messages-empty">Please login to see your messages.</div>;
    }

    return (
        <div className="messages-page">
            <div className="messages-container">
                <header className="msg-list-header">
                    <h1>My Conversations</h1>
                    <p>Connect personally with fellow students</p>
                </header>

                {loading ? (
                    <div className="msg-loading">Loading your vibes...</div>
                ) : chats.length === 0 ? (
                    <div className="msg-empty-state">
                        <MessageSquare size={64} />
                        <h3>No messages yet</h3>
                        <p>Find students in communities or via search to start a private chat!</p>
                        <button onClick={() => navigate('/search')}>Search Students</button>
                    </div>
                ) : (
                    <div className="chats-list">
                        {chats.map(chat => (
                            <div 
                                key={chat.id} 
                                className="chat-card" 
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
                                    <p className="college-info-mini">{chat.otherUser.collegeName || 'Student member'}</p>
                                    <p className="last-msg-preview">{chat.lastMessage}</p>
                                </div>

                                <ArrowRight className="chat-arrow" size={18} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageList;
