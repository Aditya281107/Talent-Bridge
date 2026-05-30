import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, isEmployer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">⬡</span>
          <span className="navbar-title">
            Talent<span className="gradient-text">Bridge</span>
          </span>
        </Link>

        <button
          className={`navbar-toggle ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            <Link
              to="/jobs"
              className={`navbar-link ${location.pathname === '/jobs' ? 'active' : ''}`}
            >
              Browse Jobs
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                {isEmployer && (
                  <>
                    <Link
                      to="/post-job"
                      className={`navbar-link ${location.pathname === '/post-job' ? 'active' : ''}`}
                    >
                      Post Job
                    </Link>
                    <Link
                      to="/candidates"
                      className={`navbar-link ${location.pathname === '/candidates' ? 'active' : ''}`}
                    >
                      Find Talent
                    </Link>
                  </>
                )}
                {!isEmployer && (
                  <>
                    <Link
                      to="/my-applications"
                      className={`navbar-link ${location.pathname === '/my-applications' ? 'active' : ''}`}
                    >
                      My Applications
                    </Link>
                    <Link
                      to="/companies"
                      className={`navbar-link ${location.pathname === '/companies' ? 'active' : ''}`}
                    >
                      Companies
                    </Link>
                  </>
                )}
                <Link
                  to="/messages"
                  className={`navbar-link ${location.pathname === '/messages' ? 'active' : ''}`}
                >
                  💬 Messages
                </Link>
              </>
            )}
          </div>

          <div className="navbar-actions">
            {isAuthenticated ? (
              <div className="navbar-user">
                <Link to="/profile" className="navbar-avatar">
                  <span className="avatar-initial">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </Link>
                <div className="navbar-user-info">
                  <span className="navbar-username">{user?.name}</span>
                  <span className="navbar-role badge badge-primary">{user?.role}</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="navbar-auth">
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
