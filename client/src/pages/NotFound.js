import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '6rem', marginBottom: 16, opacity: 0.3 }}>🌐</div>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: 8 }}>
          <span className="gradient-text">404</span>
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 16 }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/jobs" className="btn btn-secondary">Browse Jobs</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
