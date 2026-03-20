import React, { useState } from 'react';
import { db } from '../../firebase.config';
import { collection, addDoc, serverTimestamp, doc, setDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { X, Camera, Globe, Lock, Shield } from 'lucide-react';
import './CreateCommunityModal.css';

const CreateCommunityModal = ({ isOpen, onClose }) => {
    const { user, userData, refreshUserData } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Tech');
    const [banner, setBanner] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !description || !user) return;

        setLoading(true);
        console.log('Creating community for user:', user.uid);
        
        try {
            // 1. Create the community document
            const commData = {
                name: name.trim(),
                description: description.trim(),
                category: category || 'General',
                banner: banner || `https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop`,
                adminId: user.uid,
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
            setBanner('');
            
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
                        <label>Description</label>
                        <textarea 
                            placeholder="Tell people what this community is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Banner URL (Optional)</label>
                        <div className="input-with-icon">
                            <Camera size={18} />
                            <input 
                                type="url" 
                                placeholder="https://unsplash.com/your-image"
                                value={banner}
                                onChange={(e) => setBanner(e.target.value)}
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
