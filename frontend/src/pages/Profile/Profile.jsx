import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Calendar, MapPin, Award, BookOpen, LogOut, Edit3, X, Save, Camera } from 'lucide-react';
import { auth, db, storage } from '../../firebase.config';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Profile.css';

const Profile = () => {
    const { user, userData, refreshUserData, openAuthModal, loading } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        username: '',
        location: 'Global Stuverse',
        dob: '',
        branch: '',
        yearOfStudy: '',
        collegeName: '',
        interests: ''
    });
    const [updating, setUpdating] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);

    useEffect(() => {
        if (userData) {
            setEditData({
                username: userData.username || '',
                location: userData.location || 'Global Stuverse',
                dob: userData.dob || '',
                branch: userData.branch || '',
                yearOfStudy: userData.yearOfStudy || '',
                collegeName: userData.collegeName || '',
                interests: userData.interests || ''
            });
        }
    }, [userData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Image must be less than 2MB');
                return;
            }
            setImageFile(file);
            setRemovePhoto(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
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

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        if (!user || !user.uid) {
            alert('User session not found. Please log in again.');
            setUpdating(false);
            return;
        }

        try {
            let photoURL = userData?.photoURL || '';

            if (imageFile) {
                const compressedBlob = await compressImage(imageFile);
                const storageRef = ref(storage, `profiles/${user.uid}`);
                const snapshot = await uploadBytes(storageRef, compressedBlob);
                photoURL = await getDownloadURL(snapshot.ref);
            } else if (removePhoto) {
                photoURL = '';
                try {
                    const storageRef = ref(storage, `profiles/${user.uid}`);
                    await deleteObject(storageRef);
                } catch (err) {
                    console.log("Photo not found in storage or already deleted", err);
                }
            }

            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                username: editData.username,
                location: editData.location,
                dob: editData.dob,
                branch: editData.branch,
                yearOfStudy: editData.yearOfStudy,
                collegeName: editData.collegeName,
                interests: editData.interests,
                photoURL: photoURL
            }, { merge: true });
            await refreshUserData();
            setImageFile(null);
            setImagePreview(null);
            setRemovePhoto(false);
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Update error:', error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        if (!user && !loading) {
            navigate('/');
            openAuthModal('login', true);
        }
    }, [user, loading, navigate, openAuthModal]);

    if (!user) {
        return null; // The useEffect will handle the redirect
    }

    return (
        <div className="profile-page">
            <Navbar />
            <div className="profile-page-wrapper">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="Profile" className="avatar-img" />
                            ) : (
                                <span>{userData?.username ? userData.username[0].toUpperCase() : 'U'}</span>
                            )}
                        </div>
                        <div className="profile-title">
                            <h1>{userData?.username || 'User'}</h1>
                            <p className="profile-role">Student Member</p>
                        </div>
                    </div>

                    <div className="profile-content">
                        <div className="info-section">
                            <div className="section-header-flex">
                                <h2>Personal Information</h2>
                                <button className="edit-icon-btn" onClick={() => setIsEditing(true)}>
                                    <Edit3 size={18} /> Edit
                                </button>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <User className="info-icon" />
                                    <div>
                                        <label>Full Name</label>
                                        <p>{userData?.username || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Mail className="info-icon" />
                                    <div>
                                        <label>Email Address</label>
                                        <p>{user.email}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Calendar className="info-icon" />
                                    <div>
                                        <label>Joined Since</label>
                                        <p>{userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <MapPin className="info-icon" />
                                    <div>
                                        <label>College Name</label>
                                        <p>{userData?.collegeName || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <BookOpen className="info-icon" />
                                    <div>
                                        <label>Branch / Major</label>
                                        <p>{userData?.branch || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Award className="info-icon" />
                                    <div>
                                        <label>Year of Study</label>
                                        <p>{userData?.yearOfStudy || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Calendar className="info-icon" />
                                    <div>
                                        <label>Date of Birth</label>
                                        <p>{userData?.dob || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <MapPin className="info-icon" />
                                    <div>
                                        <label>Location</label>
                                        <p>{userData?.location || 'Global Stuverse'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Award className="info-icon" style={{ color: '#00d2ff' }} />
                                    <div>
                                        <label>Interests</label>
                                        <p>{userData?.interests || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="stats-section">
                            <div className="stat-card">
                                <Award className="stat-icon" />
                                <h3>Badges</h3>
                                <p>5 earned</p>
                            </div>
                            <div className="stat-card">
                                <BookOpen className="stat-icon" />
                                <h3>Communities</h3>
                                <p>3 joined</p>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button className="logout-btn" onClick={handleLogout}>
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
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
                                <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                                    <p className="upload-hint" style={{ cursor: 'pointer', color: '#6a11cb' }}>Click image to change</p>
                                    {(userData?.photoURL || imagePreview) && !removePhoto && (
                                        <p className="upload-hint" onClick={handleRemovePhoto} style={{ cursor: 'pointer', color: '#ef4444' }}>| Delete Picture</p>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={editData.username}
                                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>College Name</label>
                                <input
                                    type="text"
                                    value={editData.collegeName}
                                    onChange={(e) => setEditData({ ...editData, collegeName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Branch</label>
                                <input
                                    type="text"
                                    value={editData.branch}
                                    onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Year of Study</label>
                                <input
                                    type="text"
                                    value={editData.yearOfStudy}
                                    placeholder="e.g. 3rd Year"
                                    onChange={(e) => setEditData({ ...editData, yearOfStudy: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input
                                    type="date"
                                    value={editData.dob}
                                    onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={editData.location}
                                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Interests</label>
                                <textarea
                                    value={editData.interests}
                                    placeholder="e.g. Coding, Music, Sports"
                                    onChange={(e) => setEditData({ ...editData, interests: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button type="submit" className="save-btn" disabled={updating}>
                                    {updating ? 'Saving...' : <><Save size={18} /> Save Changes</>}
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
