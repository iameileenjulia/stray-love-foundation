import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    adoptionRequests: 0,
    approvedPets: 0,
    pendingMonitoring: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserStats();
    fetchUserActivity();
  }, [user, navigate]);

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/users/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const response = await api.get('/users/activity');
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Error fetching activity:', error);
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
          <li><Link to="/dashboard" className="active"><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
          <li><Link to="/dashboard/browse"><i className="fas fa-search"></i> Browse Pets</Link></li>
          <li><Link to="/dashboard/my-requests"><i className="fas fa-file-alt"></i> My Requests</Link></li>
          <li><Link to="/dashboard/monitoring"><i className="fas fa-clock"></i> Monitoring</Link></li>
          <li><Link to="/dashboard/posts"><i className="fas fa-newspaper"></i> Public Posts</Link></li>
          <li><Link to="/dashboard/profile"><i className="fas fa-user-circle"></i> Profile</Link></li>
          <li>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <Sidebar />
          <main className="main-content">
            <div style={{ textAlign: 'center', padding: '50px', color: '#A98978' }}>
              <i className="fas fa-paw fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
              Loading your dashboard...
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <Sidebar />

        <main className="main-content">
          {/* Welcome Card */}
          <div className="welcome-card">
            <h1>
              Welcome, <span>{user?.fullName?.split(' ')[0] || 'User'}</span>
            </h1>
            <div className={`verification-badge${isVerified ? '' : ' pending'}`}>
              <i className={`fas ${isVerified ? 'fa-check-circle' : 'fa-clock'}`}></i>
              Verification Status: <strong>{isVerified ? 'Verified' : (user?.verificationStatus === 'rejected' ? 'Rejected' : 'Pending')}</strong>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <i className="fas fa-file-signature"></i>
              <div className="stat-number">{stats.adoptionRequests}</div>
              <div className="stat-label">Adoption Requests</div>
            </div>
            <div className="stat-card">
              <i className="fas fa-paw"></i>
              <div className="stat-number">{stats.approvedPets}</div>
              <div className="stat-label">Approved Pets</div>
            </div>
            <div className="stat-card">
              <i className="fas fa-hourglass-half"></i>
              <div className="stat-number">{stats.pendingMonitoring}</div>
              <div className="stat-label">Pending Monitoring</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity">
            <h3><i className="fas fa-history"></i> RECENT ACTIVITY</h3>
            <ul className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <li key={index}>
                    <i className={`fas ${activity.icon}`}></i>
                    {activity.text}
                  </li>
                ))
              ) : (
                <>
                  <li><i className="fas fa-info-circle"></i> No recent activity yet</li>
                  <li style={{ color: '#BBA49B', fontSize: '0.85rem' }}>
                    <i className="fas fa-arrow-right"></i>
                    <Link to="/dashboard/browse" style={{ color: '#C27D62', textDecoration: 'none' }}>
                      Browse pets to get started
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default DashboardPage;
