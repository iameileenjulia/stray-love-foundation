import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h4><i className="fas fa-address-card"></i> Contact</h4>
          <p><i className="fas fa-phone-alt"></i> +63 (2) 8123 4567</p>
          <p><i className="fas fa-envelope"></i> hello@strayloveph.org</p>
          <p><i className="fas fa-map-pin"></i> 123 Compassion St., Mandaluyong, PH</p>
        </div>
        <div className="footer-col">
          <h4><i className="fas fa-share-alt"></i> Socials</h4>
          <div className="social-icons">
            <a href="#"><i className="fab fa-facebook"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-tiktok"></i></a>
          </div>
          <p><i className="fas fa-dog"></i> Follow our rescue journey</p>
        </div>
        <div className="footer-col">
          <h4><i className="fas fa-shield-alt"></i> Policies</h4>
          <p><i className="fas fa-file-signature"></i> Adoption Agreement</p>
          <p><i className="fas fa-lock"></i> Privacy & Data</p>
          <p><i className="fas fa-handshake"></i> Responsible Ownership Pledge</p>
        </div>
      </div>
      <div className="footer-bottom">
        <i className="far fa-copyright"></i> 2025 STRAY Love Ph Foundation — Rescue. Rehabilitate. Rehome.
      </div>
    </footer>
  );
};

export default Footer;
