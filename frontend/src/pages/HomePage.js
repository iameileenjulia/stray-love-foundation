import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import './HomePage.css';

const HomePage = () => {
  const { api } = useAuth();
  const [featuredPets, setFeaturedPets] = useState([]);

  useEffect(() => {
    fetchFeaturedPets();
  }, []);

  const fetchFeaturedPets = async () => {
    try {
      const response = await api.get('/pets');
      setFeaturedPets(response.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const steps = ['Register', 'Verify Identity', 'Request Adoption', '72-Hour Reflection', 'Adoption Approval', 'Monitoring'];

  return (
    <>
      <div className="homepage">
        <section className="hero">
          <div className="hero-content">
            <h2>Adopt. Rescue. Love.</h2>
            <p>
              We RESCUE, REHABILITATE, RESTORE TO HEALTH and REHOME abandoned, abused,
              infirm and neglected dogs and cats.
            </p>
            <Link to="/browse" className="btn-primary">
              <i className="fas fa-paw"></i> Browse Pets
            </Link>
          </div>
        </section>

        <div className="container">
          <section>
            <h2 className="section-title">
              <i className="fas fa-star"></i> FEATURED PETS
            </h2>
            <div className="pets-grid">
              {featuredPets.map(pet => (
                <div className="pet-card" key={pet._id}>
                  <div className="pet-img">
                    <i className={`fas fa-${pet.type === 'Dog' ? 'dog' : 'cat'}`}></i>
                  </div>
                  <div className="pet-info">
                    <h3>{pet.name}</h3>
                    <div className="pet-meta">
                      <span>{pet.type}</span> • {pet.sex} • {pet.age}
                    </div>
                    <Link to={`/browse?pet=${pet._id}`} className="btn-view">
                      <i className="fas fa-info-circle"></i> View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title">
              <i className="fas fa-heart"></i> ABOUT US
            </h2>
            <div className="about-card">
              <p>
                STRAY Love Ph Foundation is committed to giving rescued, stray, and surrendered dogs and cats
                a second chance at life through safe, loving, and responsible adoption. We connect animals
                in need with compassionate families while promoting responsible pet ownership and long-term
                animal welfare.
              </p>
            </div>
          </section>

          <section>
            <h2 className="section-title">
              <i className="fas fa-clipboard-list"></i> HOW ADOPTION WORKS
            </h2>
            <div className="steps-grid">
              {steps.map((step, index) => (
                <div className="step-card" key={index}>
                  <div className="step-number">{index + 1}</div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title">
              <i className="fas fa-star-of-life"></i> SUCCESS STORIES
            </h2>
            <div className="stories-grid">
              <div className="story-card">
                <div className="story-user">
                  <i className="fas fa-user-check"></i> <strong>User: Maria & Luna</strong>
                </div>
                <p className="story-text">
                  "Adopting Luna changed our world. From a timid stray to the happiest companion – thank you STRAY Love!"
                </p>
              </div>
              <div className="story-card">
                <div className="story-user">
                  <i className="fas fa-user-friends"></i> <strong>User: Carlo & Max</strong>
                </div>
                <p className="story-text">
                  "Max was rescued after an accident, now he's a playful, healthy member of our family. Forever grateful!"
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-title">
              <i className="fas fa-gavel"></i> LEGAL / RESPONSIBLE ADOPTION
            </h2>
            <div className="legal-list">
              <span className="legal-badge"><i className="fas fa-file-alt"></i> Philippine adoption reminders</span>
              <span className="legal-badge"><i className="fas fa-hand-holding-heart"></i> Responsible ownership</span>
              <span className="legal-badge"><i className="fas fa-scale-balanced"></i> Animal welfare laws</span>
              <span className="legal-badge"><i className="fas fa-syringe"></i> Vaccination importance</span>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HomePage;
