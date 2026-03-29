import React, { useEffect } from 'react';
import { Target, Globe, Users, Shield, Heart, Sparkles, PlusCircle } from 'lucide-react';
import './About.css';

const About = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="about-page-container">
            {/* About Us Section */}
            <section className="about-hero-section">
                <div className="about-hero-content">
                    <h1 className="hero-heading">Connecting students beyond campuses</h1>
                    <p className="hero-intro">
                        Stuverse is a digital platform designed to connect students from different colleges into vibrant, cross-campus communities for collaboration, meaningful discussions, and premier networking.
                    </p>
                </div>
            </section>

            <section className="about-story-section">
                <div className="story-container">
                    <div className="story-content">
                        <h2>Our Story</h2>
                        <p>
                            We observed a common pattern: students across different colleges often lack interaction with one another. Despite sharing the same passions, technologies, and career aspirations, they were isolated within their own campus boundaries. 
                        </p>
                        <p>
                            Stuverse was created to bridge that exact gap. By removing the physical borders, we allow ideas to flow freely, turning separate institutions into one massive, interconnected digital campus.
                        </p>
                    </div>
                    <div className="mission-vision-grid">
                        <div className="mission-block">
                            <div className="block-icon"><Target size={28} /></div>
                            <h3>Our Mission</h3>
                            <ul>
                                <li>Build a unified student network</li>
                                <li>Encourage collaboration across colleges</li>
                                <li>Create safe and meaningful communities</li>
                            </ul>
                        </div>
                        <div className="vision-block">
                            <div className="block-icon"><Globe size={28} /></div>
                            <h3>Our Vision</h3>
                            <p>To become the ultimate digital campus connecting students seamlessly across multiple colleges globally.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <h2>What We Offer</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Users size={28} className="feature-icon" />
                        </div>
                        <h3>Community Chats</h3>
                        <p>Focusing strictly on community-based chats (no isolated personal DMs) to foster group learning.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Globe size={28} className="feature-icon" />
                        </div>
                        <h3>Multi-College Interaction</h3>
                        <p>Break out of your college bubble and meet peers from top engineering institutions everywhere.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Sparkles size={28} className="feature-icon" />
                        </div>
                        <h3>Easy Discovery</h3>
                        <p>Find technical, cultural, and competitive communities that align perfectly with your interests.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Shield size={28} className="feature-icon" />
                        </div>
                        <h3>Safe Networking</h3>
                        <p>Secure collaboration and networking opportunities moderated by trusted student leaders.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
