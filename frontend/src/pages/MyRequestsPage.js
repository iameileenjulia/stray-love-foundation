import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const MyRequestsPage = () => {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/adoptions/my-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async () => {
    if (!selectedRequest) return;
    if (!window.confirm('Are you sure you want to cancel this adoption request? This action cannot be undone.')) return;
    setCancelling(true);
    try {
      await api.delete(`/adoptions/${selectedRequest._id}`);
      toast.success('Request cancelled successfully');
      setShowDetailsModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getGracePeriodStatus = (gracePeriodEnd) => {
    if (!gracePeriodEnd) return null;
    const now = new Date();
    const end = new Date(gracePeriodEnd);
    const isActive = now < end;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '0.2rem 0.7rem', borderRadius: '60px', fontSize: '0.78rem', fontWeight: 700,
        background: isActive ? '#E0F2E9' : '#F0F0F0',
        color: isActive ? '#4B7B6E' : '#999'
      }}>
        <i className={`fas ${isActive ? 'fa-hourglass-half' : 'fa-check'}`}></i>
        {isActive ? 'ACTIVE' : 'EXPIRED'}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      Pending:   { cls: 'status-pending',   icon: 'fa-clock' },
      Approved:  { cls: 'status-approved',  icon: 'fa-check-circle' },
      Rejected:  { cls: 'status-rejected',  icon: 'fa-times-circle' },
      Cancelled: { cls: 'status-cancelled', icon: 'fa-ban' },
    };
    const { cls, icon } = map[status] || { cls: '', icon: 'fa-question-circle' };
    return (
      <span className={`req-status-badge ${cls}`}>
        <i className={`fas ${icon}`}></i> {status}
      </span>
    );
  };

  const Sidebar = () => (
    <aside className="sidebar">
      <h3><i className="fas fa-paw"></i> Menu</h3>
      <nav>
        <ul>
          <li><Link to="/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
          <li><Link to="/dashboard/browse"><i className="fas fa-search"></i> Browse Pets</Link></li>
          <li><Link to="/dashboard/my-requests" className="active"><i className="fas fa-file-alt"></i> My Requests</Link></li>
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
              Loading your requests...
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
          {/* Page Header */}
          <div className="requests-header">
            <h1><i className="fas fa-file-alt" style={{ color: '#C28A7A', marginRight: '0.5rem' }}></i> My Requests</h1>
          </div>

          {/* Requests Table */}
          <div className="requests-table">
            {requests.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox" style={{ fontSize: '2.5rem', color: '#DDCAC0', display: 'block', marginBottom: '0.8rem' }}></i>
                <p>No adoption requests yet. Start by adopting a pet!</p>
                <Link
                  to="/dashboard/browse"
                  className="btn-primary"
                  style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
                >
                  Browse Pets
                </Link>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Pet Name</th>
                    <th>Date</th>
                    <th>Grace Period</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req._id}>
                      <td>
                        <strong>{req.pet?.name || 'Unknown Pet'}</strong>
                        {req.pet?.type && (
                          <div style={{ fontSize: '0.8rem', color: '#A98978', marginTop: '2px' }}>
                            {req.pet.type} · {req.pet.sex} · {req.pet.age}
                          </div>
                        )}
                      </td>
                      <td>{new Date(req.requestDate).toLocaleDateString()}</td>
                      <td>{getGracePeriodStatus(req.gracePeriodEnd)}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td>
                        <button
                          className="btn-details"
                          onClick={() => { setSelectedRequest(req); setShowDetailsModal(true); }}
                        >
                          Request Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowDetailsModal(false)}></i>
            <h2><i className="fas fa-info-circle"></i> Request Details</h2>

            <div className="detail-row">
              <span className="detail-label">Pet:</span>
              <span className="detail-value">
                <strong>{selectedRequest.pet?.name}</strong>
                {selectedRequest.pet?.type && ` — ${selectedRequest.pet.type}, ${selectedRequest.pet.sex}, ${selectedRequest.pet.age}`}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Request Date:</span>
              <span className="detail-value">{new Date(selectedRequest.requestDate).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{getStatusBadge(selectedRequest.status)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Grace Period:</span>
              <span className="detail-value">
                {getGracePeriodStatus(selectedRequest.gracePeriodEnd)}
                <span style={{ marginLeft: '8px', fontSize: '0.82rem', color: '#A98978' }}>
                  Ends: {selectedRequest.gracePeriodEnd ? new Date(selectedRequest.gracePeriodEnd).toLocaleString() : '—'}
                </span>
              </span>
            </div>

            <div style={{ borderTop: '1px solid #FFE2D4', margin: '1rem 0', paddingTop: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#936E5C', marginBottom: '0.8rem', fontSize: '0.95rem' }}>
                <i className="fas fa-clipboard-list" style={{ marginRight: '6px' }}></i> Your Application
              </div>
              <div className="detail-row">
                <span className="detail-label">Reason:</span>
                <span className="detail-value">{selectedRequest.applicationAnswers?.reason || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Experience:</span>
                <span className="detail-value">{selectedRequest.applicationAnswers?.experience || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Living condition:</span>
                <span className="detail-value">{selectedRequest.applicationAnswers?.livingCondition || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Other pets:</span>
                <span className="detail-value">{selectedRequest.applicationAnswers?.hasOtherPets || '—'}</span>
              </div>
            </div>

            {selectedRequest.adminResponse && (
              <div style={{ borderTop: '1px solid #FFE2D4', margin: '0 0 1rem', paddingTop: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#936E5C', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                  <i className="fas fa-user-shield" style={{ marginRight: '6px' }}></i> Admin Response
                </div>
                <div className="admin-response">
                  {selectedRequest.adminResponse}
                </div>
              </div>
            )}

            {selectedRequest.status === 'Pending' && (
              <button
                className="cancel-req-btn"
                disabled={cancelling}
                onClick={cancelRequest}
              >
                <i className="fas fa-trash-alt"></i> {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MyRequestsPage;
