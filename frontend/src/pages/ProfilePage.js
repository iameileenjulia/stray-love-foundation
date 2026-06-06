import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const ProfilePage = () => {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contact: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [idFileName, setIdFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setFormData({
        fullName: res.data.fullName || '',
        email: res.data.email || '',
        contact: res.data.contact || '',
        newPassword: '',
        confirmPassword: ''
      });
      if (res.data.idImageData) {
        setIdPreview(res.data.idImageData);
        setIdFileName(res.data.idFileName || 'ID uploaded');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const showMsg = (text, type) => {
    setProfileMsg({ text, type });
    setTimeout(() => setProfileMsg({ text: '', type: '' }), 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdFile(file);
    setIdFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setIdPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.contact) {
      showMsg('All fields are required.', 'error');
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        showMsg('Passwords do not match.', 'error');
        return;
      }
      if (formData.newPassword.length < 8) {
        showMsg('Password must be at least 8 characters.', 'error');
        return;
      }
    }

    setLoading(true);

    const updateData = {
      fullName: formData.fullName,
      email: formData.email,
      contact: formData.contact
    };
    if (formData.newPassword) updateData.password = formData.newPassword;

    try {
      if (idFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          updateData.idImageData = reader.result;
          updateData.idFileName = idFile.name;
          try {
            await api.put('/auth/profile', updateData);
            showMsg('Profile updated successfully!', 'success');
          } catch (err) {
            showMsg(err.response?.data?.message || 'Failed to update profile', 'error');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(idFile);
        return;
      }

      await api.put('/auth/profile', updateData);
      showMsg('Profile updated successfully!', 'success');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const isVerified = user?.verificationStatus === 'approved';

  const Sidebar = () => (
    <aside className="sidebar">
      <h3><i className="fas fa-paw"></i> Menu</h3>
      <nav>
        <ul>
          <li><Link to="/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
          <li><Link to="/dashboard/browse"><i className="fas fa-search"></i> Browse Pets</Link></li>
          <li><Link to="/dashboard/my-requests"><i className="fas fa-file-alt"></i> My Requests</Link></li>
          <li><Link to="/dashboard/monitoring"><i className="fas fa-clock"></i> Monitoring</Link></li>
          <li><Link to="/dashboard/posts"><i className="fas fa-newspaper"></i> Public Posts</Link></li>
          <li><Link to="/dashboard/profile" className="active"><i className="fas fa-user-circle"></i> Profile</Link></li>
          <li>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );

  return (
    <>
      <div className="dashboard-container">
        <Sidebar />

        <main className="main-content">
          <div className="profile-header">
            <h1>
              <i className="fas fa-user-circle" style={{ color: '#C28A7A', marginRight: '0.5rem' }}></i>
              PROFILE
            </h1>
          </div>

          <div className="profile-card">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="form-row">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  required
                />
              </div>

              <div className="form-row">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Contact Number"
                  required
                />
              </div>

              <div className="form-row">
                <label>Change Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password (leave blank to keep current)"
                />
                <div style={{ fontSize: '0.75rem', color: '#A98978', marginTop: '0.3rem' }}>
                  Must be 8+ chars, include uppercase, lowercase &amp; special character
                </div>
              </div>

              <div className="form-row">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>

              {/* Verification Status */}
              <div
                className={`verification-badge${isVerified ? '' : ' pending'}`}
                style={{ marginBottom: '1.5rem' }}
              >
                <i className={`fas ${isVerified ? 'fa-check-circle' : 'fa-clock'}`}></i>
                VERIFICATION STATUS:&nbsp;
                <strong>
                  {isVerified ? 'VERIFIED' : (user?.verificationStatus?.toUpperCase() || 'PENDING')}
                </strong>
              </div>

              {/* Uploaded ID Preview */}
              <div className="form-row">
                <label>Uploaded ID Preview</label>
                <div className="id-preview">
                  {idPreview ? (
                    <img src={idPreview} alt="Uploaded ID" />
                  ) : (
                    <>
                      <i className="fas fa-id-card fa-2x" style={{ color: '#C28A7A' }}></i>
                      <p style={{ color: '#A98978', marginTop: '0.5rem', fontSize: '0.88rem' }}>
                        No ID uploaded yet
                      </p>
                    </>
                  )}
                  {idFile && (
                    <p style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#6B9C8F' }}>
                      <i className="fas fa-check-circle"></i> {idFileName}
                    </p>
                  )}
                </div>

                <div
                  className="file-input-wrapper"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>{idFile ? idFileName : 'Upload New ID (JPEG, PNG)'}</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              <button type="submit" className="update-btn" disabled={loading}>
                <i className="fas fa-save"></i> {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>

            {profileMsg.text && (
              <div className={`profile-message${profileMsg.type === 'error' ? ' error' : ''}`}>
                <i className={`fas ${profileMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                &nbsp;{profileMsg.text}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage;
