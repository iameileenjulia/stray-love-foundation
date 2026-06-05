import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import './RegisterPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EMAILJS_SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
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

  const startResendTimer = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(code);

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_name:  formData.fullName,
          to_email: formData.email,
          otp_code: code,
          from_name: 'STRAY Love Ph Foundation',
        },
        EMAILJS_PUBLIC_KEY
      );

      toast.success('Verification code sent to your email!');
      setStep(2);
      startResendTimer();
    } catch (error) {
      console.error('EmailJS error:', error);
      console.error('EmailJS config:', {
        serviceId: EMAILJS_SERVICE_ID,
        templateId: EMAILJS_TEMPLATE_ID,
        publicKey: EMAILJS_PUBLIC_KEY ? '✓ set' : '✗ missing',
      });
      toast.error(`EmailJS error: ${error?.text || error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    await sendOTP();
  };

  const resendOTP = async () => {
    if (resendCooldown > 0) return;
    await sendOTP();
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }

    if (otp !== generatedOTP) {
      toast.error('Invalid verification code. Please try again.');
      return;
    }

    setIsLoading(true);
    toast.success('Email verified! Completing registration...');
    await completeRegistration();
    setIsLoading(false);
  };

  const completeRegistration = async () => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        contact: formData.contact,
        password: formData.password,
        idImageData: reader.result,
        idFileName: fileName
      };

      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Registration successful! Please wait for admin verification (up to 72 hours).');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          toast.error(data.message || 'Registration failed');
        }
      } catch (error) {
        toast.error('Network error. Please try again.');
      }
    };

    reader.readAsDataURL(idFile);
  };

  return (
    <>
      <div className="register-page">
        <div className="register-container">
          <h2><i className="fas fa-paw"></i> CREATE ACCOUNT</h2>

          <div className="progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Register</div>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Verify Email</div>
            </div>
          </div>

          {step === 1 ? (
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
                {isLoading ? 'Sending Code...' : 'SIGN UP'}
              </button>
            </form>
          ) : (
            <div className="otp-verification">
              <div className="otp-icon">
                <i className="fas fa-envelope-open-text"></i>
              </div>
              <h3>Verify Your Email</h3>
              <p className="otp-info">
                We've sent a 6-digit verification code to<br />
                <strong>{formData.email}</strong>
              </p>

              <div className="form-group">
                <label>Enter Verification Code</label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="otp-input"
                />
              </div>

              <button onClick={verifyOTP} className="btn-register" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'VERIFY & REGISTER'}
              </button>

              <div className="resend-otp">
                <p>Didn't receive the code?</p>
                <button
                  onClick={resendOTP}
                  disabled={resendCooldown > 0}
                  className="resend-btn"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button onClick={() => setStep(1)} className="back-btn">
                <i className="fas fa-arrow-left"></i> Back to Registration
              </button>
            </div>
          )}

          <div className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>

          <div className="verification-note">
            <i className="fas fa-info-circle"></i>
            <p>After registration, admin will review your ID (up to 72 hours). You can only adopt pets after admin approval.</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RegisterPage;
