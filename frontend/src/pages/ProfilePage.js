import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contact: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadUserProfile();
  }, [user, navigate]);

  const loadUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setFormData({
        fullName: response.data.fullName,
        email: response.data.email,
        contact: response.data.contact,
        newPassword: '',
        confirmPassword: ''
      });
      if (response.data.idImageData) {
        setIdPreview(response.data.idImageData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        contact: formData.contact
      };
      
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }
      
      if (idFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          updateData.idImageData = reader.result;
          updateData.idFileName = idFile.name;
          await api.put('/auth/profile', updateData);
          toast.success('Profile updated successfully!');
          setLoading(false);
        };
        reader.readAsDataURL(idFile);
        return;
      }
      
      await api.put('/auth/profile', updateData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className="dashboard-container">
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
              <li><button onClick={handleLogout} className="logout-btn"><i className="fas fa-sign-out-alt"></i> Logout</button></li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <div className="profile-header">
            <h1><i className="fas fa-user-circle"></i> My Profile</h1>
          </div>

          <div className="profile-card">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <label>Change Password (Optional)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-row">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <label>Show Password</label>
              </div>

              <div className="verification-badge">
                <i className="fas fa-check-circle"></i>
                Verification Status: <strong>{user?.verificationStatus === 'approved' ? 'VERIFIED' : user?.verificationStatus?.toUpperCase() || 'PENDING'}</strong>
              </div>

              <div className="form-row">
                <label>Uploaded ID</label>
                <div className="id-preview">
                  {idPreview ? (
                    <img src={idPreview} alt="ID" />
                  ) : (
                    <p>No ID uploaded yet</p>
                  )}
                </div>
                <div className="file-input-wrapper" onClick={() => document.getElementById('idUpload').click()}>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Upload New ID</span>
                </div>
                <input
                  type="file"
                  id="idUpload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setIdFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setIdPreview(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </div>

              <button type="submit" className="update-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage;
