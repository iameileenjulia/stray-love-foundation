import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo">
          <div className="logo-img">🐾</div>
          <div className="logo-text">
            <h1>STRAY Love Ph</h1>
            <span>Foundation · rescue & heal</span>
          </div>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/browse">Browse Pets</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
