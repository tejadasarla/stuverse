import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Shield, Users, MessageSquare, Lock, Globe, Camera, Trash2, Save } from 'lucide-react';
import './CommunitySettings.css';

const CommunitySettings = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const [community, setCommunity] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [banner, setBanner] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'communities', id));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCommunity({ id: docSnap.id, ...data });
                    setName(data.name);
                    setDescription(data.description);
                    setBanner(data.banner);
                    setCategory(data.category);
                } else {
                    navigate('/communities');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const isAdmin = community?.admins?.includes(user?.uid) || community?.adminId === user?.uid;
    const isCreator = (community?.creatorId || community?.adminId) === user?.uid;

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            alert("Only admins can update community settings.");
            return;
        }
        setSaving(true);
        try {
            await updateDoc(doc(db, 'communities', id), {
                name,
                description,
                banner,
                category
            });
            alert("Community settings updated successfully!");
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isCreator) {
            alert("Only the community creator can permanently delete this tribe.");
            return;
        }
        if (!window.confirm("CRITICAL: Are you sure you want to delete this community? All data, groups, and chats will be lost forever.")) return;
        
        setSaving(true);
        try {
            // In a production app, we would also delete all sub-collections (groups and messages)
            // For now, we delete the main document. 
            // Note: Orphaned sub-collections will remain in Firestore but will be inaccessible.
            await deleteDoc(doc(db, 'communities', id));
            
            // Also need to remove this community from the user's joined list
            if (userData?.communities?.includes(id)) {
                await updateDoc(doc(db, 'users', user.uid), {
                    communities: userData.communities.filter(c => c !== id)
                });
            }

            alert("Community deleted successfully.");
            navigate('/communities');
        } catch (err) {
            alert(`Error deleting community: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="settings-loader-page">Loading Community Settings...</div>;

    return (
        <div className="settings-page">
            <header className="settings-header">
                <button className="back-btn" onClick={() => navigate(`/communities/${id}`)}>
                    <ArrowLeft size={20} />
                </button>
                <h1>{community.name} Settings</h1>
            </header>

            <main className="settings-main">
                <div className="settings-card">
                    <section className="settings-section">
                        <h2><Shield size={20} /> Profile Information</h2>
                        <form onSubmit={handleUpdate} className="settings-form">
                            <div className="form-group">
                                <label>Community Name</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div className="form-group">
                                <label>Banner Image URL</label>
                                <div className="input-with-icon">
                                    <Camera size={18} />
                                    <input 
                                        type="url" 
                                        value={banner} 
                                        onChange={e => setBanner(e.target.value)} 
                                        disabled={!isAdmin}
                                    />
                                </div>
                            </div>
                            {isAdmin && (
                                <button type="submit" className="save-settings-btn" disabled={saving}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </form>
                    </section>

                    {isCreator && (
                        <section className="settings-section danger-zone">
                            <h2><Lock size={20} /> Danger Zone</h2>
                            <p>Once you delete a community, there is no going back. Please be certain.</p>
                            <button className="delete-comm-btn" onClick={handleDelete}>
                                <Trash2 size={18} /> Delete Community
                            </button>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CommunitySettings;
