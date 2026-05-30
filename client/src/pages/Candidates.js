import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import CandidateCard from '../components/users/CandidateCard';
import { SkeletonList } from '../components/layout/SkeletonLoader';
import './Candidates.css';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        search: search || undefined,
        page,
        limit: 12,
      };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const res = await userService.searchCandidates(params);
      setCandidates(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filters, page]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="page candidates-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            Find <span className="gradient-text">Top Talent</span>
          </h1>
          <p className="page-subtitle">
            Discover {pagination.total || 0} exceptional candidates
          </p>
        </div>

        {/* Search Bar */}
        <div className="candidates-search glass">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search candidates by name, title, or skills..."
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

        <div className="candidates-layout">
          {/* Filters Sidebar */}
          <aside className="candidates-sidebar">
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Filters</h3>

              <div className="filter-group">
                <label className="filter-label">Skills</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, Python"
                  value={filters.skills || ''}
                  onChange={(e) => handleFilterChange('skills', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. New York"
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Min Experience (years)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  min="0"
                  value={filters.experienceMin || ''}
                  onChange={(e) => handleFilterChange('experienceMin', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Max Experience (years)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="20"
                  min="0"
                  value={filters.experienceMax || ''}
                  onChange={(e) => handleFilterChange('experienceMax', e.target.value)}
                />
              </div>

              <button className="btn btn-secondary btn-sm" onClick={handleResetFilters} style={{ width: '100%' }}>
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Candidates Grid */}
          <main>
            {loading ? (
              <div className="candidates-grid">
                <SkeletonList count={6} />
              </div>
            ) : candidates.length > 0 ? (
              <>
                <div className="candidates-grid">
                  {candidates.map((candidate, i) => (
                    <div key={candidate._id} className="stagger-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <CandidateCard candidate={candidate} />
                    </div>
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="candidates-pagination">
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
                <div className="empty-state-icon">👥</div>
                <h3 className="empty-state-title">No candidates found</h3>
                <p className="empty-state-text">
                  Try adjusting your search or filters to find the talent you're looking for.
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

export default Candidates;
