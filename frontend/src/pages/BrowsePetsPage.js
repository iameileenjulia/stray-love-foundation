import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const BrowsePetsPage = () => {
  const { api } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    sex: 'all',
    age: 'all'
  });

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

  const filteredPets = pets.filter(pet => {
    if (searchTerm && !pet.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.type !== 'all' && pet.type !== filters.type) return false;
    if (filters.sex !== 'all' && pet.sex !== filters.sex) return false;
    if (filters.age !== 'all' && pet.age !== filters.age) return false;
    return true;
  });

  if (loading) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading pets...</div>
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-section">
            <div className="filter-group">
              <label>Type</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="all">All</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sex</label>
              <select value={filters.sex} onChange={(e) => setFilters({ ...filters, sex: e.target.value })}>
                <option value="all">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Age</label>
              <select value={filters.age} onChange={(e) => setFilters({ ...filters, age: e.target.value })}>
                <option value="all">All</option>
                <option value="Baby">Baby</option>
                <option value="Young">Young</option>
                <option value="Adult">Adult</option>
              </select>
            </div>
          </div>
        </div>

        <div className="container">
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
                  <Link to="/register" className="btn-view">
                    <i className="fas fa-heart"></i> Register to Adopt
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {filteredPets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#A98978' }}>
              No pets available for adoption at the moment.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default BrowsePetsPage;
