import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styled from '@emotion/styled';
import { useAuth } from '../context/AuthContext';

const Hero = styled.section`
  background: linear-gradient(130deg, #FFF3EC 0%, #FEF7F0 100%);
  padding: 5rem 2rem 6rem;
  border-radius: 0 0 70px 70px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "🐾";
    font-size: 260px;
    opacity: 0.04;
    position: absolute;
    bottom: -50px;
    right: -40px;
    pointer-events: none;
  }
`;

const HeroContent = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
`;

const HeroTitle = styled.h2`
  font-size: 3.8rem;
  font-weight: 800;
  background: linear-gradient(120deg, #DE8C72, #6B9C8F);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 1.2rem;

  @media (max-width: 768px) {
    font-size: 2.3rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  max-width: 700px;
  margin: 1rem auto 2rem;
  color: #6A5A52;
`;

const Section = styled.section`
  margin: 5rem 0;
`;

const SectionTitle = styled.h2`
  font-size: 2.3rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #AD8878, #6EA094);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;

  @media (max-width: 768px) {
    font-size: 1.9rem;
  }
`;

const PetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
`;

const PetCard = styled.div`
  background: white;
  border-radius: 32px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 215, 195, 0.7);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 22px 35px -12px rgba(0, 0, 0, 0.1);
  }
`;

const PetImage = styled.div`
  height: 240px;
  background: #FAEEE8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.8rem;
`;

const PetInfo = styled.div`
  padding: 1.2rem 1rem 1.5rem;
  text-align: center;
`;

const PetName = styled.h3`
  font-size: 1.7rem;
  font-weight: 700;
  color: #936E5C;
  margin-bottom: 0.5rem;
`;

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

const StepCard = styled.div`
  background: rgba(255, 247, 240, 0.7);
  backdrop-filter: blur(2px);
  padding: 1.4rem 0.8rem;
  border-radius: 28px;
  text-align: center;
  border: 1px solid #FFE2D4;
  transition: 0.2s;

  &:hover {
    background: #FFFFFFDD;
    transform: translateY(-5px);
  }
`;

const StepNumber = styled.div`
  width: 48px;
  height: 48px;
  background: #FAD5C4;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.3rem;
  margin: 0 auto 1rem;
  color: #AA6E57;
`;

const Button = styled(Link)`
  background: #FFC2AE;
  border: none;
  padding: 12px 32px;
  border-radius: 40px;
  font-weight: 700;
  color: #4D3E38;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: inline-block;
  text-decoration: none;

  &:hover {
    background: #FFB099;
    transform: translateY(-3px);
    box-shadow: 0 12px 22px rgba(255, 160, 130, 0.2);
  }
`;

const HomePage = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const { api } = useAuth();

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
      <Navbar />
      <main>
        <Hero>
          <HeroContent>
            <HeroTitle>Adopt. Rescue. Love.</HeroTitle>
            <HeroSubtitle>
              We RESCUE, REHABILITATE, RESTORE TO HEALTH and REHOME abandoned, abused, 
              infirm and neglected dogs and cats.
            </HeroSubtitle>
            <Button to="/browse">Browse Pets</Button>
          </HeroContent>
        </Hero>

        <div className="container">
          <Section>
            <SectionTitle>🐾 Featured Pets</SectionTitle>
            <PetsGrid>
              {featuredPets.map(pet => (
                <PetCard key={pet._id}>
                  <PetImage>
                    {pet.type === 'Dog' ? '🐕' : '🐱'}
                  </PetImage>
                  <PetInfo>
                    <PetName>{pet.name}</PetName>
                    <div style={{ color: '#A98978', marginBottom: '1rem' }}>
                      {pet.type} • {pet.sex} • {pet.age}
                    </div>
                    <Button to="/browse" style={{ padding: '8px 24px', fontSize: '0.9rem' }}>View Details</Button>
                  </PetInfo>
                </PetCard>
              ))}
            </PetsGrid>
          </Section>

          <Section>
            <SectionTitle>💖 About Us</SectionTitle>
            <div style={{ maxWidth: 880, margin: '0 auto', background: '#FEF6F0', padding: '2.5rem', borderRadius: 52, textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: '#6B4F41', lineHeight: 1.6 }}>
                STRAY Love Ph Foundation is committed to giving rescued, stray, and surrendered dogs and cats 
                a second chance at life through safe, loving, and responsible adoption. We connect animals 
                in need with compassionate families while promoting responsible pet ownership and long-term 
                animal welfare.
              </p>
            </div>
          </Section>

          <Section>
            <SectionTitle>📋 How Adoption Works</SectionTitle>
            <StepsGrid>
              {steps.map((step, index) => (
                <StepCard key={index}>
                  <StepNumber>{index + 1}</StepNumber>
                  <p>{step}</p>
                </StepCard>
              ))}
            </StepsGrid>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default HomePage;