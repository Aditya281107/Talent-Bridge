import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CompanyCard.css';

const CompanyCard = ({ employer }) => {
  const navigate = useNavigate();

  const handleViewJobs = () => {
    navigate(`/jobs?search=${encodeURIComponent(employer.company || employer.name)}`);
  };

  return (
    <div className="card company-card" onClick={handleViewJobs}>
      <div className="company-card-header">
        <div className="company-avatar">
          {(employer.company || employer.name)?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div>
          <div className="company-name">{employer.company || employer.name}</div>
          {employer.industry && (
            <div className="company-industry">{employer.industry}</div>
          )}
        </div>
      </div>

      <div className="company-meta">
        {employer.location && (
          <span className="company-meta-item">📍 {employer.location}</span>
        )}
        {employer.companySize && (
          <span className="company-meta-item">👥 {employer.companySize} employees</span>
        )}
        {employer.companyWebsite && (
          <span className="company-meta-item">🌐 Website</span>
        )}
      </div>

      {employer.bio && (
        <p className="company-bio">{employer.bio}</p>
      )}

      <div className="company-jobs-badge">
        💼 {employer.activeJobCount || 0} active job{employer.activeJobCount !== 1 ? 's' : ''}
      </div>

      <div className="company-actions">
        <button className="btn btn-primary btn-sm" onClick={handleViewJobs}>
          View Jobs
        </button>
      </div>
    </div>
  );
};

export default CompanyCard;
