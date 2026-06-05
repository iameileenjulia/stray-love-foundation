import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import './LoginPage.css';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(identifier, password);
    
    if (result.success) {
      if (result.user.role === 'admin') {
        setError('Please use the Admin Login page at /admin/login');
        return;
      }
      if (!result.user.emailVerified) {
        setError('Please verify your email first. Check your inbox for verification code.');
        return;
      }
      if (result.user.verificationStatus !== 'approved') {
        setError(`Your account is pending admin verification. This takes up to 72 hours. Status: ${result.user.verificationStatus}`);
        return;
      }
      if (result.user.isSuspended) {
        setError('Your account has been suspended. Please contact support.');
        return;
      }
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-container">
          <h2><i className="fas fa-sign-in-alt"></i> LOGIN</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email / Contact Number</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@example.com or +63 912 345 6789"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="showPassword">Show Password</label>
            </div>
            {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}
            <button type="submit" className="btn-login"><i className="fas fa-key"></i> LOGIN</button>
          </form>
          <div className="register-link">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoginPage;
