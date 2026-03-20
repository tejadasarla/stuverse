import React from 'react';
import { Building2, MapPin, ExternalLink, Users } from 'lucide-react';
import './Colleges.css';

const collegesData = [
    {
        id: 'cvr',
        name: 'CVR College of Engineering',
        location: 'Mangalpalli, Hyderabad',
        description: 'Vast campus offering cutting-edge tech programs and fostering innovation among students.'
    },
    {
        id: 'mrec',
        name: 'Malla Reddy Engineering College',
        location: 'Maisammaguda, Hyderabad',
        description: 'A vibrant campus known for its comprehensive engineering courses and strong alumni network.'
    },
    {
        id: 'cbit',
        name: 'CBIT (Chaitanya Bharathi Institute of Technology)',
        location: 'Gandipet, Hyderabad',
        description: 'One of the premier engineering academies in Telangana known for its esteemed placements and tech culture.'
    },
    {
        id: 'vnrvjiet',
        name: 'VNR VJIET',
        location: 'Bachupally, Hyderabad',
        description: 'Pioneering in experiential learning and active participation in top tech fests and communities.'
    },
    {
        id: 'bvrit',
        name: 'BVRIT (B V Raju Institute of Technology)',
        location: 'Narsapur, Hyderabad',
        description: 'A reputed college pushing the boundaries of technology with hands-on research centers.'
    },
    {
        id: 'griet',
        name: 'Gokaraju Rangaraju Institute of Engineering and Technology',
        location: 'Bachupally, Hyderabad',
        description: 'Renowned for its emphasis on values and producing highly skilled technical graduates.'
    },
    {
        id: 'gnitc',
        name: 'Guru Nanak Institutions Technical Campus',
        location: 'Ibrahimpatnam, Hyderabad',
        description: 'Delivering stellar education with a huge campus filled with countless tech and cultural clubs.'
    },
    {
        id: 'spec',
        name: 'St. Peter\'s Engineering College',
        location: 'Maisammaguda, Hyderabad',
        description: 'Creating an inspiring environment for students to collaborate and grow in latest domains.'
    },
    {
        id: 'mgit',
        name: 'MGIT (Mahatma Gandhi Institute of Technology)',
        location: 'Gandipet, Hyderabad',
        description: 'Associated closely with CBIT, recognized for high standards of technical excellence.'
    },
    {
        id: 'iare',
        name: 'Institute of Aeronautical Engineering',
        location: 'Dundigal, Hyderabad',
        description: 'A dynamic institution heavily focused on tech and aeronautical advancements and student well-being.'
    }
];

const Colleges = () => {
    return (
        <div className="colleges-page">
            <div className="colleges-header">
                <h1>Our Partner Colleges</h1>
                <p>Stuverse connects students from various prestigious colleges. We are officially collaborated with these top tier institutions to build a better community experience.</p>
            </div>
            
            <div className="colleges-grid">
                {collegesData.map(college => (
                    <div key={college.id} className="college-card">
                        <div className="college-icon-wrapper">
                            <Building2 size={32} className="college-logo-icon" />
                        </div>
                        <div className="college-info">
                            <h3>{college.name}</h3>
                            <div className="college-meta">
                                <span><MapPin size={16} /> {college.location}</span>
                            </div>
                            <p className="college-desc">{college.description}</p>
                            
                            <div className="college-actions">
                                <button className="view-students-btn">
                                    <Users size={16} /> View Communities
                                </button>
                                <button className="icon-btn">
                                    <ExternalLink size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Colleges;
