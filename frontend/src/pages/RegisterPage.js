import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import './RegisterPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: ''
  });
  const [idFile, setIdFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    } else if (!/^[\+\d\s\-\(\)]{8,20}$/.test(formData.contact)) {
      newErrors.contact = 'Enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!idFile) newErrors.idFile = 'Please upload a valid ID';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          contact: formData.contact,
          password: formData.password,
          idFileName: fileName
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRegistered(true);
      } else {
        toast.error(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <>
        <div className="register-page">
          <div className="register-container">
            <div className="success-notice">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Registration Submitted!</h2>
              <p>
                Thank you, <strong>{formData.fullName}</strong>! Your account has been received.
              </p>
              <div className="approval-notice">
                <i className="fas fa-clock"></i>
                <div>
                  <strong>Pending Admin Approval</strong>
                  <p>Our team will review your submitted ID and approve your account within <strong>72 hours</strong>. You will be able to log in once approved.</p>
                </div>
              </div>
              <button className="btn-register" onClick={() => navigate('/login')}>
                <i className="fas fa-sign-in-alt"></i> Go to Login
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="register-page">
        <div className="register-container">
          <h2><i className="fas fa-paw"></i> CREATE ACCOUNT</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g., Maria Santos"
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="hello@example.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="+63 912 345 6789"
              />
              {errors.contact && <span className="error-text">{errors.contact}</span>}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <small className="password-hint">
                Must be 8+ characters, include uppercase, lowercase &amp; special character
              </small>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group">
              <label>Upload Valid ID *</label>
              <div className="file-input-wrapper" onClick={() => document.getElementById('idUpload').click()}>
                <i className="fas fa-cloud-upload-alt"></i>
                <span>{fileName || "Click to upload (Driver's license, Passport, etc.)"}</span>
              </div>
              <input
                type="file"
                id="idUpload"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {errors.idFile && <span className="error-text">{errors.idFile}</span>}
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="showPasswordRegister"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="showPasswordRegister">Show Password</label>
            </div>

            <button type="submit" className="btn-register" disabled={isLoading}>
              {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : 'SIGN UP'}
            </button>
          </form>

          <div className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>

          <div className="verification-note">
            <i className="fas fa-info-circle"></i>
            <p>After registration, admin will review your ID within 72 hours. You can only adopt pets after approval.</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RegisterPage;
