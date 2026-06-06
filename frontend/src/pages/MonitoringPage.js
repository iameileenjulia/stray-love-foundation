import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const MonitoringPage = () => {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();

  const [adoptedPets, setAdoptedPets] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [reportForm, setReportForm] = useState({
    month: 1,
    healthStatus: '',
    livingEnvironment: '',
    additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [petsRes, reportsRes] = await Promise.all([
        api.get('/users/adopted-pets'),
        api.get('/monitoring/my-reports')
      ]);
      setAdoptedPets(petsRes.data);
      setMyReports(reportsRes.data);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = (pet) => {
    setSelectedPet(pet);
    setReportForm({ month: 1, healthStatus: '', livingEnvironment: '', additionalNotes: '' });
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportForm.healthStatus || !reportForm.livingEnvironment) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/monitoring/reports', {
        petId: selectedPet._id,
        month: reportForm.month,
        healthStatus: reportForm.healthStatus,
        livingEnvironment: reportForm.livingEnvironment,
        additionalNotes: reportForm.additionalNotes
      });
      toast.success('Monitoring report submitted successfully!');
      setShowReportModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
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
          <li><Link to="/dashboard/monitoring" className="active"><i className="fas fa-clock"></i> Monitoring</Link></li>
          <li><Link to="/dashboard/posts"><i className="fas fa-newspaper"></i> Public Posts</Link></li>
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
              Loading monitoring data...
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
          <div className="monitoring-header">
            <h1>
              <i className="fas fa-clock" style={{ color: '#C28A7A', marginRight: '0.5rem' }}></i>
              Post-Adoption Monitoring
            </h1>
            <p style={{ color: '#A98978', marginTop: '0.4rem', fontSize: '0.95rem' }}>
              Submit monthly reports to keep track of your adopted pet's wellbeing.
            </p>
          </div>

          {/* Adopted Pets Section */}
          <div className="monitoring-card">
            <div className="card-title">
              <i className="fas fa-paw"></i> Your Adopted Pets
            </div>
            {adoptedPets.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-dog" style={{ fontSize: '2rem', color: '#DDCAC0', display: 'block', marginBottom: '0.8rem' }}></i>
                <p>No adopted pets yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  Once your adoption request is approved, your pets will appear here.
                </p>
                <Link
                  to="/dashboard/browse"
                  className="btn-primary"
                  style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
                >
                  Browse Pets
                </Link>
              </div>
            ) : (
              <div className="adopted-pets-list">
                {adoptedPets.map(pet => (
                  <div className="adopted-pet-item" key={pet._id}>
                    <div>
                      <span className="pet-name">
                        <i className={`fas fa-${pet.type === 'Dog' ? 'dog' : 'cat'}`} style={{ marginRight: '6px', color: '#C28A7A' }}></i>
                        {pet.name}
                      </span>
                      <div className="adoption-date">
                        {pet.type} • {pet.sex} • {pet.age}
                        {pet.adoptedDate && (
                          <span style={{ marginLeft: '8px' }}>
                            — Adopted: {new Date(pet.adoptedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="submit-report-btn" onClick={() => openReportModal(pet)}>
                      <i className="fas fa-upload"></i> Submit Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Reports Section */}
          <div className="monitoring-card">
            <div className="card-title">
              <i className="fas fa-history"></i> My Submitted Reports
            </div>
            {myReports.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-clipboard-list" style={{ fontSize: '2rem', color: '#DDCAC0', display: 'block', marginBottom: '0.8rem' }}></i>
                <p>No reports submitted yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  Your submitted monitoring reports will appear here.
                </p>
              </div>
            ) : (
              <div className="adopted-pets-list">
                {myReports.map(report => (
                  <div className="report-item" key={report._id}>
                    <div>
                      <span className="pet-name">
                        <i className="fas fa-paw" style={{ marginRight: '6px', color: '#C28A7A' }}></i>
                        {report.petName}
                      </span>
                      <div className="adoption-date">
                        Month {report.month} &nbsp;·&nbsp;
                        Submitted: {new Date(report.submittedAt).toLocaleDateString()}
                        {report.evaluationNotes && (
                          <span style={{ marginLeft: '8px', color: '#6B9C8F', fontSize: '0.8rem' }}>
                            — Admin notes available
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`report-badge${report.status === 'reviewed' ? ' reviewed' : ''}`}>
                      <i className={`fas ${report.status === 'reviewed' ? 'fa-check-circle' : 'fa-clock'}`}></i>
                      {report.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                    </span>
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
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowReportModal(false)}></i>
            <h2>
              <i className="fas fa-upload"></i> Monitoring Report
            </h2>

            {/* Pet info */}
            <div className="extra-details" style={{ marginBottom: '1.2rem' }}>
              <strong>Pet:</strong> {selectedPet.name} &nbsp;·&nbsp;
              {selectedPet.type} &nbsp;·&nbsp; {selectedPet.sex} &nbsp;·&nbsp; {selectedPet.age}
            </div>

            {/* Month */}
            <div className="form-group">
              <label>Monitoring Month *</label>
              <select
                value={reportForm.month}
                onChange={e => setReportForm({ ...reportForm, month: parseInt(e.target.value) })}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <option key={n} value={n}>Month {n}</option>
                ))}
              </select>
            </div>

            {/* Health Status */}
            <div className="form-group">
              <label>Health Condition *</label>
              <textarea
                rows="3"
                placeholder="Describe the pet's health, vaccination status, diet, activity level..."
                value={reportForm.healthStatus}
                onChange={e => setReportForm({ ...reportForm, healthStatus: e.target.value })}
              />
            </div>

            {/* Living Environment */}
            <div className="form-group">
              <label>Living Environment *</label>
              <textarea
                rows="3"
                placeholder="Describe the living space, cleanliness, safety, social interactions..."
                value={reportForm.livingEnvironment}
                onChange={e => setReportForm({ ...reportForm, livingEnvironment: e.target.value })}
              />
            </div>

            {/* Additional Notes */}
            <div className="form-group">
              <label>Additional Notes <span style={{ fontWeight: 400, color: '#A98978' }}>(optional)</span></label>
              <textarea
                rows="2"
                placeholder="Any concerns, observations, or questions for the admin..."
                value={reportForm.additionalNotes}
                onChange={e => setReportForm({ ...reportForm, additionalNotes: e.target.value })}
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={submitting}
              onClick={submitReport}
            >
              {submitting ? 'Submitting...' : <><i className="fas fa-paper-plane"></i> Submit Report</>}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MonitoringPage;
