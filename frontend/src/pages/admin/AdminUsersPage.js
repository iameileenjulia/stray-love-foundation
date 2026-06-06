import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import './AdminPetsPage.css';

const AdminUsersPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filters, setFilters] = useState({ verification: [], status: [] });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (approved) => {
    if (!selectedUser) return;
    try {
      await api.put(`/admin/users/${selectedUser._id}/verify`, {
        isVerified: approved,
        verificationStatus: approved ? 'approved' : 'rejected',
        verificationNotes: adminNotes
      });
      toast.success(approved ? 'User approved successfully!' : 'User rejected');
      fetchUsers();
      setShowVerifyModal(false);
      setSelectedUser(null);
      setAdminNotes('');
    } catch (error) {
      toast.error('Failed to update user verification');
    }
  };

  const handleSuspend = async (userId, currentSuspended) => {
    try {
      await api.put(`/admin/users/${userId}/suspend`);
      toast.success(`User ${currentSuspended ? 'unsuspended' : 'suspended'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const openVerifyModal = (userData) => {
    setSelectedUser(userData);
    setAdminNotes('');
    setShowVerifyModal(true);
  };

  const toggleFilterOption = (group, value) => {
    setFilters(prev => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter(v => v !== value)
        : [...prev[group], value]
    }));
  };

  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  const filteredUsers = nonAdminUsers
    .filter(u => {
      if (searchTerm &&
        !u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !u.email?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filters.verification.length) {
        const vs = u.verificationStatus === 'approved' ? 'verified' : 'pending';
        if (!filters.verification.includes(vs)) return false;
      }
      if (filters.status.length) {
        const as = u.isSuspended ? 'suspended' : 'active';
        if (!filters.status.includes(as)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pendingCount = nonAdminUsers.filter(u => u.verificationStatus === 'pending').length;
  const verifiedCount = nonAdminUsers.filter(u => u.verificationStatus === 'approved').length;

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <main className="admin-content">
          <div className="no-data">Loading users...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="page-header">
          <h1><i className="fas fa-users"></i> MANAGE USERS</h1>
          <div className="stats-summary">
            <span className="stat-badge">
              <i className="fas fa-users"></i> Total: {nonAdminUsers.length}
            </span>
            <span className="stat-badge pending-count">
              <i className="fas fa-clock"></i> Pending: {pendingCount}
            </span>
            <span className="stat-badge verified-count">
              <i className="fas fa-check-circle"></i> Verified: {verifiedCount}
            </span>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by name or email..."
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
                <th>Name</th>
                <th>Email</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u._id} className={u.verificationStatus === 'pending' ? 'pending-row' : ''}>
                  <td><strong>{u.fullName}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    {u.verificationStatus === 'approved' ? (
                      <span className="badge-verified"><i className="fas fa-check-circle"></i> VERIFIED</span>
                    ) : u.verificationStatus === 'rejected' ? (
                      <span className="badge-rejected"><i className="fas fa-times-circle"></i> REJECTED</span>
                    ) : (
                      <span className="badge-pending"><i className="fas fa-clock"></i> PENDING</span>
                    )}
                  </td>
                  <td>
                    <span className={u.isSuspended ? 'status-suspended' : 'status-active'}>
                      {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" onClick={() => openVerifyModal(u)}>
                        <i className="fas fa-id-card"></i> Verify
                      </button>
                      <button className="action-btn delete" onClick={() => handleSuspend(u._id, u.isSuspended)}>
                        <i className={`fas ${u.isSuspended ? 'fa-user-check' : 'fa-ban'}`}></i>
                        {u.isSuspended ? ' Unsuspend' : ' Suspend'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="no-data">No users found</div>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-container filter-modal" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowFilterModal(false)}></i>
            <h2><i className="fas fa-filter"></i> Filter Users</h2>
            <div className="filter-group">
              <label>Verification</label>
              <div className="filter-options">
                {[['verified', 'Verified'], ['pending', 'Pending']].map(([val, label]) => (
                  <label key={val}>
                    <input
                      type="checkbox"
                      checked={filters.verification.includes(val)}
                      onChange={() => toggleFilterOption('verification', val)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Account Status</label>
              <div className="filter-options">
                {[['active', 'Active'], ['suspended', 'Suspended']].map(([val, label]) => (
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

      {/* Verify User Modal */}
      {showVerifyModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowVerifyModal(false)}></i>
            <h2><i className="fas fa-id-card"></i> VERIFY USER</h2>

            <div className="user-details">
              <div className="detail-row">
                <span className="detail-label">User Name:</span>
                <span className="detail-value">{selectedUser.fullName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedUser.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contact Number:</span>
                <span className="detail-value">{selectedUser.contact || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registered:</span>
                <span className="detail-value">{new Date(selectedUser.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Verification:</span>
                <span className="detail-value">
                  {selectedUser.verificationStatus === 'approved' ? (
                    <span className="badge-verified"><i className="fas fa-check-circle"></i> VERIFIED</span>
                  ) : selectedUser.verificationStatus === 'rejected' ? (
                    <span className="badge-rejected"><i className="fas fa-times-circle"></i> REJECTED</span>
                  ) : (
                    <span className="badge-pending"><i className="fas fa-clock"></i> PENDING</span>
                  )}
                </span>
              </div>
            </div>

            <div className="id-preview">
              <i className="fas fa-id-card" style={{ fontSize: '2rem', color: '#C28A7A' }}></i>
              <p><strong>Uploaded Valid ID:</strong> {selectedUser.idFileName || 'No ID uploaded'}</p>
              {selectedUser.idImageData ? (
                <img src={selectedUser.idImageData} alt="ID Preview" />
              ) : (
                <p style={{ color: '#A98978' }}>No preview available</p>
              )}
            </div>

            <div className="admin-notes">
              <label><strong>ADMIN NOTES</strong></label>
              <textarea
                rows="3"
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Type your notes here..."
              />
            </div>

            <div className="modal-actions">
              <button className="approve-btn" onClick={() => handleVerify(true)}>
                <i className="fas fa-check-circle"></i> Approve
              </button>
              <button className="reject-btn" onClick={() => handleVerify(false)}>
                <i className="fas fa-times-circle"></i> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
