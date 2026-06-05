import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import './BrowsePetsPage.css';

const PETS_PER_PAGE = 8;

const BrowsePetsPage = () => {
  const { api } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ type: 'all', sex: 'all', age: 'all', status: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const response = await api.get('/pets');
      setPets(response.data.filter(pet => pet.status === 'Available'));
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ type: 'all', sex: 'all', age: 'all', status: 'all' });
    setCurrentPage(1);
  };

  const filteredPets = pets.filter(pet => {
    if (searchTerm && !pet.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.type !== 'all' && pet.type !== filters.type) return false;
    if (filters.sex !== 'all' && pet.sex !== filters.sex) return false;
    if (filters.age !== 'all' && pet.age !== filters.age) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredPets.length / PETS_PER_PAGE);
  const paginatedPets = filteredPets.slice(
    (currentPage - 1) * PETS_PER_PAGE,
    currentPage * PETS_PER_PAGE
  );

  if (loading) {
    return (
      <>
        <div className="browse-loading">
          <i className="fas fa-paw fa-spin"></i> Loading pets...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main>
        <div className="browse-header">
          <h1><i className="fas fa-paw"></i> Browse Pets</h1>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="filter-section">
            <div className="filter-group">
              <label>Type</label>
              <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                <option value="all">All</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sex</label>
              <select value={filters.sex} onChange={(e) => handleFilterChange('sex', e.target.value)}>
                <option value="all">All</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Age</label>
              <select value={filters.age} onChange={(e) => handleFilterChange('age', e.target.value)}>
                <option value="all">All</option>
                <option value="Baby">Baby</option>
                <option value="Young">Young</option>
                <option value="Adult">Adult</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="all">All</option>
                <option value="Available">Available</option>
                <option value="Adopted">Adopted</option>
              </select>
            </div>
            <button className="clear-btn" onClick={clearFilters}>
              <i className="fas fa-undo-alt"></i> Clear
            </button>
          </div>
        </div>

        <div className="container browse-container">
          {paginatedPets.length > 0 ? (
            <div className="pets-grid">
              {paginatedPets.map(pet => (
                <div className="pet-card" key={pet._id} onClick={() => setSelectedPet(pet)}>
                  <div className="pet-img">
                    {pet.imageData ? (
                      <img src={pet.imageData} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className={`fas fa-${pet.type === 'Dog' ? 'dog' : 'cat'} fa-4x`}></i>
                    )}
                    <span className="status-badge badge-available">Available</span>
                  </div>
                  <div className="pet-info">
                    <h3>{pet.name}</h3>
                    <div className="pet-meta">
                      <span>{pet.type}</span> · {pet.sex} · {pet.age}
                    </div>
                    <p className="pet-desc">
                      {pet.description
                        ? pet.description.substring(0, 80) + (pet.description.length > 80 ? '...' : '')
                        : 'No description available.'}
                    </p>
                    <span className="btn-view">
                      <i className="fas fa-eye"></i> View Details
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="browse-empty">
              <i className="fas fa-search fa-3x"></i>
              <p>No pets found matching your filters.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`page-btn${currentPage === page ? ' active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </main>

      {selectedPet && (
        <div className="modal-overlay" onClick={() => setSelectedPet(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setSelectedPet(null)}></i>
            <div className="modal-img">
              {selectedPet.imageData ? (
                <img src={selectedPet.imageData} alt={selectedPet.name} />
              ) : (
                <i className={`fas fa-${selectedPet.type === 'Dog' ? 'dog' : 'cat'} fa-5x`}></i>
              )}
            </div>
            <h2>{selectedPet.name}</h2>
            <div className="modal-details">
              <div className="modal-detail-row">
                <span><i className="fas fa-tag"></i> Type</span>
                <span>{selectedPet.type}</span>
              </div>
              <div className="modal-detail-row">
                <span><i className="fas fa-venus-mars"></i> Sex</span>
                <span>{selectedPet.sex}</span>
              </div>
              <div className="modal-detail-row">
                <span><i className="fas fa-birthday-cake"></i> Age</span>
                <span>{selectedPet.age}</span>
              </div>
              <div className="modal-detail-row">
                <span><i className="fas fa-heart"></i> Status</span>
                <span className="text-available">Available</span>
              </div>
            </div>
            <div className="register-note">
              <i className="fas fa-lock"></i> <Link to="/register">Register</Link> to see full details &amp; adopt
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default BrowsePetsPage;
