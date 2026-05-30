import React, { useState, useEffect, useCallback } from 'react';
import jobService from '../services/jobService';
import JobCard from '../components/jobs/JobCard';
import JobFilters from '../components/jobs/JobFilters';
import { SkeletonList } from '../components/layout/SkeletonLoader';
import './Jobs.css';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        search: search || undefined,
        page,
        limit: 12,
      };
      // Remove empty values
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const res = await jobService.getJobs(params);
      setJobs(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filters, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="page jobs-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            Find Your <span className="gradient-text">Dream Job</span>
          </h1>
          <p className="page-subtitle">
            Explore {pagination.total || 0} opportunities waiting for you
          </p>
        </div>

        {/* Search Bar */}
        <div className="jobs-search glass">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search jobs by title, company, or keyword..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              className="search-clear"
              onClick={() => {
                setSearchInput('');
                setSearch('');
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="jobs-layout">
          {/* Filters Sidebar */}
          <aside className="jobs-sidebar">
            <JobFilters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Jobs Grid */}
          <main className="jobs-main">
            {loading ? (
              <div className="jobs-loading">
                <SkeletonList count={6} />
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="jobs-grid">
                  {jobs.map((job, i) => (
                    <div key={job._id} className="stagger-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <JobCard job={job} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="jobs-pagination">
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ← Previous
                    </button>
                    <span className="pagination-info">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={page >= pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3 className="empty-state-title">No jobs found</h3>
                <p className="empty-state-text">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button className="btn btn-primary" onClick={handleResetFilters}>
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
