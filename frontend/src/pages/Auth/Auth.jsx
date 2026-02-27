import React, { useState } from 'react';
import { User, Mail, Lock, Github, Facebook, Linkedin } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase.config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Input from '../../components/ui/Input';
import './Auth.css';
import logo from '../../assets/logo.png';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(location.pathname === '/signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    collegeName: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterClick = () => {
    setIsActive(true);
    setError('');
  };

  const handleLoginClick = () => {
    setIsActive(false);
    setError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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

      alert('Registration successful! Please sign in.');
      setIsActive(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/'); // Redirect to home after login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // SVG Logo for Google
  const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  );

  return (
    <div className="auth-page-wrapper" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(to right, #e2e2e2, #c9d6ff)'
    }}>
      <div className={`container ${isActive ? 'active' : ''}`} id="container">
        {/* Sign Up Form */}
        <div className="form-container sign-up">
          <form onSubmit={handleSignup}>
            <div className="auth-logo">
              <img src={logo} alt="Logo" className="auth-logo-img" />
              <span className="auth-logo-text">Stuverse</span>
            </div>
            <h1>Registration</h1>
            <div className="social-icons">
              <a href="#" className="icon"><GoogleIcon /></a>
              <a href="#" className="icon"><Facebook size={20} fill="#1877F2" color="#1877F2" /></a>
              <a href="#" className="icon"><Github size={20} /></a>
              <a href="#" className="icon"><Linkedin size={20} fill="#0A66C2" color="#0A66C2" /></a>
            </div>
            <span style={{ fontSize: '12px' }}>or register with social platforms</span>
            <Input type="text" label="Username" id="signup-name" name="username" icon={User} onChange={handleInputChange} value={formData.username} required />
            <Input type="email" label="Email" id="signup-email" name="email" icon={Mail} onChange={handleInputChange} value={formData.email} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
              <Input type="text" label="College Name" name="collegeName" onChange={handleInputChange} value={formData.collegeName} required />
              <Input type="date" label="DOB" name="dob" onChange={handleInputChange} value={formData.dob} required />
            </div>
            <Input type="password" label="Password" id="signup-password" name="password" icon={Lock} onChange={handleInputChange} value={formData.password} required />
            <Input type="password" label="Re-enter Password" id="signup-confirm" name="confirmPassword" icon={Lock} onChange={handleInputChange} value={formData.confirmPassword} required />
            {error && isActive && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
            <button style={{ marginTop: '10px' }} disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <div className="auth-logo">
              <img src={logo} alt="Logo" className="auth-logo-img" />
              <span className="auth-logo-text">Stuverse</span>
            </div>
            <h1>Sign In</h1>
            <div className="social-icons">
              <a href="#" className="icon"><GoogleIcon /></a>
              <a href="#" className="icon"><Facebook size={20} fill="#1877F2" color="#1877F2" /></a>
              <a href="#" className="icon"><Github size={20} /></a>
              <a href="#" className="icon"><Linkedin size={20} fill="#0A66C2" color="#0A66C2" /></a>
            </div>
            <span style={{ fontSize: '12px' }}>or use your email password</span>
            <Input type="email" label="Email" id="login-email" name="email" icon={Mail} onChange={handleInputChange} value={formData.email} required />
            <Input type="password" label="Password" id="login-password" name="password" icon={Lock} onChange={handleInputChange} value={formData.password} required />
            {error && !isActive && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
            <a href="/forgot-password">Forget Your Password?</a>
            <button style={{ marginTop: '10px' }} disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
          </form>
        </div>

        {/* Toggle Overlay */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1 style={{ color: 'white', fontWeight: 'bold' }}>Welcome Back!</h1>
              <p style={{ color: 'white' }}>Enter your personal details to use all of site features</p>
              <button className="hidden" onClick={handleLoginClick} style={{ borderColor: 'white' }}>Sign In</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1 style={{ color: 'white', fontWeight: 'bold' }}>Hello, Friend!</h1>
              <p style={{ color: 'white' }}>Register with your personal details to use all of site features</p>
              <button className="hidden" onClick={handleRegisterClick} style={{ borderColor: 'white' }}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
