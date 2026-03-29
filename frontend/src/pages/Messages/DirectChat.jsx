import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase.config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, deleteDoc, getDocs, writeBatch, increment } from 'firebase/firestore';
import { ArrowLeft, Send, User, MoreVertical, MessageCircle, Image, Heart, Info, Trash2, MoreHorizontal, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
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
    const [showOptions, setShowOptions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const emojiPickerRef = useRef(null);

    // 1. Resolve Other User info
    useEffect(() => {
        if (!chatId || !user) return;
        
        const otherUserId = chatId.split('_').find(id => id !== user.uid);
        if (!otherUserId) {
            navigate('/messages');
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
            
            // Mark as read when messages load/update while we are viewing
            if (chatId && user) {
                const chatRef = doc(db, 'direct_chats', chatId);
                setDoc(chatRef, {
                    [`unreadCount_${user.uid}`]: 0,
                    [`lastRead_${user.uid}`]: serverTimestamp()
                }, { merge: true }).catch(err => console.error("Error marking read:", err));
            }
            
            // Scroll to bottom
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => unsubscribe();
    }, [chatId, user]);

    // 3. Click outside logic for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

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
                [`lastRead_${user.uid}`]: serverTimestamp(),
                [`unreadCount_${otherUserId}`]: increment(1), // Increment for receiver
                isCleared: false // Reset visibility in inbox
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
        }
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Unsend this message? It will be removed for everyone.")) return;
        
        try {
            setDeletingId(msgId);
            await deleteDoc(doc(db, 'direct_chats', chatId, 'messages', msgId));
            
            // If this was the last message, we might want to update the lastMessage in the chat doc
            // For simplicity in this demo, we'll just delete it.
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to unsend message");
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearChat = async () => {
        if (!window.confirm("Clear all messages in this chat? This cannot be undone.")) return;
        
        try {
            setShowOptions(false);
            const messagesRef = collection(db, 'direct_chats', chatId, 'messages');
            const snapshot = await getDocs(messagesRef);
            
            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();

            // Update last message
            const chatRef = doc(db, 'direct_chats', chatId);
            await setDoc(chatRef, {
                lastMessage: '',
                isCleared: true,
                lastMessageTime: serverTimestamp()
            }, { merge: true });

            alert("Chat cleared successfully");
        } catch (err) {
            console.error("Clear chat error:", err);
            alert("Failed to clear chat");
        }
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="dc-loading">Establishing Connection...</div>;

    return (
        <div className="direct-chat-container">
            <header className="dc-header">
                <button className="dc-back" onClick={() => navigate('/messages')}>
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
                    <h3>{otherUser?.username || 'Student'}</h3>
                </div>
                <div className="dc-header-actions">
                    <button className="dc-more" onClick={() => setShowOptions(!showOptions)}>
                        <MoreHorizontal size={24} />
                    </button>
                    {showOptions && (
                        <div className="dc-options-dropdown">
                            <button onClick={() => navigate(`/profile/${otherUser?.id}`)}>
                                <User size={16} /> View Profile
                            </button>
                            <button className="clear-chat-btn" onClick={handleClearChat}>
                                <Trash2 size={16} /> Clear Chat
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="dc-messages">
                <div className="dc-start">
                    <div className="dc-start-avatar">
                        {otherUser?.photoURL ? (
                            <img src={otherUser.photoURL} alt={otherUser.username} />
                        ) : (
                            <div className="dc-start-placeholder">
                                {otherUser?.username?.[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h3>{otherUser?.username}</h3>
                    <p>{otherUser?.collegeName || 'Stuverse Student'}</p>
                    <button onClick={() => navigate(`/profile/${otherUser?.id}`)}>View Profile</button>
                </div>

                {messages.map((msg) => (
                    <div key={msg.id} className={`dc-msg-row ${msg.senderId === user.uid ? 'is-me' : 'is-them'}`}>
                        <div className="dc-bubble-wrapper">
                            <div className="dc-bubble">
                                <p>{msg.text}</p>
                                <span className="dc-time">{formatTime(msg.createdAt)}</span>
                            </div>
                            {msg.senderId === user.uid && (
                                <button 
                                    className="unsend-btn" 
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    disabled={deletingId === msg.id}
                                    title="Unsend"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="dc-input-area" onSubmit={handleSendMessage}>
                <div className="dc-input-wrapper">
                    <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
                        <button 
                            type="button" 
                            className={`action-btn ${showEmojiPicker ? 'active' : ''}`}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile size={22} />
                        </button>
                        {showEmojiPicker && (
                            <div className="emoji-picker-container">
                                <EmojiPicker 
                                    onEmojiClick={onEmojiClick}
                                    width={320}
                                    height={400} 
                                    skinTonesDisabled
                                    searchDisabled={false}
                                />
                            </div>
                        )}
                    </div>
                    <input 
                        type="text" 
                        placeholder="Message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    {newMessage.trim() && (
                        <button type="submit">Send</button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default DirectChat;
