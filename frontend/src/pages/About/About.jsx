import React, { useEffect } from 'react';
import { Target, Globe, Users, Shield, Heart, Sparkles, PlusCircle } from 'lucide-react';
import './About.css';

const About = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const stewards = [
        {
            id: 1,
            name: "Rahul Sharma",
            role: "Lead Stuverse",
            college: "CBIT Hyderabad",
            description: "Ensuring positive and meaningful discussions across all technical communities.",
            avatar: "R"
        },
        {
            id: 2,
            name: "Priya Patel",
            role: "Community Stuverse",
            college: "VNR VJIET",
            description: "Guiding freshers and maintaining respectful environments in the events space.",
            avatar: "P"
        },
        {
            id: 3,
            name: "Ananya Reddy",
            role: "Community Stuverse",
            college: "CVR College of Engineering",
            description: "Moderating conversations and preventing spam to build a safe networking platform.",
            avatar: "A"
        },
        {
            id: 4,
            name: "Karan Singh",
            role: "Lead Stuverse",
            college: "Malla Reddy Engineering College",
            description: "Leading the engagement team to help new users collaborate seamlessly.",
            avatar: "K"
        }
    ];

    const values = [
        { icon: <Heart size={24} />, title: "Respect", desc: "Every voice matters. We foster an environment free from toxicity." },
        { icon: <Globe size={24} />, title: "Inclusivity", desc: "A welcoming space for students from any background or college." },
        { icon: <Users size={24} />, title: "Collaboration", desc: "Building bridges between institutions for shared learning." },
        { icon: <Sparkles size={24} />, title: "Growth", desc: "Helping each other succeed academically and professionally." }
    ];

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

            {/* Stewards Section */}
            <section className="stewards-section">
                <div className="stewards-header">
                    <h2>Meet Our Stuverses</h2>
                    <p>Stuverses are our dedicated community moderators responsible for maintaining healthy, respectful, and engaging spaces.</p>
                </div>

                <div className="stewards-grid">
                    {stewards.map(steward => (
                        <div key={steward.id} className="steward-card">
                            <div className="steward-avatar-wrapper">
                                <div className="steward-avatar">{steward.avatar}</div>
                                {steward.role === "Lead Stuverse" && (
                                    <div className="lead-badge" title="Lead Stuverse"><Shield size={14} /></div>
                                )}
                            </div>
                            <div className="steward-info">
                                <h3>{steward.name}</h3>
                                <span className={`steward-role ${steward.role === 'Lead Stuverse' ? 'lead-role' : ''}`}>
                                    {steward.role}
                                </span>
                                <span className="steward-college">{steward.college}</span>
                                <p className="steward-desc">"{steward.description}"</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="stewards-responsibilities">
                    <h3>What Do Stuverses Do?</h3>
                    <div className="resp-grid">
                        <div className="resp-item">
                            <div className="resp-icon"><Shield size={20} /></div>
                            <span>Moderate conversations & prevent spam</span>
                        </div>
                        <div className="resp-item">
                            <div className="resp-icon"><Heart size={20} /></div>
                            <span>Maintain a respectful & safe environment</span>
                        </div>
                        <div className="resp-item">
                            <div className="resp-icon"><Users size={20} /></div>
                            <span>Help new users navigate communities</span>
                        </div>
                        <div className="resp-item">
                            <div className="resp-icon"><Sparkles size={20} /></div>
                            <span>Encourage positive, meaningful discussions</span>
                        </div>
                    </div>
                </div>
                
                <div className="stewards-values">
                    <h3>Our Core Values</h3>
                    <div className="values-grid">
                        {values.map((val, idx) => (
                            <div key={idx} className="value-item">
                                <div className="value-icon-wrapper">{val.icon}</div>
                                <h4>{val.title}</h4>
                                <p>{val.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="become-steward-cta">
                    <div className="cta-content">
                        <h3>Want to make an impact?</h3>
                        <p>Join the moderation team and help shape the future of digital campuses.</p>
                    </div>
                    <button className="cta-btn">
                        <PlusCircle size={20} /> Become a Stuverse
                    </button>
                </div>
            </section>
        </div>
    );
};

export default About;
