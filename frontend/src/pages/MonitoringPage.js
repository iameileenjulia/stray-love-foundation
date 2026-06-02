import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const MonitoringPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [adoptedPets, setAdoptedPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [reportForm, setReportForm] = useState({
    healthStatus: '',
    livingEnvironment: '',
    photos: []
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAdoptedPets();
  }, [user, navigate]);

  const fetchAdoptedPets = async () => {
    try {
      const response = await api.get('/users/adopted-pets');
      setAdoptedPets(response.data);
    } catch (error) {
      console.error('Error fetching adopted pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.healthStatus || !reportForm.livingEnvironment) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/monitoring/reports', {
        petId: selectedPet._id,
        ...reportForm
      });
      toast.success('Monitoring report submitted successfully!');
      setShowReportModal(false);
      setReportForm({ healthStatus: '', livingEnvironment: '', photos: [] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
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
            <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
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
              <li><Link to="/dashboard/monitoring" className="active"><i className="fas fa-clock"></i> Monitoring</Link></li>
              <li><Link to="/dashboard/posts"><i className="fas fa-newspaper"></i> Public Posts</Link></li>
              <li><Link to="/dashboard/profile"><i className="fas fa-user-circle"></i> Profile</Link></li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <div className="monitoring-header">
            <h1><i className="fas fa-clock"></i> Post-Adoption Monitoring</h1>
          </div>

          <div className="monitoring-card">
            <div className="card-title"><i className="fas fa-paw"></i> Your Adopted Pets</div>
            {adoptedPets.length === 0 ? (
              <div className="empty-state">
                <p>No adopted pets yet. Once your adoption request is approved, your pets will appear here.</p>
                <Link to="/dashboard/browse" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Browse Pets</Link>
              </div>
            ) : (
              <div className="adopted-pets-list">
                {adoptedPets.map(pet => (
                  <div className="adopted-pet-item" key={pet._id}>
                    <div>
                      <span className="pet-name">{pet.name}</span>
                      <div className="adoption-date">Adopted: {new Date(pet.adoptedDate).toLocaleDateString()}</div>
                    </div>
                    <button 
                      className="submit-report-btn"
                      onClick={() => {
                        setSelectedPet(pet);
                        setShowReportModal(true);
                      }}
                    >
                      Submit Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Submit Report Modal */}
      {showReportModal && selectedPet && (
        <div className="modal-overlay active" onClick={() => setShowReportModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowReportModal(false)}></i>
            <h2><i className="fas fa-upload"></i> Monitoring Report for {selectedPet.name}</h2>
            
            <form onSubmit={submitReport}>
              <div className="form-group">
                <label>Health Condition *</label>
                <textarea
                  rows="3"
                  value={reportForm.healthStatus}
                  onChange={(e) => setReportForm({ ...reportForm, healthStatus: e.target.value })}
                  required
                  placeholder="Describe the pet's health, vaccination status, diet, etc."
                />
              </div>

              <div className="form-group">
                <label>Living Environment *</label>
                <textarea
                  rows="3"
                  value={reportForm.livingEnvironment}
                  onChange={(e) => setReportForm({ ...reportForm, livingEnvironment: e.target.value })}
                  required
                  placeholder="Describe the living space, cleanliness, safety, etc."
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MonitoringPage;
