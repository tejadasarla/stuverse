import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Input from '../components/ui/Input';
import './Auth.css'; // Use the same styles as Auth page

const ForgotPassword = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        // Logic to send reset email
    };

    return (
        <div className="container" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h1 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Forgot Password</h1>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>Enter your email to reset your password</p>

                {!submitted ? (
                    <form onSubmit={handleSubmit} style={{ padding: '0', background: 'transparent' }}>
                        <Input
                            id="email"
                            label="Email Address"
                            type="email"
                            icon={Mail}
                            required
                        />

                        <button style={{ marginTop: '20px', width: '100%' }}>
                            Send Reset Link
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
    );
};

export default ForgotPassword;
