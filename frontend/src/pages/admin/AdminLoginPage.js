import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      if (result.user.role === 'admin') {
        // Redirect to admin dashboard immediately
        navigate('/admin/dashboard');
      } else {
        setError('You do not have admin privileges.');
        // Logout non-admin user
        localStorage.removeItem('token');
      }
    } else {
      setError(result.error || 'Invalid admin credentials');
    }
    setIsLoading(false);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-logo">🐾</div>
          <h2>Admin Panel</h2>
          <p>Authorized Personnel Only</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@strayloveph.org"
              required
              autoFocus
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
          
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          
          <button type="submit" className="btn-admin-login" disabled={isLoading}>
            {isLoading ? 'LOGGING IN...' : 'LOGIN TO ADMIN PANEL'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
