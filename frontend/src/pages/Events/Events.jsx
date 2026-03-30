import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { db } from '../../firebase.config';
import { collection, doc, updateDoc, deleteDoc, arrayUnion, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';
import CreateEventModal from './CreateEventModal';
import { PlusCircle, Calendar, MapPin, Globe, Users, Clock, Shield, Search, Filter, Trash2, Edit, X, Video } from 'lucide-react';
import './Events.css';

const ParticipantsModal = ({ participants, isOpen, onClose }) => {
    const [participantNames, setParticipantNames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && participants?.length > 0) {
            const fetchNames = async () => {
                const names = await Promise.all(
                    participants.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        return userDoc.exists() ? userDoc.data().username : 'Unknown User';
                    })
                );
                setParticipantNames(names);
                setLoading(false);
            };
            fetchNames();
        }
    }, [isOpen, participants]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="participants-modal">
                <div className="modal-header">
                    <h3>Event Participants ({participants?.length || 0})</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="participants-list">
                    {loading ? <p>Loading members...</p> : (
                        participantNames.map((name, i) => (
                            <div key={i} className="participant-item">
                                <span className="p-avatar">{name[0].toUpperCase()}</span>
                                <span className="p-name">{name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const Events = () => {
    const { user, userData } = useAuth();
    const { initiateCall } = useCall();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [viewingParticipants, setViewingParticipants] = useState(null);
    
    // Filters
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [modeFilter, setModeFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching events:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleJoinEvent = async (eventId, eventTitle) => {
        if (!user) return alert("Please login to join events");

        try {
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, {
                participants: arrayUnion(user.uid)
            });
            alert(`You have successfully joined "${eventTitle}"!`);
        } catch (error) {
            console.error("Error joining event:", error);
            alert("Failed to join event: " + error.message);
        }
    };

    const handleDeleteEvent = async (eventId, title) => {
        if (!window.confirm(`Are you sure you want to cancel the event "${title}"?`)) return;
        try {
            await deleteDoc(doc(db, 'events', eventId));
            alert("Event deleted successfully.");
        } catch (err) {
            alert("Error deleting event: " + err.message);
        }
    };

    const handleJoinLive = (event) => {
        // Use event ID as fixedId so others join the same session
        initiateCall(event.id, event.title, 'video', event.id);
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'TBA';
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredEvents = events.filter(event => {
        const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
        const matchesMode = modeFilter === 'All' || event.mode === modeFilter;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            event.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesMode && matchesSearch;
    });

    const categories = ['All', 'Tech', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Social'];

    return (
        <div className="events-page">
            <header className="events-hero">
                <h1>Campus Student Events</h1>
                <p>Host workshops, hackathons, and social gatherings. Start your own event today!</p>
                
                {user && (
                    <div className="header-actions">
                        <button className="create-btn-main" onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}>
                            <PlusCircle size={20} />
                            Host Event
                        </button>
                    </div>
                )}
            </header>

            <main className="events-container">
                <div className="events-filters-bar">
                    <div className="search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search events..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filters-group">
                        <div className="filter-item">
                            <label><Filter size={14} /> Category:</label>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="filter-item">
                            <label><Globe size={14} /> Mode:</label>
                            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                                <option value="All">All</option>
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="events-loading">
                        <div className="loader"></div>
                        <p>Syncing Events...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="no-events">
                        <Calendar size={48} />
                        <h3>No events found</h3>
                        <p>Try adjusting your filters or be the first to host an event!</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {filteredEvents.map((event) => (
                            <div key={event.id} className="event-card">
                                <div className="event-banner">
                                    <img 
                                        src={event.banner || "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=800"} 
                                        alt={event.title} 
                                    />
                                    <div className={`event-mode-tag ${event.mode}`}>
                                        {event.mode === 'online' ? <Globe size={14} /> : <MapPin size={14} />}
                                        {event.mode.toUpperCase()}
                                    </div>
                                    <div className="event-cat-tag">{event.category}</div>
                                </div>

                                <div className="event-info">
                                    <h3 className="event-title">{event.title}</h3>
                                    
                                    <div className="event-meta-grid">
                                        <div className="meta-item">
                                            <Calendar size={16} />
                                            <span>{formatDateTime(event.dateTime)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <MapPin size={16} />
                                            <span className="location-text" title={event.location}>{event.location}</span>
                                        </div>
                                        <div className="meta-item clickable" onClick={() => setViewingParticipants(event.participants)}>
                                            <Users size={16} />
                                            <span className="p-count-link">{event.participants?.length || 0} Participants</span>
                                        </div>
                                        <div className="meta-item">
                                            <Shield size={16} />
                                            <span>By {event.creatorName}</span>
                                        </div>
                                    </div>

                                    <p className="event-description">{event.description}</p>

                                    <div className="event-actions">
                                        {event.participants?.includes(user?.uid) ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                                <button className="join-btn-event joined" disabled style={{ width: '100%' }}>
                                                    Joined √
                                                </button>
                                                {event.mode === 'online' && (
                                                    <button 
                                                        className="join-live-btn"
                                                        onClick={() => handleJoinLive(event)}
                                                        style={{ backgroundColor: '#7065f0', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}
                                                    >
                                                        <Video size={18} /> Join Live Session
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button 
                                                className="join-btn-event"
                                                onClick={() => handleJoinEvent(event.id, event.title)}
                                            >
                                                Join Event
                                            </button>
                                        )}
                                        {event.createdBy === user?.uid && (
                                            <div className="admin-actions">
                                                <button 
                                                    className="manage-event-btn edit" 
                                                    onClick={() => { setEditingEvent(event); setIsModalOpen(true); }}
                                                    title="Modify Event"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    className="manage-event-btn delete" 
                                                    onClick={() => handleDeleteEvent(event.id, event.title)}
                                                    title="Cancel Event"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <CreateEventModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                editingEvent={editingEvent}
            />

            <ParticipantsModal 
                isOpen={!!viewingParticipants}
                participants={viewingParticipants}
                onClose={() => setViewingParticipants(null)}
            />
        </div>
    );
};

export default Events;
