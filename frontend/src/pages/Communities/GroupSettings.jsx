import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Shield, MessageSquare, MoreHorizontal, Camera, Lock, Eye } from 'lucide-react';
import './CommunitySettings.css';

const GroupSettings = () => {
    const { id, groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [community, setCommunity] = useState(null);
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('');
    const [canChat, setCanChat] = useState('everyone');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'communities', id));
                if (docSnap.exists()) {
                    setCommunity({ id: docSnap.id, ...docSnap.data() });
                    const groupSnap = await getDoc(doc(db, 'communities', id, 'groups', groupId));
                    if (groupSnap.exists()) {
                        const data = groupSnap.data();
                        setGroup({ id: groupSnap.id, ...data });
                        setName(data.name);
                        setDescription(data.description);
                        setIcon(data.icon || '');
                        setCanChat(data.settings?.chatPolicy || 'everyone');
                    }
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
    }, [id, groupId, navigate]);

    const isAdmin = community?.admins?.includes(user?.uid) || community?.adminId === user?.uid;

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            alert("Only admins can update group settings.");
            return;
        }
        setSaving(true);
        try {
            const groupRef = doc(db, 'communities', id, 'groups', groupId);
            await updateDoc(groupRef, {
                name,
                description,
                icon,
                settings: {
                    ...group?.settings,
                    chatPolicy: canChat
                }
            });
            alert("Group settings updated successfully!");
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="settings-loader-page">Loading Group Settings...</div>;

    return (
        <div className="settings-page group-settings">
            <header className="settings-header">
                <button className="back-btn" onClick={() => navigate(`/communities/${id}`)}>
                    <ArrowLeft size={20} />
                </button>
                <h1>{group.name} Settings</h1>
            </header>

            <main className="settings-main">
                <div className="settings-card">
                    <section className="settings-section">
                        <h2><MessageSquare size={20} /> Group Information</h2>
                        <form onSubmit={handleUpdate} className="settings-form">
                            <div className="form-group">
                                <label>Group Name</label>
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
                                <label>Group Icon URL (Optional)</label>
                                <div className="input-with-icon">
                                    <Camera size={18} />
                                    <input 
                                        type="url" 
                                        value={icon} 
                                        onChange={e => setIcon(e.target.value)} 
                                        disabled={!isAdmin}
                                        placeholder="Enter image URL"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group chat-policy">
                                <label>Chatting Permissions</label>
                                <select 
                                    value={canChat} 
                                    onChange={e => setCanChat(e.target.value)} 
                                    disabled={!isAdmin}
                                    className="settings-select"
                                >
                                    <option value="everyone">📢 Everyone can text</option>
                                    <option value="admins">🛡️ Only Admins can text</option>
                                </select>
                            </div>

                            {isAdmin && (
                                <button type="submit" className="save-settings-btn" disabled={saving}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default GroupSettings;
