import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { User, Mail, Phone, Calendar, MapPin, Award, BookOpen, LogOut, Edit3, X, Save, Camera, MessageCircle, Trash2, Video } from 'lucide-react';
import { auth, db, storage } from '../../firebase.config';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import './Profile.css';

const Profile = () => {
    const { userId } = useParams();
    const { user, userData, refreshUserData, openAuthModal, loading: authLoading } = useAuth();
    const { initiateCall } = useCall();
    const navigate = useNavigate();
    
    const [viewedUser, setViewedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        username: '',
        fullName: '',
        location: 'Global Stuverse',
        dob: '',
        branch: '',
        yearOfStudy: '',
        academicYears: '',
        collegeName: '',
        interests: '',
        communities: [],
        phoneNumber: '',
        email: ''
    });
    const [updating, setUpdating] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [communityNames, setCommunityNames] = useState({});


    const isOwnProfile = !userId || userId === user?.uid;

    const girlPresets = [
        { id: 'girl1', path: '/avatars/girl1.png', label: 'Student 1' },
        { id: 'girl2', path: '/avatars/girl2.png', label: 'Student 2' },
        { id: 'girl3', path: '/avatars/girl3.png', label: 'Student 3' }
    ];
    const boyPresets = [
        { id: 'boy1', path: '/avatars/boy1.png', label: 'Student 1' },
        { id: 'boy2', path: '/avatars/boy2.png', label: 'Student 2' },
        { id: 'boy3', path: '/avatars/boy3.png', label: 'Student 3' }
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            if (isOwnProfile) {
                if (userData) {
                    setViewedUser(userData);
                    setEditData({
                        username: userData.username || '',
                        fullName: userData.fullName || '',
                        location: userData.location || 'Global Stuverse',
                        dob: userData.dob || '',
                        branch: userData.branch || '',
                        yearOfStudy: userData.yearOfStudy || '',
                        academicYears: userData.academicYears || '',
                        collegeName: userData.collegeName || '',
                        interests: userData.interests || '',
                        communities: userData.communities || [],
                        phoneNumber: userData.phoneNumber || '',
                        email: userData.email || ''
                    });
                }
                setLoading(authLoading);
            } else {
                try {
                    const userRef = doc(db, 'users', userId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setViewedUser(userSnap.data());
                    } else {
                        console.error("User not found");
                    }
                } catch (err) {
                    console.error("Error fetching profile:", err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserData();
    }, [userId, userData, authLoading, isOwnProfile]);

    useEffect(() => {
        const fetchCommunityNames = async () => {
            if (viewedUser?.communities && viewedUser.communities.length > 0) {
                const currentCommunities = viewedUser.communities;
                const newNames = {};
                
                const fetchPromises = currentCommunities.map(async (id) => {
                    if (!communityNames[id]) {
                        try {
                            const commRef = doc(db, 'communities', id);
                            const commSnap = await getDoc(commRef);
                            if (commSnap.exists()) {
                                newNames[id] = commSnap.data().name;
                            } else {
                                newNames[id] = `Tribe (${id.substring(0, 5)})`;
                            }
                        } catch (err) {
                            console.error(`Error resolving community ${id}:`, err);
                            newNames[id] = `Tribe (${id.substring(0, 5)})`;
                        }
                    }
                });

                await Promise.all(fetchPromises);
                
                if (Object.keys(newNames).length > 0) {
                    setCommunityNames(prev => ({ ...prev, ...newNames }));
                }
            }
        };

        fetchCommunityNames();
    }, [viewedUser?.communities]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Image must be less than 2MB');
                return;
            }
            setImageFile(file);
            setSelectedPreset(null);
            setRemovePhoto(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectPreset = (path) => {
        setImagePreview(path);
        setSelectedPreset(path);
        setImageFile(null);
        setRemovePhoto(false);
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.8);
                };
            };
        });
    };

    const handleRemovePhoto = () => {
        setImageFile(null);
        setImagePreview(null);
        setRemovePhoto(true);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "CRITICAL: Are you sure you want to delete your Stuverse account? \n\n" +
            "This will permanently erase your profile and all personal data. This action CANNOT be undone."
        );
        
        if (!confirmed) return;

        setUpdating(true);
        try {
            // 1. Delete user document from Firestore
            await deleteDoc(doc(db, 'users', user.uid));
            
            // 2. Delete profile image from storage if exists
            try {
                const storageRef = ref(storage, `profiles/${user.uid}`);
                await deleteObject(storageRef);
            } catch (err) {
                console.log("No profile image found to delete", err);
            }

            // 3. Delete the Auth account
            // Note: deleteUser() requires a recently signed-in user. 
            // If it fails with 'requires-recent-login', we might need to ask them to logout/login.
            await deleteUser(user);
            
            alert("Account deleted successfully. We're sad to see you go!");
            navigate('/login');
        } catch (error) {
            console.error('Delete account error:', error);
            if (error.code === 'auth/requires-recent-login') {
                alert("For security, you must log out and log back in before deleting your account.");
            } else {
                alert(`Error deleting account: ${error.message}`);
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleSendMessage = () => {
        if (!user) {
            alert("Please login to message other students!");
            return;
        }
        // Unique Chat ID for two specific users
        const chatId = [user.uid, userId].sort().join('_');
        navigate(`/messages/${chatId}`);
    };

    const handleCallUser = () => {
        if (!user) {
            alert("Please login to call other students!");
            return;
        }
        initiateCall(userId, viewedUser?.username || 'Student', 'video');
    };


    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        if (!user || !user.uid) return;

        try {
            let photoURL = userData?.photoURL || '';

            if (imageFile) {
                const compressedBlob = await compressImage(imageFile);
                const storageRef = ref(storage, `profiles/${user.uid}`);
                const snapshot = await uploadBytes(storageRef, compressedBlob);
                photoURL = await getDownloadURL(snapshot.ref);
            } else if (selectedPreset) {
                photoURL = selectedPreset;
            } else if (removePhoto) {
                photoURL = '';
                try {
                    const storageRef = ref(storage, `profiles/${user.uid}`);
                    await deleteObject(storageRef);
                } catch (err) {
                    console.log("Photo not found in storage or deleted", err);
                }
            }

            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                ...editData,
                communities: Array.isArray(editData.communities) 
                    ? editData.communities 
                    : editData.communities.split(',').map(c => c.trim()).filter(c => c !== ''),
                photoURL: photoURL
            }, { merge: true });
            await refreshUserData();
            setIsEditing(false);
            setImagePreview(null);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Update error:', error);
            alert(`Failed: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading-screen">
                <div className="loader"></div>
                <p>Decoding student profile...</p>
            </div>
        );
    }

    if (!viewedUser && !isOwnProfile) {
        return (
            <div className="profile-not-found">
                <h2>User not found</h2>
                <button onClick={() => navigate('/search')}>Go back to Search</button>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-page-wrapper">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            {viewedUser?.photoURL ? (
                                <img src={viewedUser.photoURL} alt="Profile" className="avatar-img" />
                            ) : (
                                <span>{viewedUser?.username ? viewedUser.username[0].toUpperCase() : 'U'}</span>
                            )}
                        </div>
                        <div className="profile-title">
                            <h1>{viewedUser?.fullName || viewedUser?.username || 'User'}</h1>
                            <p className="profile-role">{viewedUser?.username ? `@${viewedUser.username}` : 'Student Member'}</p>
                        </div>
                    </div>

                    <div className="profile-content">
                        <div className="info-section">
                            <div className="section-header-flex">
                                <h2>{isOwnProfile ? 'Your Personal Space' : `${viewedUser?.username}'s Profile`}</h2>
                                {isOwnProfile && (
                                    <button className="edit-icon-btn" onClick={() => setIsEditing(true)}>
                                        <Edit3 size={18} /> Edit
                                    </button>
                                )}
                            </div>
                            <div className="info-grid personal-vibe">
                                <div className="info-item">
                                    <User className="info-icon" />
                                    <div>
                                        <label>College Name</label>
                                        <p>{viewedUser?.collegeName || 'Inter-College Explorer'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <BookOpen className="info-icon" />
                                    <div>
                                        <label>Specialization</label>
                                        <p>{viewedUser?.branch || 'Multiple Interests'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Award className="info-icon" />
                                    <div>
                                        <label>Year of Study</label>
                                        <p>{viewedUser?.yearOfStudy || 'Not mentioned'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Calendar className="info-icon" />
                                    <div>
                                        <label>Education Cycle</label>
                                        <p>{viewedUser?.academicYears || 'Not visible'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <MapPin className="info-icon" />
                                    <div>
                                        <label>Vibe Check (Location)</label>
                                        <p>{viewedUser?.location || 'Global Stuverse'}</p>
                                    </div>
                                </div>
                                {isOwnProfile && viewedUser?.phoneNumber && (
                                    <div className="info-item">
                                        <Phone className="info-icon" style={{ color: '#2575fc' }} />
                                        <div>
                                            <label>Phone</label>
                                            <p>{viewedUser.phoneNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {isOwnProfile && viewedUser?.email && (
                                    <div className="info-item">
                                        <Mail className="info-icon" style={{ color: '#6a11cb' }} />
                                        <div>
                                            <label>Email</label>
                                            <p>{viewedUser.email}</p>
                                        </div>
                                    </div>
                                )}
                                {isOwnProfile && viewedUser?.dob && (
                                    <div className="info-item full-width-interests">
                                        <Calendar className="info-icon" style={{ color: '#ff6b6b' }} />
                                        <div>
                                            <label>Born On</label>
                                            <p>{viewedUser.dob}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="info-item full-width-interests">
                                    <Award className="info-icon" style={{ color: '#00d2ff' }} />
                                    <div>
                                        <label>Passions & Interests</label>
                                        <p className="interests-pillbox">{viewedUser?.interests || 'No passions shared yet'}</p>
                                    </div>
                                </div>
                                {viewedUser?.communities && viewedUser.communities.length > 0 && (
                                    <div className="info-item full-width-interests">
                                        <BookOpen className="info-icon" style={{ color: '#4facfe' }} />
                                        <div>
                                            <label>Member of Communities</label>
                                            <div className="communities-pills">
                                                {viewedUser.communities.map((id, index) => (
                                                    <span key={index} className="community-pill">
                                                        {communityNames[id] || `Tribe (${id.substring(0, 5)}...)`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isOwnProfile && (
                            <div className="connection-section" style={{ display: 'flex', gap: '15px' }}>
                                <button className="connect-message-btn" onClick={handleSendMessage} style={{ flex: 1 }}>
                                    <MessageCircle size={20} /> Message
                                </button>
                                <button className="connect-call-btn" onClick={handleCallUser} style={{ flex: 1, backgroundColor: '#2ed573', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                    <Video size={20} /> Call
                                </button>
                            </div>
                        )}

                        {isOwnProfile && (
                            <div className="profile-actions">
                                <button className="logout-btn" onClick={handleLogout}>
                                    <LogOut size={18} /> Logout
                                </button>
                                <button className="delete-account-btn" onClick={handleDeleteAccount} disabled={updating}>
                                    <Trash2 size={18} /> {updating ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal (Reused) */}
            {isEditing && (
                <div className="modal-overlay">
                    <div className="edit-modal">
                        <div className="modal-header">
                            <h3>Edit Profile</h3>
                            <button className="close-btn" onClick={() => {
                                setIsEditing(false);
                                setImagePreview(null);
                                setImageFile(null);
                                setRemovePhoto(false);
                            }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="avatar-edit-section">
                                <div className="avatar-preview-wrapper" onClick={() => document.getElementById('profile-upload').click()}>
                                    {imagePreview || userData?.photoURL ? (
                                        <img src={imagePreview || userData.photoURL} alt="Preview" />
                                    ) : (
                                        <div className="placeholder-preview">
                                            {editData.username ? editData.username[0].toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <div className="camera-overlay">
                                        <Camera size={20} />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    id="profile-upload"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>

                            <div className="avatar-presets-container">
                                <label className="preset-label">Choose a Professional Avatar</label>
                                <div className="preset-group">
                                    <div className="preset-grid">
                                        {[...girlPresets, ...boyPresets].map(preset => (
                                            <div 
                                                key={preset.id} 
                                                className={`preset-item ${imagePreview === preset.path ? 'active' : ''}`}
                                                onClick={() => handleSelectPreset(preset.path)}
                                            >
                                                <img src={preset.path} alt={preset.label} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-grid-modal">
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input type="text" value={editData.username} onChange={(e) => setEditData({ ...editData, username: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" value={editData.fullName} onChange={(e) => setEditData({ ...editData, fullName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>College Name</label>
                                    <input type="text" value={editData.collegeName} onChange={(e) => setEditData({ ...editData, collegeName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Branch</label>
                                    <input type="text" value={editData.branch} onChange={(e) => setEditData({ ...editData, branch: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Year of Study</label>
                                    <input type="text" value={editData.yearOfStudy} onChange={(e) => setEditData({ ...editData, yearOfStudy: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input type="text" value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" value={editData.phoneNumber} onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })} placeholder="+1 (234) 567-890" />
                                </div>
                                <div className="form-group">
                                    <label>Contact Email</label>
                                    <input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} placeholder="hello@example.com" />
                                </div>
                                <div className="form-group">
                                    <label>Academic Years (e.g. 2023-2027)</label>
                                    <input type="text" value={editData.academicYears} onChange={(e) => setEditData({ ...editData, academicYears: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" value={editData.dob} onChange={(e) => setEditData({ ...editData, dob: e.target.value })} />
                                </div>
                                <div className="form-group full-width">
                                    <label>Communities (Comma separated IDs)</label>
                                    <input 
                                        type="text" 
                                        value={Array.isArray(editData.communities) ? editData.communities.join(', ') : editData.communities} 
                                        onChange={(e) => setEditData({ ...editData, communities: e.target.value })} 
                                        placeholder="e.g. 2, 7tXuLHZ6D1R9TPomiMo6"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Bio / Interests</label>
                                <textarea 
                                    value={editData.interests} 
                                    onChange={(e) => setEditData({ ...editData, interests: e.target.value })}
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="submit" className="save-btn" disabled={updating}>
                                    {updating ? 'Saving...' : <><Save size={18} /> Update Profile</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
