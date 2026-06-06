import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const PublicPostsPage = () => {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();
  const imageInputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [postForm, setPostForm] = useState({
    petName: '',
    caption: '',
    visibility: 'public'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFileName, setImageFileName] = useState('Click to upload (JPEG, PNG)');
  const [submitting, setSubmitting] = useState(false);
  const [postMsg, setPostMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchPosts();
  }, [user, navigate]);

  const getStoredImages = () => {
    try { return JSON.parse(localStorage.getItem('postImages') || '{}'); } catch { return {}; }
  };

  const fetchPosts = async () => {
    try {
      const [publicRes, mineRes] = await Promise.all([
        api.get('/posts'),
        api.get('/posts/mine')
      ]);
      const stored = getStoredImages();
      const merged = new Map();
      [...publicRes.data, ...mineRes.data].forEach(p => {
        if (!merged.has(p._id)) {
          merged.set(p._id, { ...p, imageData: stored[p._id] || null });
        }
      });
      const sorted = [...merged.values()].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPosts(sorted);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type) => {
    setPostMsg({ text, type });
    setTimeout(() => setPostMsg({ text: '', type: '' }), 3000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setPostForm({ petName: '', caption: '', visibility: 'public' });
    setImageFile(null);
    setImagePreview(null);
    setImageFileName('Click to upload (JPEG, PNG)');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!postForm.caption.trim()) {
      showMsg('Please enter a caption.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/posts', {
        petName: postForm.petName.trim() || 'Adopted Pet',
        caption: postForm.caption,
        visibility: postForm.visibility
      });
      if (imagePreview && res.data._id) {
        const stored = getStoredImages();
        stored[res.data._id] = imagePreview;
        localStorage.setItem('postImages', JSON.stringify(stored));
      }
      showMsg('Post published successfully!', 'success');
      resetForm();
      fetchPosts();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to publish post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const Sidebar = () => (
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
              Loading posts...
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
          <div className="posts-page-header">
            <h1>
              <i className="fas fa-newspaper" style={{ color: '#C28A7A', marginRight: '0.5rem' }}></i>
              PUBLIC POSTS
            </h1>
          </div>

          {/* Create Post Card */}
          <div className="create-post-card">
            <div className="card-title">
              <i className="fas fa-plus-circle"></i> CREATE POST
            </div>
            <form onSubmit={handlePublish}>
              <div className="form-group">
                <label>Caption</label>
                <textarea
                  rows="3"
                  placeholder="Share your adoption story, pet updates, or tips..."
                  value={postForm.caption}
                  onChange={e => setPostForm({ ...postForm, caption: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Pet Name <span style={{ fontWeight: 400, color: '#A98978' }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Luna, Charlie... (defaults to Adopted Pet)"
                  value={postForm.petName}
                  onChange={e => setPostForm({ ...postForm, petName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Visibility</label>
                <div className="visibility-options">
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={postForm.visibility === 'public'}
                      onChange={e => setPostForm({ ...postForm, visibility: e.target.value })}
                    />
                    <i className="fas fa-globe"></i> Public
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={postForm.visibility === 'private'}
                      onChange={e => setPostForm({ ...postForm, visibility: e.target.value })}
                    />
                    <i className="fas fa-lock"></i> Private
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Upload Image <span style={{ fontWeight: 400, color: '#A98978' }}>(optional)</span></label>
                {imagePreview && (
                  <div style={{ marginBottom: '0.6rem' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: '16px', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="file-input-wrapper" onClick={() => imageInputRef.current?.click()}>
                  <i className="fas fa-camera"></i>
                  <span style={{ color: '#A5745E', fontSize: '0.9rem' }}>{imageFileName}</span>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>

              <button type="submit" className="publish-btn" disabled={submitting}>
                <i className="fas fa-paper-plane"></i> {submitting ? 'Publishing...' : 'Publish'}
              </button>
            </form>

            {postMsg.text && (
              <div className={`profile-message${postMsg.type === 'error' ? ' error' : ''}`}>
                <i className={`fas ${postMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                &nbsp;{postMsg.text}
              </div>
            )}
          </div>

          {/* Success Stories Section */}
          <div className="stories-section">
            <h2><i className="fas fa-star-of-life"></i> SUCCESS STORIES</h2>
            {posts.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-newspaper" style={{ fontSize: '2.5rem', color: '#DDCAC0', display: 'block', marginBottom: '0.8rem' }}></i>
                <p>No posts yet. Be the first to share your story!</p>
              </div>
            ) : (
              <div className="stories-grid">
                {posts.map(post => (
                  <div className="story-card" key={post._id}>
                    <div className="story-header">
                      <div className="story-avatar">
                        <i className="fas fa-user-circle"></i>
                      </div>
                      <div>
                        <div className="story-user">{post.authorName}</div>
                        <div className="story-pet">{post.petName || 'Adopted Pet'}</div>
                      </div>
                    </div>
                    <div className="story-caption">{post.caption}</div>
                    {post.imageData && (
                      <img src={post.imageData} className="story-image" alt="Post" />
                    )}
                    <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="story-visibility">
                        <i className={`fas ${post.visibility === 'public' ? 'fa-globe' : 'fa-lock'}`}></i>
                        &nbsp;{post.visibility}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#A98978' }}>
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default PublicPostsPage;
