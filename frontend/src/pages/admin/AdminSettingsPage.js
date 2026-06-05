import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminSettingsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [adminSettings, setAdminSettings] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [systemSettings, setSystemSettings] = useState({
    gracePeriod: '72',
    monitoringSchedule: ['1', '6']
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadSettings();
  }, [user, navigate]);

  const loadSettings = () => {
    setAdminSettings({
      fullName: user.fullName || '',
      email: user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // Load saved system settings from localStorage
    const savedSettings = localStorage.getItem('adminSystemSettings');
    if (savedSettings) {
      setSystemSettings(JSON.parse(savedSettings));
    }
  };

  const updateAdminProfile = async (e) => {
    e.preventDefault();
    
    if (adminSettings.newPassword && adminSettings.newPassword !== adminSettings.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {
        fullName: adminSettings.fullName,
        email: adminSettings.email
      };
      if (adminSettings.newPassword) {
        updateData.password = adminSettings.newPassword;
      }
      if (adminSettings.currentPassword) {
        updateData.currentPassword = adminSettings.currentPassword;
      }
      
      await api.put('/admin/profile', updateData);
      toast.success('Admin profile updated successfully');
      setAdminSettings({
        ...adminSettings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveSystemSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('adminSystemSettings', JSON.stringify(systemSettings));
    toast.success('System settings saved successfully');
  };

  const updateGracePeriod = (value) => {
    setSystemSettings({ ...systemSettings, gracePeriod: value });
  };

  const toggleMonitoringSchedule = (month) => {
    const current = systemSettings.monitoringSchedule;
    if (current.includes(month)) {
      setSystemSettings({ ...systemSettings, monitoringSchedule: current.filter(m => m !== month) });
    } else {
      setSystemSettings({ ...systemSettings, monitoringSchedule: [...current, month] });
    }
  };

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="page-header">
          <h1><i className="fas fa-cog"></i> SETTINGS</h1>
        </div>

        <div className="settings-grid">
          {/* Admin Account Settings */}
          <div className="settings-card">
            <div className="card-title">
              <i className="fas fa-user-shield"></i>
              ADMIN ACCOUNT
            </div>
            <form onSubmit={updateAdminProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={adminSettings.fullName}
                  onChange={(e) => setAdminSettings({ ...adminSettings, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={adminSettings.email}
                  onChange={(e) => setAdminSettings({ ...adminSettings, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Current Password (required to change password)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminSettings.currentPassword}
                  onChange={(e) => setAdminSettings({ ...adminSettings, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password (optional)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminSettings.newPassword}
                  onChange={(e) => setAdminSettings({ ...adminSettings, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminSettings.confirmPassword}
                  onChange={(e) => setAdminSettings({ ...adminSettings, confirmPassword: e.target.value })}
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
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Account'}
              </button>
            </form>
          </div>

          {/* System Settings */}
          <div className="settings-card">
            <div className="card-title">
              <i className="fas fa-sliders-h"></i>
              SYSTEM SETTINGS
            </div>
            <form onSubmit={saveSystemSettings}>
              <div className="form-group">
                <label>Adoption Request Grace Period</label>
                <select value={systemSettings.gracePeriod} onChange={(e) => updateGracePeriod(e.target.value)}>
                  <option value="24">24 Hours (1 day)</option>
                  <option value="48">48 Hours (2 days)</option>
                  <option value="72">72 Hours (3 days)</option>
                  <option value="96">96 Hours (4 days)</option>
                  <option value="120">120 Hours (5 days)</option>
                  <option value="168">168 Hours (7 days)</option>
                </select>
                <small className="form-hint">Users have this long to reflect on their adoption request before admin approval</small>
              </div>

              <div className="form-group">
                <label>Monitoring Schedule Reminders</label>
                <div className="schedule-options">
                  <label>
                    <input 
                      type="checkbox" 
                      value="1" 
                      checked={systemSettings.monitoringSchedule.includes('1')}
                      onChange={() => toggleMonitoringSchedule('1')}
                    /> 1 Month
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      value="3" 
                      checked={systemSettings.monitoringSchedule.includes('3')}
                      onChange={() => toggleMonitoringSchedule('3')}
                    /> 3 Months
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      value="6" 
                      checked={systemSettings.monitoringSchedule.includes('6')}
                      onChange={() => toggleMonitoringSchedule('6')}
                    /> 6 Months
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      value="12" 
                      checked={systemSettings.monitoringSchedule.includes('12')}
                      onChange={() => toggleMonitoringSchedule('12')}
                    /> 1 Year
                  </label>
                </div>
                <small className="form-hint">Users will be reminded to submit monitoring reports at these intervals</small>
              </div>

              <button type="submit" className="save-btn">Save Settings</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettingsPage;
