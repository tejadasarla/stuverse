import React, { useState } from 'react';
import { User, Mail, Lock, Github, Linkedin } from 'lucide-react';
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
    collegeName: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
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
              <a href="#" className="icon"><Github size={20} /></a>
              <a href="#" className="icon"><Linkedin size={20} fill="#0A66C2" color="#0A66C2" /></a>
            </div>
            <span style={{ fontSize: '12px' }}>or register with social platforms</span>
            <Input type="text" label="Username" id="signup-name" name="username" icon={User} onChange={handleInputChange} value={formData.username} required />
            <Input
              type="email"
              label="College Email"
              id="signup-email"
              name="email"
              icon={Mail}
              onChange={handleInputChange}
              value={formData.email}
              required
              pattern=".+\.(edu|ac\.in|edu\.sg|edu\.[a-z]{2})"
              title="Please use an official college email (.edu, .ac.in, or .edu.sg)"
            />
            <Input type="text" label="College Name" name="collegeName" onChange={handleInputChange} value={formData.collegeName} required />
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
              <a href="#" className="icon"><Github size={20} /></a>
              <a href="#" className="icon"><Linkedin size={20} fill="#0A66C2" color="#0A66C2" /></a>
            </div>
            <span style={{ fontSize: '12px' }}>or use your email password</span>
            <Input
              type="email"
              label="College Email"
              id="login-email"
              name="email"
              icon={Mail}
              onChange={handleInputChange}
              value={formData.email}
              required
              pattern=".+\.(edu|ac\.in|edu\.sg|edu\.[a-z]{2})"
            />
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
