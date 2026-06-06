import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import './AdminPetsPage.css';

const AdminPostsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({ visibility: [] });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchPosts();
  }, [user, navigate]);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/admin/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (postId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'hidden' ? 'approved' : 'hidden';
      await api.put(`/admin/posts/${postId}/visibility`, { adminStatus: newStatus });
      toast.success(`Post ${newStatus === 'hidden' ? 'hidden' : 'approved'} successfully`);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const deletePost = async () => {
    if (!selectedPost) return;
    try {
      await api.delete(`/admin/posts/${selectedPost._id}`);
      toast.success('Post deleted successfully');
      fetchPosts();
      setShowDeleteModal(false);
      setSelectedPost(null);
    } catch (error) {
      toast.error('Failed to delete post');
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

  const getDisplayVisibility = (post) =>
    post.adminStatus === 'hidden' ? 'hidden' : post.visibility;

  const filteredPosts = posts.filter(post => {
    if (searchTerm &&
      !post.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !post.petName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.visibility.length && !filters.visibility.includes(getDisplayVisibility(post))) return false;
    return true;
  });

  const publicCount  = posts.filter(p => p.visibility === 'public' && p.adminStatus !== 'hidden').length;
  const privateCount = posts.filter(p => p.visibility === 'private' && p.adminStatus !== 'hidden').length;
  const hiddenCount  = posts.filter(p => p.adminStatus === 'hidden').length;

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <main className="admin-content">
          <div className="no-data">Loading posts...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="page-header">
          <h1><i className="fas fa-newspaper"></i> PUBLIC POSTS</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <i className="fas fa-globe"></i>
            <div className="stat-number">{publicCount}</div>
            <div className="stat-label">Public</div>
          </div>
          <div className="stat-card">
            <i className="fas fa-lock"></i>
            <div className="stat-number">{privateCount}</div>
            <div className="stat-label">Private</div>
          </div>
          <div className="stat-card">
            <i className="fas fa-eye-slash"></i>
            <div className="stat-number">{hiddenCount}</div>
            <div className="stat-label">Hidden</div>
          </div>
          <div className="stat-card">
            <i className="fas fa-pen"></i>
            <div className="stat-number">{posts.length}</div>
            <div className="stat-label">Total Posts</div>
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
                <th>Caption</th>
                <th>Visibility</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => {
                const vis = getDisplayVisibility(post);
                return (
                  <tr key={post._id}>
                    <td>
                      <strong>{post.authorName}</strong><br />
                      <small style={{ color: '#A98978' }}>{post.authorEmail}</small>
                    </td>
                    <td><strong>{post.petName || 'Adopted Pet'}</strong></td>
                    <td style={{ maxWidth: '200px' }}>
                      {post.caption?.substring(0, 60)}{post.caption?.length > 60 ? '...' : ''}
                    </td>
                    <td>
                      {vis === 'public' && (
                        <span className="visibility-badge visibility-public">
                          <i className="fas fa-globe"></i> PUBLIC
                        </span>
                      )}
                      {vis === 'private' && (
                        <span className="visibility-badge visibility-private">
                          <i className="fas fa-lock"></i> PRIVATE
                        </span>
                      )}
                      {vis === 'hidden' && (
                        <span className="visibility-badge visibility-hidden">
                          <i className="fas fa-eye-slash"></i> HIDDEN
                        </span>
                      )}
                    </td>
                    <td>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="action-buttons">
                        {post.adminStatus !== 'hidden' ? (
                          <button className="action-btn hide" onClick={() => toggleVisibility(post._id, post.adminStatus)}>
                            <i className="fas fa-eye-slash"></i> Hide
                          </button>
                        ) : (
                          <button className="action-btn approve" onClick={() => toggleVisibility(post._id, post.adminStatus)}>
                            <i className="fas fa-eye"></i> Approve
                          </button>
                        )}
                        <button className="action-btn delete" onClick={() => { setSelectedPost(post); setShowDeleteModal(true); }}>
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPosts.length === 0 && (
            <div className="no-data">
              <i className="fas fa-newspaper" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#DDCAC0' }}></i>
              <p>No posts found</p>
            </div>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-container filter-modal" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowFilterModal(false)}></i>
            <h2><i className="fas fa-filter"></i> Filter Posts</h2>
            <div className="filter-group">
              <label>Visibility</label>
              <div className="filter-options">
                {[['public', 'Public'], ['private', 'Private'], ['hidden', 'Hidden']].map(([val, label]) => (
                  <label key={val}>
                    <input
                      type="checkbox"
                      checked={filters.visibility.includes(val)}
                      onChange={() => toggleFilterOption('visibility', val)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPost && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setSelectedPost(null); }}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => { setShowDeleteModal(false); setSelectedPost(null); }}></i>
            <h2><i className="fas fa-trash-alt"></i> Delete Post</h2>
            <div className="user-details" style={{ margin: '1rem 0' }}>
              <div className="detail-row">
                <span className="detail-label">Author:</span>
                <span className="detail-value">{selectedPost.authorName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pet:</span>
                <span className="detail-value">{selectedPost.petName || 'Adopted Pet'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Caption:</span>
                <span className="detail-value">{selectedPost.caption?.substring(0, 80)}</span>
              </div>
            </div>
            <p style={{ color: '#A98978', fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.5rem' }}>
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={deletePost}>
                <i className="fas fa-trash"></i> Delete
              </button>
              <button className="cancel-btn" onClick={() => { setShowDeleteModal(false); setSelectedPost(null); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPostsPage;
