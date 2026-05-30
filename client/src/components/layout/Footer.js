import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-icon">⬡</span>
              <span>
                Talent<span className="gradient-text">Bridge</span>
              </span>
            </Link>
            <p className="footer-description">
              Connecting exceptional talent with world-class opportunities.
              Build your career or find your next great hire.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">For Job Seekers</h4>
            <Link to="/jobs" className="footer-link">Browse Jobs</Link>
            <Link to="/register" className="footer-link">Create Account</Link>
            <Link to="/dashboard" className="footer-link">Dashboard</Link>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">For Employers</h4>
            <Link to="/register" className="footer-link">Post a Job</Link>
            <Link to="/dashboard" className="footer-link">Manage Listings</Link>
            <Link to="/register" className="footer-link">Find Talent</Link>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Platform</h4>
            <Link to="/" className="footer-link">About Us</Link>
            <Link to="/" className="footer-link">Privacy Policy</Link>
            <Link to="/" className="footer-link">Terms of Service</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} TalentBridge. All rights reserved.
          </p>
          <div className="footer-social">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
              ⊙
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
              ∎
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
              ✦
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
