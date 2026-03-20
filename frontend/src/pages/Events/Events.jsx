import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import './Events.css';

const EventCard = ({ event, index }) => {
    const cardRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // Stop observing once animated
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Helper formatting
    const eventDate = event.date ? new Date(event.date) : new Date();

    return (
        <div ref={cardRef} className="event-card hidden" style={{ transitionDelay: `${(index % 3) * 0.1}s` }}>
            <div className="event-banner">
                <img src={event.bannerUrl || 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&q=80&w=800'} alt={event.title} />
                <div className="event-date-badge">
                    <span className="month">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                    <span className="day">{eventDate.getDate()}</span>
                </div>
            </div>
            <div className="event-content">
                <h3 className="event-title">{event.title}</h3>
                <p className="event-organizer">Organized by: <span>{event.organizerName || 'Student Council'}</span></p>
                <div className="event-details-grid">
                    <div className="detail-item"><Clock size={16} /> <span>{event.time || '10:00 AM'}</span></div>
                    <div className="detail-item"><MapPin size={16} /> <span>{event.location || 'Campus Main Hall'}</span></div>
                    <div className="detail-item"><Users size={16} /> <span>{event.attendees || 0} Attending</span></div>
                </div>
                <p className="event-description">{event.description}</p>
                <button className="register-btn">Register Now</button>
            </div>
        </div>
    );
};

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch events directly from Firebase Backend
        const q = query(collection(db, 'events'), orderBy('date', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching connecting to backend:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const seedDemoEvents = async () => {
        const mockDb = [
            {
                title: "Tech Innovation Hackathon",
                organizerName: "Computer Science Society",
                date: new Date(Date.now() + 86400000 * 5).toISOString(),
                time: "09:00 AM - 09:00 PM",
                location: "Innovation Hub",
                attendees: 125,
                description: "Join us for 12 hours of non-stop coding, building, and innovating. Prizes worth $5000 up for grabs!",
                bannerUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800"
            },
            {
                title: "Annual Cultural Fest 2026",
                organizerName: "Arts & Drama Club",
                date: new Date(Date.now() + 86400000 * 12).toISOString(),
                time: "05:00 PM - 11:30 PM",
                location: "Main Auditorium",
                attendees: 450,
                description: "A magical evening filled with performances, music, and food from diverse student groups across campus.",
                bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800"
            },
            {
                title: "Robotics Workshop: Build Your First Bot",
                organizerName: "Engineering Student Board",
                date: new Date(Date.now() + 86400000 * 18).toISOString(),
                time: "02:00 PM - 04:00 PM",
                location: "Engineering Lab 304",
                attendees: 30,
                description: "Learn the basics of microcontrollers and motors. No prior experience required. All materials provided!",
                bannerUrl: "https://images.unsplash.com/photo-1561557944-6e7860d1a7e2?auto=format&fit=crop&q=80&w=800"
            },
            {
                title: "Startup Pitch Night",
                organizerName: "Entrepreneurship Cell",
                date: new Date(Date.now() + 86400000 * 25).toISOString(),
                time: "06:00 PM - 09:00 PM",
                location: "Business School Theatre",
                attendees: 200,
                description: "Watch student founders pitch their latest ideas to a panel of expert judges and local investors. Networking session to follow.",
                bannerUrl: "https://images.unsplash.com/photo-1475721028070-1200bc0bfab5?auto=format&fit=crop&q=80&w=800"
            }
        ];

        try {
            for (let event of mockDb) {
                await addDoc(collection(db, 'events'), event);
            }
        } catch (error) {
            console.error("Failed to seed demo events:", error);
            alert("Ensure your Firestore security rules allow writes to the 'events' collection to run the demo generator.");
        }
    };

    return (
        <div className="events-page-container">
            <div className="events-hero">
                <h1>Student Events</h1>
                <p>Discover and register for amazing events hosted by students across the campus.</p>
            </div>

            <div className="events-main-content">
                {loading ? (
                    <div className="loading-spinner">Loading backend events...</div>
                ) : events.length === 0 ? (
                    <div className="no-events-found">
                        <h2>No active events found in the database!</h2>
                        <p>It looks like the <code>events</code> collection is empty.</p>
                        <button onClick={seedDemoEvents} className="demo-seed-btn">
                            Initialize Backend with Demo Events
                        </button>
                    </div>
                ) : (
                    <div className="events-grid">
                        {events.map((event, index) => (
                            <EventCard key={event.id} event={event} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Events;
