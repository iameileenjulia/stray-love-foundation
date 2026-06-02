import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminPostsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filters, setFilters] = useState({ visibility: [] });
  const [showFilterModal, setShowFilterModal] = useState(false);

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

  const togglePostVisibility = async (postId, currentStatus) => {
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

  const getVisibilityBadge = (post) => {
    const visibility = post.adminStatus === 'hidden' ? 'hidden' : post.visibility;
    switch(visibility) {
      case 'public':
        return <span className="visibility-badge public"><i className="fas fa-globe"></i> PUBLIC</span>;
      case 'private':
        return <span className="visibility-badge private"><i className="fas fa-lock"></i> PRIVATE</span>;
      case 'hidden':
        return <span className="visibility-badge hidden"><i className="fas fa-eye-slash"></i> HIDDEN</span>;
      default:
        return <span>{visibility}</span>;
    }
  };

  const filteredPosts = posts.filter(post => {
    if (searchTerm && !post.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !post.petName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.visibility.length) {
      const displayVisibility = post.adminStatus === 'hidden' ? 'hidden' : post.visibility;
      if (!filters.visibility.includes(displayVisibility)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <div className="admin-loading">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="page-header">
          <h1><i className="fas fa-newspaper"></i> PUBLIC POSTS MANAGEMENT</h1>
          <div className="stats-summary">
            <span className="stat-badge">
              <i className="fas fa-globe"></i> Public: {posts.filter(p => p.visibility === 'public' && p.adminStatus !== 'hidden').length}
            </span>
            <span className="stat-badge">
              <i className="fas fa-lock"></i> Private: {posts.filter(p => p.visibility === 'private' && p.adminStatus !== 'hidden').length}
            </span>
            <span className="stat-badge pending-count">
              <i className="fas fa-eye-slash"></i> Hidden: {posts.filter(p => p.adminStatus === 'hidden').length}
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
                <th>Caption</th>
                <th>Visibility</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => (
                <tr key={post._id}>
                  <td>
                    <strong>{post.authorName}</strong><br />
                    <small style={{ color: '#A98978' }}>{post.authorEmail}</small>
                  </td>
                  <td><strong>{post.petName || 'Adopted Pet'}</strong></td>
                  <td>{post.caption?.substring(0, 60)}{post.caption?.length > 60 ? '...' : ''}</td>
                  <td>{getVisibilityBadge(post)}</td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {post.adminStatus !== 'hidden' ? (
                        <button className="action-btn hide" onClick={() => togglePostVisibility(post._id, post.adminStatus)}>
                          <i className="fas fa-eye-slash"></i> Hide
                        </button>
                      ) : (
                        <button className="action-btn approve" onClick={() => togglePostVisibility(post._id, post.adminStatus)}>
                          <i className="fas fa-eye"></i> Approve
                        </button>
                      )}
                      <button className="action-btn delete" onClick={() => {
                        setSelectedPost(post);
                        setShowDeleteModal(true);
                      }}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPosts.length === 0 && (
            <div className="no-data">No posts found</div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPost && (
        <div className="modal-overlay active" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowDeleteModal(false)}></i>
            <h2><i className="fas fa-trash-alt"></i> Delete Post</h2>
            <p>Are you sure you want to delete this post?</p>
            <p><strong>Author:</strong> {selectedPost.authorName}</p>
            <p><strong>Pet:</strong> {selectedPost.petName}</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={deletePost}>Delete</button>
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay active" onClick={() => setShowFilterModal(false)}>
          <div className="modal-container filter-modal" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowFilterModal(false)}></i>
            <h2><i className="fas fa-filter"></i> Filter Posts</h2>
            <div className="filter-group">
              <label>Visibility</label>
              <div className="filter-options">
                <label><input type="checkbox" value="public" onChange={(e) => {
                  if (e.target.checked) setFilters({ ...filters, visibility: [...filters.visibility, 'public'] });
                  else setFilters({ ...filters, visibility: filters.visibility.filter(v => v !== 'public') });
                }} /> Public</label>
                <label><input type="checkbox" value="private" onChange={(e) => {
                  if (e.target.checked) setFilters({ ...filters, visibility: [...filters.visibility, 'private'] });
                  else setFilters({ ...filters, visibility: filters.visibility.filter(v => v !== 'private') });
                }} /> Private</label>
                <label><input type="checkbox" value="hidden" onChange={(e) => {
                  if (e.target.checked) setFilters({ ...filters, visibility: [...filters.visibility, 'hidden'] });
                  else setFilters({ ...filters, visibility: filters.visibility.filter(v => v !== 'hidden') });
                }} /> Hidden</label>
              </div>
            </div>
            <button className="apply-filter-btn" onClick={() => setShowFilterModal(false)}>Apply Filter</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPostsPage;
