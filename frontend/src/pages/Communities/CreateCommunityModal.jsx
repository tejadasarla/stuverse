import React, { useState } from 'react';
import { db } from '../../firebase.config';
import { collection, addDoc, serverTimestamp, doc, setDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { X, Camera, Globe, Lock, Shield, Image as ImageIcon } from 'lucide-react';
import { uploadImageToStorage } from '../../utils/imageUtils';
import './CreateCommunityModal.css';

const CreateCommunityModal = ({ isOpen, onClose }) => {
    const { user, userData, refreshUserData } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Tech');
    const [college, setCollege] = useState('');
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState('');
    const [loading, setLoading] = useState(false);

    const colleges = [
        'CVR College of Engineering',
        'Malla Reddy Engineering College',
        'CBIT (Chaitanya Bharathi Institute of Technology)',
        'VNR VJIET',
        'BVRIT (B V Raju Institute of Technology)',
        'Gokaraju Rangaraju Institute of Engineering and Technology',
        'Guru Nanak Institutions Technical Campus',
        "St. Peter's Engineering College",
        'MGIT (Mahatma Gandhi Institute of Technology)',
        'Institute of Aeronautical Engineering'
    ];

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Banner must be less than 5MB");
                return;
            }
            setBannerFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setBannerPreview(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !description || !user) return;

        setLoading(true);
        console.log('Creating community for user:', user.uid);
        
        try {
            // 0. Upload banner if provided
            let bannerUrl = `https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop`;
            if (bannerFile) {
                // Use a temporary unique ID for the initial upload or UUID. We'll use a unique string.
                const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
                bannerUrl = await uploadImageToStorage(bannerFile, `communities/banners/${uniqueId}`, { maxWidth: 1200, maxHeight: 600 });
            }

            // 1. Create the community document
            const commData = {
                name: name.trim(),
                description: description.trim(),
                category: category || 'General',
                college: college || 'Open Community',
                banner: bannerUrl,
                adminId: user.uid,
                creatorId: user.uid,
                admins: [user.uid],
                adminName: userData?.username || user.displayName || 'Anonymous Tribe Leader',
                adminPhoto: userData?.photoURL || user.photoURL || '',
                createdAt: serverTimestamp(),
                memberCount: 1,
                members: [user.uid],
                icon: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`
            };

            const communityRef = await addDoc(collection(db, 'communities'), commData);
            console.log('Community doc created:', communityRef.id);

            // 2. Create default groups (Announcements and General)
            const groupsRef = collection(db, 'communities', communityRef.id, 'groups');
            
            // Parallel group creation
            await Promise.all([
                addDoc(groupsRef, {
                    name: "📢 Announcements",
                    type: "announcements",
                    description: "Official updates from the community admins.",
                    createdAt: serverTimestamp()
                }),
                addDoc(groupsRef, {
                    name: "💬 General",
                    type: "chat",
                    description: "General discussion for everyone.",
                    createdAt: serverTimestamp()
                })
            ]);
            console.log('Default groups created');

            // 3. Add the community to the user's joined communities
            // Using setDoc with merge: true in case the user doc doesn't exist yet
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                communities: arrayUnion(communityRef.id)
            }, { merge: true });
            console.log('User document updated');

            await refreshUserData();
            onClose();
            // Clear form
            setName('');
            setDescription('');
            setBannerFile(null);
            setBannerPreview('');
            
        } catch (error) {
            console.error('CRITICAL Error creating community:', error);
            alert(`Failed to create community: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create a Community</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="create-comm-form">
                    <div className="form-group">
                        <label>Community Name</label>
                        <input 
                            type="text" 
                            placeholder="What's your tribe called?" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="Tech">Tech & Coding</option>
                            <option value="Art">Art & Design</option>
                            <option value="Music">Music & Vocals</option>
                            <option value="Sports">Sports & Fitness</option>
                            <option value="Startup">Startup & Business</option>
                            <option value="Study">Study & Academics</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>College Name</label>
                        <select value={college} onChange={(e) => setCollege(e.target.value)}>
                            <option value="">Open Community (Global)</option>
                            {colleges.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea 
                            placeholder="Tell people what this community is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Community Banner</label>
                        <div className="banner-upload-area" onClick={() => document.getElementById('comm-banner-upload').click()} style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: bannerPreview ? '0' : '30px', textAlign: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                            {bannerPreview ? (
                                <img src={bannerPreview} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                                    <ImageIcon size={32} />
                                    <span>Click to upload banner (Optional)</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                id="comm-banner-upload"
                                hidden 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Community'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCommunityModal;
