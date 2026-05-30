import React from 'react';
import './JobFilters.css';

const JobFilters = ({ filters, onChange, onReset }) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="job-filters glass">
      <div className="filters-header">
        <h3 className="filters-title">Filters</h3>
        <button className="btn btn-sm btn-secondary" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="filter-group">
        <label className="form-label">Job Type</label>
        <select
          className="form-input"
          value={filters.type || ''}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="full-time">Full Time</option>
          <option value="part-time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
          <option value="internship">Internship</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="form-label">Experience Level</label>
        <select
          className="form-input"
          value={filters.experienceLevel || ''}
          onChange={(e) => handleChange('experienceLevel', e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
          <option value="lead">Lead</option>
          <option value="executive">Executive</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="form-label">Location</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., New York, Remote"
          value={filters.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label className="form-label">Salary Range</label>
        <div className="salary-inputs">
          <input
            type="number"
            className="form-input"
            placeholder="Min"
            value={filters.salaryMin || ''}
            onChange={(e) => handleChange('salaryMin', e.target.value)}
          />
          <span className="salary-divider">—</span>
          <input
            type="number"
            className="form-input"
            placeholder="Max"
            value={filters.salaryMax || ''}
            onChange={(e) => handleChange('salaryMax', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default JobFilters;
