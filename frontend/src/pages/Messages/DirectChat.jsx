import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase.config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Send, User, MoreVertical, MessageSquare } from 'lucide-react';
import './DirectChat.css';

const DirectChat = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // 1. Resolve Other User info
    useEffect(() => {
        if (!chatId || !user) return;
        
        const otherUserId = chatId.split('_').find(id => id !== user.uid);
        if (!otherUserId) {
            navigate('/search');
            return;
        }

        const fetchOtherUser = async () => {
            try {
                const userSnap = await getDoc(doc(db, 'users', otherUserId));
                if (userSnap.exists()) {
                    setOtherUser({ id: otherUserId, ...userSnap.data() });
                }
            } catch (err) {
                console.error("Error fetching chat partner:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOtherUser();
    }, [chatId, user, navigate]);

    // 2. Stream Messages
    useEffect(() => {
        if (!chatId) return;

        const q = query(
            collection(db, 'direct_chats', chatId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => unsubscribe();
    }, [chatId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !chatId) return;

        const text = newMessage.trim();
        setNewMessage('');

        try {
            const otherUserId = chatId.split('_').find(id => id !== user.uid);
            const chatRef = doc(db, 'direct_chats', chatId);
            
            // Sync Inbox metadata
            await setDoc(chatRef, {
                participants: [user.uid, otherUserId],
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                [`lastRead_${user.uid}`]: serverTimestamp()
            }, { merge: true });

            // Add the real message
            await addDoc(collection(db, 'direct_chats', chatId, 'messages'), {
                text,
                senderId: user.uid,
                senderName: userData?.username || 'User',
                createdAt: serverTimestamp()
            });
        } catch (err) {

            console.error("Send error:", err);
            alert("Failed to send message. Please check your internet or Firebase permissions.");
        }

    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="dc-loading">Establishing Secure Connection...</div>;

    return (
        <div className="direct-chat-container">
            <header className="dc-header">
                <button className="dc-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <div className="dc-user-info" onClick={() => navigate(`/profile/${otherUser?.id}`)}>
                    <div className="dc-avatar">
                        {otherUser?.photoURL ? (
                            <img src={otherUser.photoURL} alt={otherUser.username} />
                        ) : (
                            <span>{otherUser?.username?.[0].toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <h3>{otherUser?.username || 'Student'}</h3>
                        <p>Active now</p>
                    </div>
                </div>
                <button className="dc-more"><MoreVertical size={20} /></button>
            </header>

            <div className="dc-messages">
                {messages.length === 0 ? (
                    <div className="dc-start">
                        <div className="dc-start-icon">
                            <MessageSquare size={32} />
                        </div>
                        <h3>Secure Channel Started</h3>
                        <p>Say hello to <strong>{otherUser?.username}</strong>! Your messages are encrypted and private.</p>
                    </div>
                ) : (
                    messages.map((msg) => (

                        <div key={msg.id} className={`dc-msg-row ${msg.senderId === user.uid ? 'is-me' : 'is-them'}`}>
                            <div className="dc-bubble">
                                <p>{msg.text}</p>
                                <span className="dc-time">{formatTime(msg.createdAt)}</span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="dc-input-area" onSubmit={handleSendMessage}>
                <input 
                    type="text" 
                    placeholder="Message student..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default DirectChat;
