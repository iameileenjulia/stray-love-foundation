import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from '@emotion/styled';

const NavbarContainer = styled.nav`
  background: rgba(255, 251, 245, 0.95);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 200, 180, 0.4);
`;

const NavContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
`;

const LogoText = styled.div`
  h1 {
    font-size: 1.7rem;
    font-weight: 800;
    background: linear-gradient(135deg, #C28A7A, #9CB9B0);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
  span {
    font-size: 0.8rem;
    color: #B28678;
    display: block;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  font-weight: 600;
  color: #5C4E48;
  transition: all 0.2s;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0%;
    height: 2.5px;
    background: #F8A58C;
    transition: width 0.25s;
  }

  &:hover:after {
    width: 100%;
  }
`;

const Button = styled.button`
  background: #FFC2AE;
  border: none;
  padding: 8px 20px;
  border-radius: 40px;
  font-weight: 600;
  color: #4D3E38;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #FFB099;
    transform: translateY(-2px);
  }
`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <NavbarContainer>
      <NavContent>
        <Logo to="/">
          <div style={{ width: 45, height: 45, background: '#FCE4DA', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24 }}>🐾</span>
          </div>
          <LogoText>
            <h1>STRAY Love Ph</h1>
            <span>Foundation · rescue & heal</span>
          </LogoText>
        </Logo>

        <NavLinks>
          <NavLink to="/">Home</NavLink>
          <NavLink to={user ? "/dashboard/browse" : "/browse"}>Browse Pets</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <Button onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </NavLinks>
      </NavContent>
    </NavbarContainer>
  );
};

export default Navbar;