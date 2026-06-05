import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const PublicPostsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    caption: '',
    visibility: 'public',
    imageData: null
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPosts();
  }, [user, navigate]);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.caption.trim()) {
      toast.error('Please enter a caption');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/posts', newPost);
      toast.success('Post published successfully!');
      setShowCreateModal(false);
      setNewPost({ caption: '', visibility: 'public', imageData: null });
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPost({ ...newPost, imageData: reader.result });
      };
      reader.readAsDataURL(file);
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
            <div style={{ textAlign: 'center', padding: '50px' }}>Loading posts...</div>
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
              <li><Link to="/dashboard/my-requests"><i className="fas fa-file-alt"></i> My Requests</Link></li>
              <li><Link to="/dashboard/monitoring"><i className="fas fa-clock"></i> Monitoring</Link></li>
              <li><Link to="/dashboard/posts" className="active"><i className="fas fa-newspaper"></i> Public Posts</Link></li>
              <li><Link to="/dashboard/profile"><i className="fas fa-user-circle"></i> Profile</Link></li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1><i className="fas fa-newspaper"></i> Success Stories</h1>
            <button className="create-post-btn" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-plus"></i> Share Your Story
            </button>
          </div>

          <div className="stories-grid">
            {posts.map(post => (
              <div className="story-card" key={post._id}>
                <div className="story-header">
                  <div className="story-avatar">
                    <i className="fas fa-user-circle fa-2x"></i>
                  </div>
                  <div>
                    <div className="story-user">{post.authorName}</div>
                    <div className="story-date">{new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="story-caption">{post.caption}</div>
                {post.imageData && (
                  <img src={post.imageData} alt="Post" className="story-image" />
                )}
                <div className="story-footer">
                  <span className="story-visibility">
                    <i className={`fas ${post.visibility === 'public' ? 'fa-globe' : 'fa-lock'}`}></i>
                    {post.visibility}
                  </span>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-newspaper fa-3x"></i>
                <p>No stories yet. Be the first to share your adoption journey!</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay active" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowCreateModal(false)}></i>
            <h2><i className="fas fa-plus-circle"></i> Share Your Story</h2>
            
            <form onSubmit={createPost}>
              <div className="form-group">
                <label>Caption</label>
                <textarea
                  rows="4"
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  required
                  placeholder="Share your adoption journey, pet updates, or happy moments..."
                />
              </div>

              <div className="form-group">
                <label>Visibility</label>
                <select
                  value={newPost.visibility}
                  onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                >
                  <option value="public">🌍 Public - Everyone can see</option>
                  <option value="private">🔒 Private - Only you and admins</option>
                </select>
              </div>

              <div className="form-group">
                <label>Upload Image (Optional)</label>
                <div className="file-input-wrapper" onClick={() => document.getElementById('postImage').click()}>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>{newPost.imageData ? 'Image selected' : 'Click to upload'}</span>
                </div>
                <input type="file" id="postImage" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish Post'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicPostsPage;
