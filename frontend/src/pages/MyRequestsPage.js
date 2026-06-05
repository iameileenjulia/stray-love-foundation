import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const MyRequestsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
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

  const cancelRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this adoption request?')) {
      try {
        await api.delete(`/adoptions/${requestId}`);
        toast.success('Request cancelled successfully');
        fetchRequests();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel request');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending':
        return <span className="status-badge status-pending"><i className="fas fa-clock"></i> PENDING</span>;
      case 'Approved':
        return <span className="status-badge status-approved"><i className="fas fa-check-circle"></i> APPROVED</span>;
      case 'Rejected':
        return <span className="status-badge status-rejected"><i className="fas fa-times-circle"></i> REJECTED</span>;
      case 'Cancelled':
        return <span className="status-badge status-cancelled"><i className="fas fa-ban"></i> CANCELLED</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading) {
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
                <li><Link to="/dashboard/profile"><i className="fas fa-user-circle"></i> Profile</Link></li>
              </ul>
            </nav>
          </aside>
          <main className="main-content">
            <div style={{ textAlign: 'center', padding: '50px' }}>Loading requests...</div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
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
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <div className="requests-header">
            <h1><i className="fas fa-file-alt"></i> My Adoption Requests</h1>
          </div>

          <div className="requests-table">
            <table>
              <thead>
                <tr>
                  <th>Pet Name</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id}>
                    <td><strong>{req.pet?.name || 'Pet'}</strong></td>
                    <td>{new Date(req.requestDate).toLocaleDateString()}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      <button 
                        className="btn-details"
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowDetailsModal(true);
                        }}
                      >
                        View Details
                      </button>
                      {req.status === 'Pending' && (
                        <button 
                          className="btn-cancel"
                          onClick={() => cancelRequest(req._id)}
                          style={{ marginLeft: '0.5rem', background: '#FFE5D9', color: '#C27D62', border: 'none', padding: '0.3rem 1rem', borderRadius: '60px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-inbox fa-3x"></i>
                <p>No adoption requests yet. Start by adopting a pet!</p>
                <Link to="/dashboard/browse" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Browse Pets</Link>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay active" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowDetailsModal(false)}></i>
            <h2><i className="fas fa-info-circle"></i> Request Details</h2>
            
            <div className="detail-row"><strong>Pet:</strong> {selectedRequest.pet?.name}</div>
            <div className="detail-row"><strong>Request Date:</strong> {new Date(selectedRequest.requestDate).toLocaleString()}</div>
            <div className="detail-row"><strong>Status:</strong> {getStatusBadge(selectedRequest.status)}</div>
            <div className="detail-row"><strong>Grace Period Ends:</strong> {new Date(selectedRequest.gracePeriodEnd).toLocaleString()}</div>
            
            <h3 style={{ marginTop: '1.5rem', color: '#936E5C' }}>Your Application</h3>
            <div className="detail-row"><strong>Reason:</strong> {selectedRequest.applicationAnswers?.reason}</div>
            <div className="detail-row"><strong>Experience:</strong> {selectedRequest.applicationAnswers?.experience}</div>
            <div className="detail-row"><strong>Living Condition:</strong> {selectedRequest.applicationAnswers?.livingCondition}</div>
            
            {selectedRequest.adminResponse && (
              <>
                <h3 style={{ marginTop: '1.5rem', color: '#936E5C' }}>Admin Response</h3>
                <div className="admin-response" style={{ background: '#F9F4EF', padding: '1rem', borderRadius: '20px' }}>
                  {selectedRequest.adminResponse}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MyRequestsPage;
