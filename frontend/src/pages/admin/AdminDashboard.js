import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    pendingRequests: 0,
    completedAdoptions: 0,
    totalPets: 0,
    availablePets: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchStats();
    fetchRecentActivity();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await api.get('/admin/activities');
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="welcome-card">
          <h1>Welcome, <span>{user?.fullName?.split(' ')[0] || 'Admin'}</span></h1>
          <div className="admin-badge">
            <i className="fas fa-shield-alt"></i> Administrator
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <i className="fas fa-user-clock"></i>
            <div className="stat-number">{stats.pendingVerifications}</div>
            <div className="stat-label">Pending Verifications</div>
          </div>
          <div className="stat-card">
            <i className="fas fa-hourglass-half"></i>
            <div className="stat-number">{stats.pendingRequests}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
          <div className="stat-card">
            <i className="fas fa-check-circle"></i>
            <div className="stat-number">{stats.completedAdoptions}</div>
            <div className="stat-label">Completed Adoptions</div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <i className="fas fa-dog"></i>
            <div className="stat-number">{stats.totalPets}</div>
            <div className="stat-label">TOTAL PETS</div>
          </div>
          <div className="stat-card">
            <i className="fas fa-users"></i>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">TOTAL USERS</div>
          </div>
          <div className="stat-card">
            <i className="fas fa-paw"></i>
            <div className="stat-number">{stats.availablePets}</div>
            <div className="stat-label">AVAILABLE PETS</div>
          </div>
        </div>

        <div className="recent-activity">
          <h3><i className="fas fa-history"></i> RECENT ACTIVITY</h3>
          <ul className="activity-list">
            {recentActivity.length === 0 ? (
              <li><i className="fas fa-info-circle"></i> No recent activity</li>
            ) : (
              recentActivity.map((activity, index) => (
                <li key={index}>
                  <i className={`fas ${activity.icon}`}></i>
                  {activity.text}
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
