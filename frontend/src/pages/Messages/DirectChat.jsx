import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { db } from '../../firebase.config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, deleteDoc, getDocs, writeBatch, increment } from 'firebase/firestore';
import { ArrowLeft, Send, User, MoreVertical, MessageCircle, Image, Heart, Info, Trash2, MoreHorizontal, Smile, Phone, Video, History, Paperclip, File, Download, Loader2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { uploadFileToCloudinary } from '../../utils/imageUtils';
import CallHistoryPanel from '../../components/CallHistoryPanel/CallHistoryPanel';
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
    const [showCallHistory, setShowCallHistory] = useState(false);
    const emojiPickerRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const { initiateCall } = useCall();

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

    const handleSendMessage = async (e, mediaData = null) => {
        if (e) e.preventDefault();
        
        const text = newMessage.trim();
        if (!text && !mediaData) return;

        setNewMessage('');

        try {
            const otherUserId = chatId.split('_').find(id => id !== user.uid);
            const chatRef = doc(db, 'direct_chats', chatId);
            
            // Sync Inbox metadata
            await setDoc(chatRef, {
                participants: [user.uid, otherUserId],
                lastMessage: mediaData ? (mediaData.type.startsWith('image/') ? '📷 Photo' : mediaData.type.startsWith('video/') ? '🎥 Video' : '📁 Attachment') : text,
                lastMessageTime: serverTimestamp(),
                [`lastRead_${user.uid}`]: serverTimestamp(),
                [`unreadCount_${otherUserId}`]: increment(1),
                isCleared: false
            }, { merge: true });

            // Add the real message
            await addDoc(collection(db, 'direct_chats', chatId, 'messages'), {
                text: text || '',
                senderId: user.uid,
                senderName: userData?.username || 'User',
                createdAt: serverTimestamp(),
                ...(mediaData && {
                    fileUrl: mediaData.url,
                    fileType: mediaData.type,
                    fileName: mediaData.name
                })
            });
        } catch (err) {
            console.error("Send error:", err);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size limit (e.g., 50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert("File is too large. Max limit is 50MB.");
            return;
        }

        setIsUploading(true);
        try {
            const fileUrl = await uploadFileToCloudinary(file, `Chat/Individual Chats/${chatId}`);
            await handleSendMessage(null, {
                url: fileUrl,
                type: file.type,
                name: file.name
            });
        } catch (err) {
            console.error("File upload error:", err);
            alert("Failed to upload file.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
            
            const chatRef = doc(db, 'direct_chats', chatId);
            await setDoc(chatRef, {
                lastMessage: '',
                isCleared: true,
                lastMessageTime: serverTimestamp()
            }, { merge: true });

            alert("Chat cleared successfully");
            navigate('/messages'); 
        } catch (err) {
            console.error("Clear chat error:", err);
            alert("Failed to clear chat");
        }
    };

    const handleStartCall = (type) => {
        if (!otherUser) return;
        initiateCall(otherUser.id, otherUser.username, type);
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
                    <button className="dc-call" title="Audio Call" onClick={() => handleStartCall('audio')}>
                        <Phone size={20} />
                    </button>
                    <button className="dc-video-call" title="Video Call" onClick={() => handleStartCall('video')}>
                        <Video size={20} />
                    </button>
                    <button className="dc-more" onClick={() => setShowOptions(!showOptions)}>
                        <MoreHorizontal size={24} />
                    </button>
                    {showOptions && (
                        <div className="dc-options-dropdown">
                            <button onClick={() => navigate(`/profile/${otherUser?.id}`)}>
                                <User size={16} /> View Profile
                            </button>
                            <button onClick={() => { setShowCallHistory(true); setShowOptions(false); }}>
                                <History size={16} /> Call History
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
                            <div className={`dc-bubble ${msg.fileUrl ? 'has-media' : ''}`}>
                                {msg.fileUrl && (
                                    <div className="dc-media-content">
                                        {msg.fileType?.startsWith('image/') ? (
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <img src={msg.fileUrl} alt="shared" className="dc-shared-img" />
                                            </a>
                                        ) : msg.fileType?.startsWith('video/') ? (
                                            <video src={msg.fileUrl} controls className="dc-shared-video" />
                                        ) : msg.fileType?.startsWith('audio/') ? (
                                            <audio src={msg.fileUrl} controls className="dc-shared-audio" />
                                        ) : (
                                            <div className="dc-file-attachment">
                                                <div className="file-icon"><File size={24} /></div>
                                                <div className="file-info">
                                                    <span className="file-name">{msg.fileName || 'Attachment'}</span>
                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="download-link">
                                                        <Download size={16} /> Download
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {msg.text && <p>{msg.text}</p>}
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
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        hidden 
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <button 
                        type="button" 
                        className="action-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 size={22} className="animate-spin" /> : <Paperclip size={22} />}
                    </button>
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

            {showCallHistory && (
                <CallHistoryPanel
                    currentUserId={user?.uid}
                    targetId={otherUser?.id}
                    context="direct"
                    onClose={() => setShowCallHistory(false)}
                    onCallBack={(type) => { handleStartCall(type); setShowCallHistory(false); }}
                />
            )}
        </div>
    );
};

export default DirectChat;
