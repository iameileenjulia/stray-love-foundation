import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import './AdminPetsPage.css';

const AdminSettingsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const [adminForm, setAdminForm] = useState({
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
  const [showPassword, setShowPassword] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMsg, setAccountMsg] = useState(null);
  const [systemMsg, setSystemMsg] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    setAdminForm(prev => ({
      ...prev,
      fullName: user.fullName || '',
      email: user.email || ''
    }));
    const saved = localStorage.getItem('adminSystemSettings');
    if (saved) {
      try { setSystemSettings(JSON.parse(saved)); } catch {}
    }
  }, [user, navigate]);

  const showAccountMsg = (text, type = 'success') => {
    setAccountMsg({ text, type });
    setTimeout(() => setAccountMsg(null), 3000);
  };

  const showSystemMsg = (text, type = 'success') => {
    setSystemMsg({ text, type });
    setTimeout(() => setSystemMsg(null), 3000);
  };

  const updateAdminProfile = async (e) => {
    e.preventDefault();
    if (adminForm.newPassword && adminForm.newPassword !== adminForm.confirmPassword) {
      showAccountMsg('New passwords do not match', 'error');
      return;
    }
    setAccountLoading(true);
    try {
      const updateData = { fullName: adminForm.fullName, email: adminForm.email };
      if (adminForm.newPassword) {
        updateData.password = adminForm.newPassword;
        updateData.currentPassword = adminForm.currentPassword;
      }
      await api.put('/admin/profile', updateData);
      showAccountMsg('Admin account updated successfully!');
      toast.success('Admin account updated successfully');
      setAdminForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      showAccountMsg(msg, 'error');
      toast.error(msg);
    } finally {
      setAccountLoading(false);
    }
  };

  const saveSystemSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('adminSystemSettings', JSON.stringify(systemSettings));
    showSystemMsg('System settings saved successfully!');
    toast.success('System settings saved');
  };

  const toggleMonitoringSchedule = (month) => {
    setSystemSettings(prev => ({
      ...prev,
      monitoringSchedule: prev.monitoringSchedule.includes(month)
        ? prev.monitoringSchedule.filter(m => m !== month)
        : [...prev.monitoringSchedule, month]
    }));
  };

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="page-header">
          <h1><i className="fas fa-cog"></i> SETTINGS</h1>
        </div>

        <div className="settings-grid">

          {/* Admin Account Card */}
          <div className="settings-card">
            <div className="card-title">
              <i className="fas fa-user-shield"></i> ADMIN ACCOUNT
            </div>
            <form onSubmit={updateAdminProfile}>
              <div className="form-group">
                <label>Admin Name</label>
                <input
                  type="text"
                  value={adminForm.fullName}
                  onChange={e => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  placeholder="Admin Name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Current Password <span style={{ fontWeight: 400, color: '#A98978' }}>(required to change password)</span></label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminForm.currentPassword}
                  onChange={e => setAdminForm({ ...adminForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password <span style={{ fontWeight: 400, color: '#A98978' }}>(optional)</span></label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminForm.newPassword}
                  onChange={e => setAdminForm({ ...adminForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminForm.confirmPassword}
                  onChange={e => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                />
                <label>Show Password</label>
              </div>
              <button type="submit" className="save-btn" disabled={accountLoading}>
                <i className="fas fa-save"></i> {accountLoading ? 'Updating...' : 'Update Account'}
              </button>
            </form>
            {accountMsg && (
              <div className={accountMsg.type === 'error' ? 'settings-error' : 'settings-success'}>
                <i className={`fas ${accountMsg.type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>{' '}
                {accountMsg.text}
              </div>
            )}
          </div>

          {/* System Settings Card */}
          <div className="settings-card">
            <div className="card-title">
              <i className="fas fa-sliders-h"></i> SYSTEM SETTINGS
            </div>
            <form onSubmit={saveSystemSettings}>
              <div className="form-group">
                <label>Grace Period</label>
                <select
                  value={systemSettings.gracePeriod}
                  onChange={e => setSystemSettings({ ...systemSettings, gracePeriod: e.target.value })}
                >
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours</option>
                  <option value="72">72 Hours</option>
                  <option value="96">96 Hours</option>
                  <option value="120">120 Hours (5 Days)</option>
                  <option value="168">168 Hours (7 Days)</option>
                </select>
                <small className="form-hint">Users have this long to reflect before their request is processed</small>
              </div>
              <div className="form-group">
                <label>Monitoring Schedule</label>
                <div className="schedule-options">
                  {[['1', '1 Month'], ['3', '3 Months'], ['6', '6 Months'], ['12', '1 Year']].map(([val, label]) => (
                    <label key={val}>
                      <input
                        type="checkbox"
                        value={val}
                        checked={systemSettings.monitoringSchedule.includes(val)}
                        onChange={() => toggleMonitoringSchedule(val)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <small className="form-hint">Adopters will be reminded to submit reports at these intervals</small>
              </div>
              <button type="submit" className="save-btn">
                <i className="fas fa-save"></i> Save Settings
              </button>
            </form>
            {systemMsg && (
              <div className={systemMsg.type === 'error' ? 'settings-error' : 'settings-success'}>
                <i className={`fas ${systemMsg.type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>{' '}
                {systemMsg.text}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminSettingsPage;
