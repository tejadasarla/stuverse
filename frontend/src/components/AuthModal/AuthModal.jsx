import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Github, Facebook, Linkedin, ArrowLeft } from 'lucide-react';
import { auth } from '../../firebase.config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import logo from '../../assets/logo.png';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'login', triggerRestricted = false }) => {
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [mode, setMode] = useState(triggerRestricted ? 'restricted' : (initialMode === 'forgot' ? 'forgot' : 'form'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [forgotSubmitted, setForgotSubmitted] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        collegeName: ''
    });

    useEffect(() => {
        if (triggerRestricted) {
            setMode('restricted');
        } else if (initialMode === 'forgot') {
            setMode('forgot');
        } else {
            setMode('form');
            setIsSignUp(initialMode === 'signup');
        }
        setError('');
        setForgotSubmitted(false);
    }, [initialMode, triggerRestricted, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            onClose();
            navigate('/profile');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const collegeEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac\.in|edu\.sg|edu\.[a-z]{2})$/i;
        if (!collegeEmailRegex.test(formData.email)) {
            setError("Please use your official college email (ending in .edu, .ac.in, or .edu.sg)");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');
            setIsSignUp(false);
            setError('Registration successful! Please sign in.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, formData.email);
            setForgotSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const GoogleIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );

    if (mode === 'restricted' || mode === 'forgot') {
        return (
            <div className="auth-modal-overlay" onClick={onClose}>
                <div className="auth-modal-card restricted" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>

                    {mode === 'restricted' ? (
                        <div className="modal-restricted-content">
                            <div className="restricted-icon-wrapper">
                                <X size={40} />
                            </div>
                            <h2>Profile Access Restricted</h2>
                            <p>Join our community or log in to view and customize your personal student profile.</p>
                            <div className="restricted-actions">
                                <button onClick={() => { setMode('form'); setIsSignUp(false); }} className="auth-btn-modal primary">Log In Now</button>
                                <button onClick={() => { setMode('form'); setIsSignUp(true); }} className="auth-btn-modal secondary">Create Account</button>
                            </div>
                        </div>
                    ) : (
                        <div className="modal-forgot-content">
                            <div className="modal-logo">
                                <img src={logo} alt="Logo" />
                                <span>Stuverse</span>
                            </div>
                            <h2>Forgot Password</h2>

                            {!forgotSubmitted ? (
                                <form onSubmit={handleForgotPassword} className="forgot-modal-form">
                                    <p>Enter your college email to reset your password</p>
                                    <Input
                                        name="email"
                                        label="College Email Address"
                                        type="email"
                                        icon={Mail}
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {error && <p className="modal-error">{error}</p>}
                                    <button className="modal-submit-btn" disabled={loading} style={{ width: '100%' }}>
                                        {loading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>
                            ) : (
                                <div className="forgot-success">
                                    <div className="success-msg">
                                        We've sent a password reset link to your email.
                                    </div>
                                    <button onClick={() => setForgotSubmitted(false)} className="auth-btn-modal secondary">
                                        Try another email
                                    </button>
                                </div>
                            )}

                            <button onClick={() => setMode('form')} className="back-to-login">
                                <ArrowLeft size={16} /> Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className={`auth-modal-container ${isSignUp ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn-abs" onClick={onClose}><X size={20} /></button>

                {/* Sign Up Form */}
                <div className="modal-form-side sign-up">
                    <form onSubmit={handleSignup}>
                        <div className="modal-logo">
                            <img src={logo} alt="Logo" />
                            <span>Stuverse</span>
                        </div>
                        <h1>Registration</h1>
                        <div className="modal-socials">
                            <a href="#" className="social-icon"><GoogleIcon /></a>
                            <a href="#" className="social-icon"><Facebook size={18} fill="#1877F2" color="#1877F2" /></a>
                            <a href="#" className="social-icon"><Github size={18} /></a>
                            <a href="#" className="social-icon"><Linkedin size={18} fill="#0A66C2" color="#0A66C2" /></a>
                        </div>
                        <span className="small-hint">or register with college email</span>
                        <Input type="text" label="Username" name="username" icon={User} onChange={handleInputChange} value={formData.username} required />
                        <Input
                            type="email"
                            label="College Email"
                            name="email"
                            icon={Mail}
                            onChange={handleInputChange}
                            value={formData.email}
                            required
                            pattern=".+\.(edu|ac\.in|edu\.sg|edu\.[a-z]{2})"
                        />
                        <Input type="text" label="College Name" name="collegeName" onChange={handleInputChange} value={formData.collegeName} required />
                        <Input type="password" label="Password" name="password" icon={Lock} onChange={handleInputChange} value={formData.password} required />
                        <Input type="password" label="Confirm Password" name="confirmPassword" icon={Lock} onChange={handleInputChange} value={formData.confirmPassword} required />
                        {error && isSignUp && <p className="modal-error">{error}</p>}
                        <button className="modal-submit-btn" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
                    </form>
                </div>

                {/* Sign In Form */}
                <div className="modal-form-side sign-in">
                    <form onSubmit={handleLogin}>
                        <div className="modal-logo">
                            <img src={logo} alt="Logo" />
                            <span>Stuverse</span>
                        </div>
                        <h1>Sign In</h1>
                        <div className="modal-socials">
                            <a href="#" className="social-icon"><GoogleIcon /></a>
                            <a href="#" className="social-icon"><Facebook size={18} fill="#1877F2" color="#1877F2" /></a>
                            <a href="#" className="social-icon"><Github size={18} /></a>
                            <a href="#" className="social-icon"><Linkedin size={18} fill="#0A66C2" color="#0A66C2" /></a>
                        </div>
                        <span className="small-hint">or use your email password</span>
                        <Input type="email" label="College Email" name="email" icon={Mail} onChange={handleInputChange} value={formData.email} required />
                        <Input type="password" label="Password" name="password" icon={Lock} onChange={handleInputChange} value={formData.password} required />
                        {error && !isSignUp && <p className="modal-error">{error}</p>}
                        <span onClick={() => setMode('forgot')} style={{ fontSize: '13px', cursor: 'pointer', color: '#333', margin: '15px 0 10px' }}>Forget Your Password?</span>
                        <button className="modal-submit-btn" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
                    </form>
                </div>

                {/* Toggle Overlay */}
                <div className="modal-toggle-container">
                    <div className="modal-toggle">
                        <div className="modal-toggle-panel toggle-left">
                            <h1>Hello, Friend!</h1>
                            <p>Enter your personal details and start journey with us</p>
                            <button className="modal-ghost-btn" onClick={() => setIsSignUp(false)}>Sign In</button>
                        </div>
                        <div className="modal-toggle-panel toggle-right">
                            <h1>Welcome Back!</h1>
                            <p>To keep connected with us please login with your personal info</p>
                            <button className="modal-ghost-btn" onClick={() => setIsSignUp(true)}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
