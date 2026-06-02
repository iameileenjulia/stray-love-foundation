import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const DashboardBrowsePage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    reason: '',
    experience: '',
    livingCondition: '',
    hasOtherPets: 'no',
    agreeMonitoring: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPets();
  }, [user, navigate]);

  const fetchPets = async () => {
    try {
      const response = await api.get('/pets');
      setPets(response.data.filter(pet => pet.status === 'Available'));
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast.error('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptRequest = async (e) => {
    e.preventDefault();
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
          experience: applicationForm.experience,
          livingCondition: applicationForm.livingCondition,
          hasOtherPets: applicationForm.hasOtherPets,
          agreeToMonitoring: applicationForm.agreeMonitoring
        }
      });
      toast.success('Adoption request submitted! 72-hour reflection period started.');
      setShowAdoptModal(false);
      setApplicationForm({
        reason: '',
        experience: '',
        livingCondition: '',
        hasOtherPets: 'no',
        agreeMonitoring: false
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div style={{ textAlign: 'center', padding: '50px' }}>Loading pets...</div>
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
              <li><Link to="/dashboard/browse" className="active"><i className="fas fa-search"></i> Browse Pets</Link></li>
              <li><Link to="/dashboard/my-requests"><i className="fas fa-file-alt"></i> My Requests</Link></li>
              <li><Link to="/dashboard/monitoring"><i className="fas fa-clock"></i> Monitoring</Link></li>
              <li><Link to="/dashboard/posts"><i className="fas fa-newspaper"></i> Public Posts</Link></li>
              <li><Link to="/dashboard/profile"><i className="fas fa-user-circle"></i> Profile</Link></li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <div className="browse-header">
            <h1><i className="fas fa-paw"></i> Browse Pets</h1>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="pets-grid">
            {filteredPets.map(pet => (
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
                  <div className="pet-meta">
                    <span>{pet.type}</span> • {pet.sex} • {pet.age}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#7F665A', marginBottom: '1rem' }}>
                    {pet.description?.substring(0, 80)}...
                  </p>
                  <button 
                    className="btn-view"
                    onClick={() => {
                      setSelectedPet(pet);
                      setShowAdoptModal(true);
                    }}
                  >
                    <i className="fas fa-heart"></i> Adopt Me
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredPets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#A98978' }}>
              No pets available for adoption at the moment.
            </div>
          )}
        </main>
      </div>
      <Footer />

      {/* Adoption Modal */}
      {showAdoptModal && selectedPet && (
        <div className="modal-overlay active" onClick={() => setShowAdoptModal(false)}>
          <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowAdoptModal(false)}></i>
            <h2><i className="fas fa-paw"></i> Adopt {selectedPet.name}</h2>
            
            <div className="pet-summary" style={{ background: '#FEF6F0', padding: '1rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
              <p><strong>Type:</strong> {selectedPet.type} | <strong>Sex:</strong> {selectedPet.sex} | <strong>Age:</strong> {selectedPet.age}</p>
              <p><strong>Breed:</strong> {selectedPet.breed || 'Mixed'}</p>
            </div>

            <form onSubmit={handleAdoptRequest}>
              <div className="form-group">
                <label>1. Why do you want to adopt this pet?</label>
                <textarea
                  rows="3"
                  value={applicationForm.reason}
                  onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
                  required
                  placeholder="Tell us why you're interested in adopting..."
                />
              </div>

              <div className="form-group">
                <label>2. Do you have previous experience with pets?</label>
                <textarea
                  rows="2"
                  value={applicationForm.experience}
                  onChange={(e) => setApplicationForm({ ...applicationForm, experience: e.target.value })}
                  required
                  placeholder="Describe your experience with pets..."
                />
              </div>

              <div className="form-group">
                <label>3. Describe your living condition</label>
                <textarea
                  rows="2"
                  value={applicationForm.livingCondition}
                  onChange={(e) => setApplicationForm({ ...applicationForm, livingCondition: e.target.value })}
                  required
                  placeholder="House? Apartment? Yard? Other pets?"
                />
              </div>

              <div className="form-group">
                <label>4. Do you have other pets?</label>
                <select
                  value={applicationForm.hasOtherPets}
                  onChange={(e) => setApplicationForm({ ...applicationForm, hasOtherPets: e.target.value })}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  checked={applicationForm.agreeMonitoring}
                  onChange={(e) => setApplicationForm({ ...applicationForm, agreeMonitoring: e.target.checked })}
                  required
                />
                <label>I agree to post-adoption monitoring visits and follow-up reports</label>
              </div>

              <div className="notice" style={{ background: '#FFF2EB', padding: '1rem', borderRadius: '24px', margin: '1rem 0', fontSize: '0.85rem' }}>
                <i className="fas fa-hourglass-half"></i> <strong>72-HOUR REFLECTION PERIOD</strong><br />
                A mandatory 72-hour grace period will be applied to ensure genuine commitment.
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Adoption Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardBrowsePage;
