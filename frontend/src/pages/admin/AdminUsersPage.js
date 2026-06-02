import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import './AdminPetsPage.css'; // Use same CSS as Manage Pets

const AdminUsersPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

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
      const status = approved ? 'approved' : 'rejected';
      await api.put(`/admin/users/${selectedUser._id}/verify`, {
        isVerified: approved,
        verificationStatus: status,
        verificationNotes: adminNotes
      });
      
      toast.success(approved ? 'User verified successfully!' : 'User rejected');
      fetchUsers();
      setShowVerifyModal(false);
      setSelectedUser(null);
      setAdminNotes('');
    } catch (error) {
      toast.error('Failed to verify user');
    }
  };

  const handleSuspend = async (userId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'unsuspend' : 'suspend'} this user?`)) {
      try {
        await api.put(`/admin/users/${userId}/suspend`);
        toast.success(`User ${currentStatus ? 'unsuspended' : 'suspended'} successfully`);
        fetchUsers();
      } catch (error) {
        toast.error('Operation failed');
      }
    }
  };

  const openVerifyModal = (userData) => {
    setSelectedUser(userData);
    setAdminNotes('');
    setShowVerifyModal(true);
  };

  const filteredUsers = users.filter(u => {
    if (searchTerm && !u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !u.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <div className="admin-loading">Loading users...</div>
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
              <i className="fas fa-users"></i> Total: {users.length}
            </span>
            <span className="stat-badge pending-count">
              <i className="fas fa-clock"></i> Pending: {users.filter(u => u.verificationStatus === 'pending').length}
            </span>
            <span className="stat-badge verified-count">
              <i className="fas fa-check-circle"></i> Verified: {users.filter(u => u.verificationStatus === 'approved').length}
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
        </div>

        <div className="pets-table-container">
          <table className="pets-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Registered</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(u => (
                <tr key={u._id} className={u.verificationStatus === 'pending' ? 'pending-row' : ''}>
                  <td>
                    <div>
                      <div className="user-name" style={{ fontWeight: '600', color: '#5E4B3F' }}>{u.fullName}</div>
                      <div className="user-email" style={{ fontSize: '0.75rem', color: '#A98978' }}>{u.email}</div>
                    </div>
                  </td>
                  <td>{u.contact}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
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
                      {u.verificationStatus === 'pending' && (
                        <button className="action-btn view" onClick={() => openVerifyModal(u)}>
                          <i className="fas fa-id-card"></i> Verify
                        </button>
                      )}
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
          {sortedUsers.length === 0 && (
            <div className="no-data">No users found</div>
          )}
        </div>
      </main>

      {/* Verify Modal */}
      {showVerifyModal && selectedUser && (
        <div className="modal-overlay active" onClick={() => setShowVerifyModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowVerifyModal(false)}></i>
            <h2><i className="fas fa-id-card"></i> Verify User</h2>
            
            <div className="user-details">
              <div className="detail-row">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">{selectedUser.fullName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedUser.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contact:</span>
                <span className="detail-value">{selectedUser.contact}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registered:</span>
                <span className="detail-value">{new Date(selectedUser.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="id-preview">
              <i className="fas fa-id-card" style={{ fontSize: '2rem', color: '#C28A7A' }}></i>
              <p><strong>Uploaded ID:</strong> {selectedUser.idFileName || 'No ID uploaded'}</p>
              {selectedUser.idImageData && (
                <img src={selectedUser.idImageData} alt="User ID" />
              )}
            </div>

            <div className="admin-notes">
              <label>Admin Notes</label>
              <textarea
                rows="3"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this verification..."
              />
            </div>

            <div className="modal-actions">
              <button className="approve-btn" onClick={() => handleVerify(true)}>
                <i className="fas fa-check-circle"></i> Approve User
              </button>
              <button className="reject-btn" onClick={() => handleVerify(false)}>
                <i className="fas fa-times-circle"></i> Reject User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
