import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { auth } from '../../firebase.config';
import { sendPasswordResetEmail } from 'firebase/auth';
import Input from '../../components/ui/Input';
import './Auth.css';
import logo from '../../assets/logo.png';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            console.log("Password reset email sent to:", email);
            setSubmitted(true);
        } catch (err) {
            console.error("Error sending password reset email:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100%',
            background: 'linear-gradient(to right, #e2e2e2, #c9d6ff)'
        }}>
            <div className="container" style={{ minHeight: '450px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <div className="auth-logo" style={{ marginBottom: '20px' }}>
                        <img src={logo} alt="Logo" className="auth-logo-img" />
                        <span className="auth-logo-text">Stuverse</span>
                    </div>
                    <h1 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Forgot Password</h1>
                    <p style={{ fontSize: '14px', marginBottom: '20px' }}>Enter your email to reset your password</p>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} style={{ padding: '0', background: 'transparent' }}>
                            <Input
                                id="email"
                                label="Email Address"
                                type="email"
                                icon={Mail}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            {error && <p style={{ color: 'red', fontSize: '12px', marginTop: '10px' }}>{error}</p>}

                            <button style={{ marginTop: '20px', width: '100%' }} disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: '#e0e7ff', color: '#512da8', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                                We've sent a password reset link to your email.
                            </div>
                            <button onClick={() => setSubmitted(false)} className="hidden" style={{ color: '#333', borderColor: '#ccc', width: '100%' }}>
                                Try another email
                            </button>
                        </div>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <Link to="/login" style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <span>←</span> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
