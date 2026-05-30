import React from 'react';
import { Link } from 'react-router-dom';
import './JobCard.css';

const JobCard = ({ job }) => {
  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Competitive';
    const fmt = (n) => {
      if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
      return n;
    };
    if (min && max) return `$${fmt(min)} - $${fmt(max)}`;
    if (min) return `From $${fmt(min)}`;
    return `Up to $${fmt(max)}`;
  };

  const getTypeColor = (type) => {
    const colors = {
      'full-time': 'badge-success',
      'part-time': 'badge-warning',
      'contract': 'badge-accent',
      'remote': 'badge-primary',
      'internship': 'badge-danger',
    };
    return colors[type] || 'badge-primary';
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <Link to={`/jobs/${job._id}`} className="job-card card">
      <div className="job-card-header">
        <div className="job-card-company-icon">
          {job.company?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div className="job-card-meta">
          <span className="job-card-company">{job.company}</span>
          <span className="job-card-time">{timeAgo(job.createdAt)}</span>
        </div>
      </div>

      <h3 className="job-card-title">{job.title}</h3>

      <div className="job-card-details">
        <span className="job-card-detail">
          📍 {job.location}
        </span>
        <span className="job-card-detail">
          💰 {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
        </span>
      </div>

      <div className="job-card-tags">
        <span className={`badge ${getTypeColor(job.type)}`}>
          {job.type}
        </span>
        <span className="badge badge-primary">{job.experienceLevel}</span>
        {job.skills?.slice(0, 3).map((skill, i) => (
          <span key={i} className="job-card-skill">{skill}</span>
        ))}
      </div>

      <div className="job-card-footer">
        <span className="job-card-applicants">
          {job.applicationCount || 0} applicant{job.applicationCount !== 1 ? 's' : ''}
        </span>
        <span className="job-card-cta">View Details →</span>
      </div>
    </Link>
  );
};

export default JobCard;
