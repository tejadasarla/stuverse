import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Shield, MessageSquare, MoreHorizontal, Camera, Lock, Eye, Trash2, Image as ImageIcon } from 'lucide-react';
import { uploadImageToStorage } from '../../utils/imageUtils';
import './CommunitySettings.css';

const GroupSettings = () => {
    const { id, groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [community, setCommunity] = useState(null);
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('');
    const [iconFile, setIconFile] = useState(null);
    const [removeIcon, setRemoveIcon] = useState(false);
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Icon must be less than 2MB");
                return;
            }
            setIconFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setIcon(event.target.result); // use icon string for preview
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            alert("Only admins can update group settings.");
            return;
        }
        setSaving(true);
        try {
            let finalIconUrl = icon;
            if (removeIcon) {
                finalIconUrl = '';
            } else if (iconFile) {
                finalIconUrl = await uploadImageToStorage(iconFile, `groups/icons/${id}_${groupId}`, { maxWidth: 400, maxHeight: 400 });
            }

            const groupRef = doc(db, 'communities', id, 'groups', groupId);
            await updateDoc(groupRef, {
                name,
                description,
                icon: finalIconUrl,
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

    const handleDeleteGroup = async () => {
        if (!isAdmin) {
            alert("Only admins can delete groups.");
            return;
        }
        
        if (!window.confirm(`CRITICAL: Are you sure you want to delete the group "${group.name}"? All messages will be lost forever.`)) return;
        
        setDeleting(true);
        try {
            await deleteDoc(doc(db, 'communities', id, 'groups', groupId));
            alert("Group deleted successfully.");
            navigate(`/communities/${id}`);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setDeleting(false);
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
                                <label>Group Icon (Optional)</label>
                                <div className="banner-upload-area" onClick={() => isAdmin && document.getElementById('group-icon-upload').click()} style={{ border: '2px dashed var(--border-color)', borderRadius: '50%', width: '100px', height: '100px', margin: '0 auto', textAlign: 'center', cursor: isAdmin ? 'pointer' : 'default', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                                    {icon ? (
                                        <img src={icon} alt="Icon Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-dim)' }}>
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                    {isAdmin && (
                                        <input 
                                            type="file" 
                                            id="group-icon-upload"
                                            hidden 
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    )}
                                </div>
                                {icon && isAdmin && (
                                    <div style={{ textAlign: 'center' }}>
                                        <button type="button" onClick={() => {
                                            setIcon('');
                                            setIconFile(null);
                                            setRemoveIcon(true);
                                        }} style={{ marginTop: '10px', background: 'transparent', border: '1px solid #ff4757', color: '#ff4757', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                                            Remove Icon
                                        </button>
                                    </div>
                                )}
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
                    
                    {isAdmin && (
                        <section className="settings-section danger-zone">
                            <h2><Lock size={20} /> Danger Zone</h2>
                            <p>This will permanently remove this group and all its message history. Use with caution.</p>
                            <button className="delete-comm-btn" onClick={handleDeleteGroup} disabled={deleting || saving}>
                                <Trash2 size={18} /> {deleting ? 'Removing...' : 'Delete Group'}
                            </button>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default GroupSettings;
