import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminRequestsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [filters, setFilters] = useState({ status: [] });
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      await api.put(`/admin/requests/${requestId}`, {
        status,
        adminResponse
      });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      fetchRequests();
      setShowDetailsModal(false);
      setAdminResponse('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request');
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
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (searchTerm && !req.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !req.pet?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.status.length && !filters.status.includes(req.status)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <div className="admin-loading">Loading adoption requests...</div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="page-header">
          <h1><i className="fas fa-file-alt"></i> ADOPTION REQUESTS</h1>
          <div className="stats-summary">
            <span className="stat-badge pending-count">
              <i className="fas fa-clock"></i> Pending: {requests.filter(r => r.status === 'Pending').length}
            </span>
            <span className="stat-badge verified-count">
              <i className="fas fa-check-circle"></i> Approved: {requests.filter(r => r.status === 'Approved').length}
            </span>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by user or pet name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-btn" onClick={() => setShowFilterModal(true)}>
            <i className="fas fa-sliders-h"></i> Filter
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Pet</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req._id}>
                  <td>
                    <strong>{req.user?.fullName}</strong><br />
                    <small style={{ color: '#A98978' }}>{req.user?.email}</small>
                  </td>
                  <td><strong>{req.pet?.name}</strong> (<span style={{ fontSize: '12px' }}>{req.pet?.type}</span>)</td>
                  <td>{new Date(req.requestDate).toLocaleDateString()}</td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td>
                    <button 
                      className="action-btn view"
                      onClick={() => {
                        setSelectedRequest(req);
                        setAdminResponse(req.adminResponse || '');
                        setShowDetailsModal(true);
                      }}
                    >
                      <i className="fas fa-eye"></i> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="no-data">No adoption requests found</div>
          )}
        </div>
      </main>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay active" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowDetailsModal(false)}></i>
            <h2><i className="fas fa-clipboard-list"></i> Adoption Request Details</h2>
            
            <div className="detail-section">
              <h3><i className="fas fa-user"></i> Applicant Information</h3>
              <div className="detail-row"><span className="detail-label">Name:</span> {selectedRequest.user?.fullName}</div>
              <div className="detail-row"><span className="detail-label">Email:</span> {selectedRequest.user?.email}</div>
              <div className="detail-row"><span className="detail-label">Contact:</span> {selectedRequest.user?.contact}</div>
              <div className="detail-row"><span className="detail-label">Verified:</span> {selectedRequest.user?.isVerified ? 'Yes' : 'No'}</div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-paw"></i> Pet Information</h3>
              <div className="detail-row"><span className="detail-label">Name:</span> {selectedRequest.pet?.name}</div>
              <div className="detail-row"><span className="detail-label">Type:</span> {selectedRequest.pet?.type}</div>
              <div className="detail-row"><span className="detail-label">Sex:</span> {selectedRequest.pet?.sex}</div>
              <div className="detail-row"><span className="detail-label">Age:</span> {selectedRequest.pet?.age}</div>
              <div className="detail-row"><span className="detail-label">Breed:</span> {selectedRequest.pet?.breed || 'Mixed'}</div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-question-circle"></i> Application Answers</h3>
              <div className="detail-row"><span className="detail-label">Reason:</span> {selectedRequest.applicationAnswers?.reason}</div>
              <div className="detail-row"><span className="detail-label">Experience:</span> {selectedRequest.applicationAnswers?.experience}</div>
              <div className="detail-row"><span className="detail-label">Living Condition:</span> {selectedRequest.applicationAnswers?.livingCondition}</div>
              <div className="detail-row"><span className="detail-label">Other Pets:</span> {selectedRequest.applicationAnswers?.hasOtherPets || 'No'}</div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-hourglass-half"></i> 72-Hour Grace Period</h3>
              <div className="detail-row"><span className="detail-label">Request Date:</span> {new Date(selectedRequest.requestDate).toLocaleString()}</div>
              <div className="detail-row"><span className="detail-label">Grace Period Ends:</span> {new Date(selectedRequest.gracePeriodEnd).toLocaleString()}</div>
              <div className="detail-row"><span className="detail-label">Status:</span> 
                {new Date(selectedRequest.gracePeriodEnd) > new Date() ? 
                  <span style={{ color: '#4B7B6E' }}>ACTIVE</span> : 
                  <span style={{ color: '#E57A5C' }}>EXPIRED</span>}
              </div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-comment-dots"></i> Admin Response</h3>
              <textarea
                rows="3"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Type your response here..."
                style={{ width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #FFDDD0', resize: 'vertical' }}
              />
            </div>

            <div className="modal-actions">
              <button className="approve-btn" onClick={() => updateRequestStatus(selectedRequest._id, 'Approved')}>
                <i className="fas fa-check-circle"></i> Approve Request
              </button>
              <button className="reject-btn" onClick={() => updateRequestStatus(selectedRequest._id, 'Rejected')}>
                <i className="fas fa-times-circle"></i> Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay active" onClick={() => setShowFilterModal(false)}>
          <div className="modal-container filter-modal" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowFilterModal(false)}></i>
            <h2><i className="fas fa-filter"></i> Filter Requests</h2>
            <div className="filter-group">
              <label>Status</label>
              <div className="filter-options">
                <label><input type="checkbox" value="Pending" onChange={(e) => {
                  if (e.target.checked) setFilters({ ...filters, status: [...filters.status, 'Pending'] });
                  else setFilters({ ...filters, status: filters.status.filter(s => s !== 'Pending') });
                }} /> Pending</label>
                <label><input type="checkbox" value="Approved" onChange={(e) => {
                  if (e.target.checked) setFilters({ ...filters, status: [...filters.status, 'Approved'] });
                  else setFilters({ ...filters, status: filters.status.filter(s => s !== 'Approved') });
                }} /> Approved</label>
                <label><input type="checkbox" value="Rejected" onChange={(e) => {
                  if (e.target.checked) setFilters({ ...filters, status: [...filters.status, 'Rejected'] });
                  else setFilters({ ...filters, status: filters.status.filter(s => s !== 'Rejected') });
                }} /> Rejected</label>
              </div>
            </div>
            <button className="apply-filter-btn" onClick={() => setShowFilterModal(false)}>Apply Filter</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPage;
