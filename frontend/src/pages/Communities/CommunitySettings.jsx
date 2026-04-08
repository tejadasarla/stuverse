import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Shield, Users, MessageSquare, Lock, Globe, Camera, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import { uploadImageToStorage } from '../../utils/imageUtils';
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
    const [bannerFile, setBannerFile] = useState(null);
    const [removeBanner, setRemoveBanner] = useState(false);
    const [category, setCategory] = useState('');
    const [college, setCollege] = useState('');

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
                    setCollege(data.college || '');
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Banner must be less than 5MB");
                return;
            }
            setBannerFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setBanner(event.target.result); // use banner string for preview
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            alert("Only admins can update community settings.");
            return;
        }
        setSaving(true);
        try {
            let finalBannerUrl = banner;
            if (removeBanner) {
                finalBannerUrl = '';
            } else if (bannerFile) {
                finalBannerUrl = await uploadImageToStorage(bannerFile, `communities/banners/${id}`, { maxWidth: 1200, maxHeight: 600 });
            }

            await updateDoc(doc(db, 'communities', id), {
                name,
                description,
                banner: finalBannerUrl,
                category,
                college
            });
            setBannerFile(null);
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
                                <label>Banner Image</label>
                                <div className="banner-upload-area" onClick={() => isAdmin && document.getElementById('comm-settings-banner-upload').click()} style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: banner ? '0' : '30px', textAlign: 'center', cursor: isAdmin ? 'pointer' : 'default', overflow: 'hidden', position: 'relative', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                                    {banner ? (
                                        <img src={banner} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                                            <ImageIcon size={32} />
                                            <span>{isAdmin ? "Click to change banner" : "No banner set"}</span>
                                        </div>
                                    )}
                                    {isAdmin && (
                                        <input 
                                            type="file" 
                                            id="comm-settings-banner-upload"
                                            hidden 
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    )}
                                </div>
                                {banner && isAdmin && (
                                    <button type="button" onClick={() => {
                                        setBanner('');
                                        setBannerFile(null);
                                        setRemoveBanner(true);
                                    }} style={{ marginTop: '10px', background: 'transparent', border: '1px solid #ff4757', color: '#ff4757', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                                        Remove Banner
                                    </button>
                                )}
                            </div>
                            <div className="form-group">
                                <label>College Name</label>
                                <select value={college} onChange={e => setCollege(e.target.value)} disabled={!isAdmin} className="settings-select">
                                    <option value="">Open Community (Global)</option>
                                    {colleges.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
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
