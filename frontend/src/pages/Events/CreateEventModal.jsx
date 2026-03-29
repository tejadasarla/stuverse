import React, { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, MapPin, Globe, Type, AlignLeft, Tag, Clock } from 'lucide-react';
import './CreateEventModal.css';

const CreateEventModal = ({ isOpen, onClose, editingEvent = null }) => {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Tech',
        mode: 'online',
        dateTime: '',
        location: '',
        banner: ''
    });

    useEffect(() => {
        if (editingEvent) {
            setFormData({
                title: editingEvent.title || '',
                description: editingEvent.description || '',
                category: editingEvent.category || 'Tech',
                mode: editingEvent.mode || 'online',
                dateTime: editingEvent.dateTime || '',
                location: editingEvent.location || '',
                banner: editingEvent.banner || ''
            });
        } else {
            setFormData({
                title: '',
                description: '',
                category: 'Tech',
                mode: 'online',
                dateTime: '',
                location: '',
                banner: ''
            });
        }
    }, [editingEvent, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("Please login to manage events");

        setLoading(true);
        try {
            if (editingEvent) {
                const eventRef = doc(db, 'events', editingEvent.id);
                await updateDoc(eventRef, {
                    ...formData,
                    updatedAt: serverTimestamp()
                });
                alert("Event updated successfully!");
            } else {
                await addDoc(collection(db, 'events'), {
                    ...formData,
                    createdBy: user.uid,
                    creatorName: userData?.username || 'Student',
                    participants: [user.uid],
                    createdAt: serverTimestamp()
                });
                alert("Event created successfully!");
            }
            onClose();
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Failed to save event: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['Tech', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Social'];

    return (
        <div className="modal-overlay">
            <div className="create-event-modal">
                <div className="modal-header">
                    <h2>{editingEvent ? 'Modify Event' : 'Host New Event'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="event-form">
                    <div className="form-section">
                        <div className="form-group">
                            <label><Type size={16} /> Event Title</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Give your event a catchy name"
                            />
                        </div>

                        <div className="form-group">
                            <label><AlignLeft size={16} /> Description</label>
                            <textarea 
                                required 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="What is this event about?"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><Tag size={16} /> Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label><Globe size={16} /> Event Mode</label>
                            <select 
                                value={formData.mode}
                                onChange={(e) => setFormData({...formData, mode: e.target.value})}
                            >
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><Calendar size={16} /> Date & Time</label>
                            <input 
                                type="datetime-local" 
                                required 
                                value={formData.dateTime}
                                onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label><MapPin size={16} /> {formData.mode === 'online' ? 'Meeting Link' : 'Venue Location'}</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                placeholder={formData.mode === 'online' ? 'Zoom/Meet Link' : 'College Hall, Room etc.'}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Clock size={16} /> Banner Image URL (Optional)</label>
                        <input 
                            type="url" 
                            value={formData.banner}
                            onChange={(e) => setFormData({...formData, banner: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <button type="submit" className="submit-event-btn" disabled={loading}>
                        {loading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Launch Event')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;

