import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const DashboardBrowsePage = () => {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({ type: [], sex: [], age: [], status: [], rescue: [] });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedPet, setSelectedPet] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdoptModal, setShowAdoptModal] = useState(false);

  const [applicationForm, setApplicationForm] = useState({
    reason: '',
    experience: '',
    experienceDesc: '',
    livingCondition: '',
    hasOtherPets: '',
    agreeMonitoring: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchPets();
  }, [user, navigate]);

  const fetchPets = async () => {
    try {
      const response = await api.get('/pets');
      const storedImages = (() => {
        try { return JSON.parse(localStorage.getItem('petImages') || '{}'); } catch { return {}; }
      })();
      setPets(
        response.data.map(pet => ({
          ...pet,
          imageData: storedImages[pet._id] || pet.imageData || null
        }))
      );
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast.error('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptRequest = async () => {
    if (!applicationForm.reason || !applicationForm.livingCondition) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!applicationForm.agreeMonitoring) {
      toast.error('Please agree to monitoring terms');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/adoptions', {
        petId: selectedPet._id,
        applicationAnswers: {
          reason: applicationForm.reason,
          experience: applicationForm.experience + (applicationForm.experienceDesc ? ': ' + applicationForm.experienceDesc : ''),
          livingCondition: applicationForm.livingCondition,
          hasOtherPets: applicationForm.hasOtherPets,
          agreeToMonitoring: applicationForm.agreeMonitoring
        }
      });
      toast.success(`Adoption request for ${selectedPet.name} submitted! 72-hour reflection period started.`);
      setShowAdoptModal(false);
      setShowDetailsModal(false);
      setApplicationForm({ reason: '', experience: '', experienceDesc: '', livingCondition: '', hasOtherPets: '', agreeMonitoring: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFilter = (group, value) => {
    setFilters(prev => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter(v => v !== value)
        : [...prev[group], value]
    }));
  };

  const filteredPets = pets.filter(pet => {
    if (searchTerm && !pet.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.type.length && !filters.type.includes(pet.type)) return false;
    if (filters.sex.length && !filters.sex.includes(pet.sex)) return false;
    if (filters.age.length && !filters.age.includes(pet.age)) return false;
    if (filters.status.length && !filters.status.includes(pet.status)) return false;
    if (filters.rescue.length && !filters.rescue.includes(pet.rescueStatus)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredPets.length / itemsPerPage);
  const paginatedPets = filteredPets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const openDetails = (pet) => {
    setSelectedPet(pet);
    setShowDetailsModal(true);
  };

  const openAdoptForm = () => {
    setShowDetailsModal(false);
    setApplicationForm({ reason: '', experience: '', experienceDesc: '', livingCondition: '', hasOtherPets: '', agreeMonitoring: false });
    setShowAdoptModal(true);
  };

  const Sidebar = () => (
    <aside className="sidebar">
      <h3><i className="fas fa-paw"></i> Menu</h3>
      <nav>
        <ul>
          <li><Link to="/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
          <li><Link to="/dashboard/browse" className="active"><i className="fas fa-search"></i> Browse Pets</Link></li>
          <li><Link to="/dashboard/my-requests"><i className="fas fa-file-alt"></i> My Requests</Link></li>
          <li><Link to="/dashboard/monitoring"><i className="fas fa-clock"></i> Monitoring</Link></li>
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
              Loading pets...
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
          <div className="browse-header">
            <div className="search-filter-bar">
              <div className="search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by pet name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <button className="filter-btn" onClick={() => setShowFilterModal(true)}>
                <i className="fas fa-sliders-h"></i> Filter
              </button>
            </div>

            <div className="pets-grid">
              {paginatedPets.map(pet => (
                <div className="pet-card" key={pet._id}>
                  <div className="pet-img">
                    {pet.imageData ? (
                      <img src={pet.imageData} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className={`fas fa-${pet.type === 'Dog' ? 'dog' : 'cat'} fa-4x`}></i>
                    )}
                  </div>
                  <div className="pet-info">
                    <h3>{pet.name}</h3>
                    <div className="pet-meta">{pet.type} • {pet.sex} • {pet.age}</div>
                    <button className="btn-view" onClick={() => openDetails(pet)}>
                      <i className="fas fa-info-circle"></i> View Details
                    </button>
                  </div>
                </div>
              ))}
              {paginatedPets.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#A98978' }}>
                  <i className="fas fa-paw" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                  No pets match your filters.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    className={`page-btn${n === currentPage ? ' active' : ''}`}
                    onClick={() => setCurrentPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-container filter-modal" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowFilterModal(false)}></i>
            <h2><i className="fas fa-filter"></i> Filter Pets</h2>
            {[
              ['type',   'Type',           ['Dog', 'Cat']],
              ['sex',    'Sex',            ['Male', 'Female']],
              ['age',    'Age',            ['Baby', 'Young', 'Adult']],
              ['status', 'Status',         ['Available', 'Adopted']],
              ['rescue', 'Rescue Status',  ['Rescued', 'Surrendered', 'Stray']]
            ].map(([group, label, options]) => (
              <div className="filter-group" key={group}>
                <label>{label}</label>
                <div className="filter-options">
                  {options.map(opt => (
                    <label key={opt}>
                      <input
                        type="checkbox"
                        checked={filters[group].includes(opt)}
                        onChange={() => toggleFilter(group, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => { setCurrentPage(1); setShowFilterModal(false); }}
            >
              <i className="fas fa-check"></i> Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Pet Details Modal */}
      {showDetailsModal && selectedPet && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowDetailsModal(false)}></i>
            <h2>{selectedPet.name}</h2>
            <div className="detail-row">
              <span className="detail-label">Age:</span>
              <span className="detail-value">{selectedPet.age}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Sex:</span>
              <span className="detail-value">{selectedPet.sex}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Breed:</span>
              <span className="detail-value">{selectedPet.breed || 'Mixed'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{selectedPet.status}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Rescue Status:</span>
              <span className="detail-value">{selectedPet.rescueStatus || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{selectedPet.description}</span>
            </div>
            <div className="extra-details">
              <strong>Vaccination History:</strong> {selectedPet.vaccination || 'Not recorded'}<br />
              <strong>Medical Notes:</strong> {selectedPet.medicalNotes || 'None'}
            </div>
            {selectedPet.status === 'Available' && (
              <button className="adopt-btn" onClick={openAdoptForm}>
                Adopt
              </button>
            )}
          </div>
        </div>
      )}

      {/* Adoption Application Form Modal */}
      {showAdoptModal && selectedPet && (
        <div className="modal-overlay" onClick={() => setShowAdoptModal(false)}>
          <div className="modal-container" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowAdoptModal(false)}></i>
            <h2><i className="fas fa-file-alt"></i> Adoption Application Form</h2>

            <div className="application-form">
              <h3>Pet Summary</h3>
              <div className="form-row"><strong>Pet Name:</strong> {selectedPet.name}</div>
              <div className="form-row"><strong>Age:</strong> {selectedPet.age}</div>
              <div className="form-row"><strong>Sex:</strong> {selectedPet.sex}</div>
              <div className="form-row"><strong>Breed:</strong> {selectedPet.breed || 'Mixed'}</div>
              <div className="form-row"><strong>Status:</strong> {selectedPet.status}</div>
              <div className="form-row"><strong>Rescue Status:</strong> {selectedPet.rescueStatus || '—'}</div>
              <hr />
              <h3>Your Information</h3>
              <div className="form-row"><strong>Full Name:</strong> {user?.fullName}</div>
              <div className="form-row"><strong>Email:</strong> {user?.email}</div>
              <div className="form-row"><strong>Contact:</strong> {user?.contact || '—'}</div>
              <hr />
              <h3>Application Questions</h3>
              <div className="form-row">
                <label>1. Why do you want to adopt?</label>
                <textarea
                  rows="2"
                  value={applicationForm.reason}
                  onChange={e => setApplicationForm({ ...applicationForm, reason: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label>2. Do you have previous experience taking care of pets?</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="experience"
                      value="yes"
                      checked={applicationForm.experience === 'yes'}
                      onChange={e => setApplicationForm({ ...applicationForm, experience: e.target.value })}
                    /> Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="experience"
                      value="no"
                      checked={applicationForm.experience === 'no'}
                      onChange={e => setApplicationForm({ ...applicationForm, experience: e.target.value })}
                    /> No
                  </label>
                </div>
                {applicationForm.experience === 'yes' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label>Describe your experience:</label>
                    <textarea
                      rows="2"
                      value={applicationForm.experienceDesc}
                      onChange={e => setApplicationForm({ ...applicationForm, experienceDesc: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="form-row">
                <label>3. Describe your living condition</label>
                <textarea
                  rows="2"
                  value={applicationForm.livingCondition}
                  onChange={e => setApplicationForm({ ...applicationForm, livingCondition: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <label>4. Are there other pets in your home?</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="otherPets"
                      value="yes"
                      checked={applicationForm.hasOtherPets === 'yes'}
                      onChange={e => setApplicationForm({ ...applicationForm, hasOtherPets: e.target.value })}
                    /> Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="otherPets"
                      value="no"
                      checked={applicationForm.hasOtherPets === 'no'}
                      onChange={e => setApplicationForm({ ...applicationForm, hasOtherPets: e.target.value })}
                    /> No
                  </label>
                </div>
              </div>
              <div className="form-row">
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="agreeMonitoring"
                    checked={applicationForm.agreeMonitoring}
                    onChange={e => setApplicationForm({ ...applicationForm, agreeMonitoring: e.target.checked })}
                  />
                  <label htmlFor="agreeMonitoring">I agree to monitoring visits and follow-up reports.</label>
                </div>
              </div>
            </div>

            <div className="notice">
              <i className="fas fa-hourglass-half"></i> <strong>72-HOUR REFLECTION NOTICE</strong><br />
              The system implements a mandatory 72-hour grace period for all adoption requests to ensure genuine commitment.
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={submitting}
              onClick={handleAdoptRequest}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardBrowsePage;
