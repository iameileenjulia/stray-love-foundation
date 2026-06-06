import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import './AdminPetsPage.css';

const AdminRequestsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [filters, setFilters] = useState({ status: [] });

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
      await api.put(`/admin/requests/${requestId}`, { status, adminResponse });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      fetchRequests();
      setShowDetailsModal(false);
      setSelectedRequest(null);
      setAdminResponse('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request');
    }
  };

  const toggleFilterOption = (group, value) => {
    setFilters(prev => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter(v => v !== value)
        : [...prev[group], value]
    }));
  };

  const openDetailsModal = (req) => {
    setSelectedRequest(req);
    setAdminResponse(req.adminResponse || '');
    setShowDetailsModal(true);
  };

  const gracePeriodActive = (req) =>
    req.gracePeriodEnd && new Date(req.gracePeriodEnd) > new Date();

  const filteredRequests = requests
    .filter(req => {
      if (searchTerm &&
        !req.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !req.pet?.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filters.status.length && !filters.status.includes(req.status)) return false;
      return true;
    });

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <main className="admin-content">
          <div className="no-data">Loading adoption requests...</div>
        </main>
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
            <span className="stat-badge">
              <i className="fas fa-clipboard-list"></i> Total: {requests.length}
            </span>
            <span className="stat-badge pending-count">
              <i className="fas fa-clock"></i> Pending: {pendingCount}
            </span>
            <span className="stat-badge verified-count">
              <i className="fas fa-check-circle"></i> Approved: {approvedCount}
            </span>
            <span className="stat-badge" style={{ background: '#FFE5D9', borderColor: '#FFD0C4', color: '#C27D62' }}>
              <i className="fas fa-times-circle"></i> Rejected: {rejectedCount}
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

        <div className="pets-table-container">
          <table className="pets-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Pet</th>
                <th>Request Date</th>
                <th>Grace Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req._id} className={req.status === 'Pending' ? 'pending-row' : ''}>
                  <td>
                    <strong>{req.user?.fullName}</strong><br />
                    <small style={{ color: '#A98978' }}>{req.user?.email}</small>
                  </td>
                  <td>
                    <strong>{req.pet?.name}</strong>
                    {req.pet?.type && <span style={{ fontSize: '0.78rem', color: '#A98978' }}> ({req.pet.type})</span>}
                  </td>
                  <td>{req.requestDate ? new Date(req.requestDate).toLocaleDateString() : '—'}</td>
                  <td>
                    {req.gracePeriodEnd ? (
                      gracePeriodActive(req) ? (
                        <span className="badge-pending"><i className="fas fa-hourglass-half"></i> ACTIVE</span>
                      ) : (
                        <span className="badge-rejected"><i className="fas fa-check"></i> EXPIRED</span>
                      )
                    ) : '—'}
                  </td>
                  <td>
                    {req.status === 'Approved' ? (
                      <span className="badge-verified"><i className="fas fa-check-circle"></i> APPROVED</span>
                    ) : req.status === 'Rejected' ? (
                      <span className="badge-rejected"><i className="fas fa-times-circle"></i> REJECTED</span>
                    ) : (
                      <span className="badge-pending"><i className="fas fa-clock"></i> PENDING</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" onClick={() => openDetailsModal(req)}>
                        <i className="fas fa-eye"></i> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="no-data">
              <i className="fas fa-file-alt" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#DDCAC0' }}></i>
              <p>No adoption requests found</p>
            </div>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-container filter-modal" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowFilterModal(false)}></i>
            <h2><i className="fas fa-filter"></i> Filter Requests</h2>
            <div className="filter-group">
              <label>Request Status</label>
              <div className="filter-options">
                {[['Pending', 'Pending'], ['Approved', 'Approved'], ['Rejected', 'Rejected']].map(([val, label]) => (
                  <label key={val}>
                    <input
                      type="checkbox"
                      checked={filters.status.includes(val)}
                      onChange={() => toggleFilterOption('status', val)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <button className="apply-filter-btn" onClick={() => setShowFilterModal(false)}>
              <i className="fas fa-check"></i> Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowDetailsModal(false)}></i>
            <h2><i className="fas fa-clipboard-list"></i> ADOPTION REQUEST</h2>

            <div className="user-details">
              <div className="detail-row">
                <span className="detail-label">Applicant:</span>
                <span className="detail-value">{selectedRequest.user?.fullName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedRequest.user?.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contact:</span>
                <span className="detail-value">{selectedRequest.user?.contact || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Verified:</span>
                <span className="detail-value">
                  {selectedRequest.user?.isVerified ? (
                    <span className="badge-verified"><i className="fas fa-check-circle"></i> YES</span>
                  ) : (
                    <span className="badge-pending"><i className="fas fa-clock"></i> NO</span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pet:</span>
                <span className="detail-value">
                  {selectedRequest.pet?.name} — {selectedRequest.pet?.type}, {selectedRequest.pet?.sex}, {selectedRequest.pet?.age}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Breed:</span>
                <span className="detail-value">{selectedRequest.pet?.breed || 'Mixed'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Request Date:</span>
                <span className="detail-value">
                  {selectedRequest.requestDate ? new Date(selectedRequest.requestDate).toLocaleString() : '—'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Grace Period:</span>
                <span className="detail-value">
                  {selectedRequest.gracePeriodEnd
                    ? `Ends ${new Date(selectedRequest.gracePeriodEnd).toLocaleString()} — `
                    : ''}
                  {gracePeriodActive(selectedRequest) ? (
                    <span style={{ color: '#4B7B6E', fontWeight: '600' }}>ACTIVE</span>
                  ) : (
                    <span style={{ color: '#E57A5C', fontWeight: '600' }}>EXPIRED</span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {selectedRequest.status === 'Approved' ? (
                    <span className="badge-verified"><i className="fas fa-check-circle"></i> APPROVED</span>
                  ) : selectedRequest.status === 'Rejected' ? (
                    <span className="badge-rejected"><i className="fas fa-times-circle"></i> REJECTED</span>
                  ) : (
                    <span className="badge-pending"><i className="fas fa-clock"></i> PENDING</span>
                  )}
                </span>
              </div>
            </div>

            {selectedRequest.applicationAnswers && (
              <div className="id-preview">
                <i className="fas fa-question-circle" style={{ fontSize: '1.5rem', color: '#C28A7A' }}></i>
                <p><strong>Application Answers</strong></p>
                {selectedRequest.applicationAnswers.reason && (
                  <p style={{ color: '#7F665A', marginTop: '0.5rem', textAlign: 'left' }}>
                    <strong>Why adopt:</strong> {selectedRequest.applicationAnswers.reason}
                  </p>
                )}
                {selectedRequest.applicationAnswers.experience && (
                  <p style={{ color: '#7F665A', marginTop: '0.3rem', textAlign: 'left' }}>
                    <strong>Experience:</strong> {selectedRequest.applicationAnswers.experience}
                  </p>
                )}
                {selectedRequest.applicationAnswers.livingCondition && (
                  <p style={{ color: '#7F665A', marginTop: '0.3rem', textAlign: 'left' }}>
                    <strong>Living condition:</strong> {selectedRequest.applicationAnswers.livingCondition}
                  </p>
                )}
                {selectedRequest.applicationAnswers.hasOtherPets && (
                  <p style={{ color: '#7F665A', marginTop: '0.3rem', textAlign: 'left' }}>
                    <strong>Other pets:</strong> {selectedRequest.applicationAnswers.hasOtherPets}
                  </p>
                )}
              </div>
            )}

            <div className="admin-notes">
              <label><strong>ADMIN RESPONSE</strong></label>
              <textarea
                rows="3"
                value={adminResponse}
                onChange={e => setAdminResponse(e.target.value)}
                placeholder="Type your response or notes here..."
              />
            </div>

            <div className="modal-actions">
              <button
                className="approve-btn"
                onClick={() => updateRequestStatus(selectedRequest._id, 'Approved')}
                disabled={selectedRequest.status === 'Approved'}
              >
                <i className="fas fa-check-circle"></i> Approve
              </button>
              <button
                className="reject-btn"
                onClick={() => updateRequestStatus(selectedRequest._id, 'Rejected')}
                disabled={selectedRequest.status === 'Rejected'}
              >
                <i className="fas fa-times-circle"></i> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPage;
