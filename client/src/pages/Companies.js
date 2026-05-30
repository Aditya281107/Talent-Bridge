import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import CompanyCard from '../components/users/CompanyCard';
import './Companies.css';

const Companies = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const fetchEmployers = useCallback(async () => {
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

      const res = await userService.searchEmployers(params);
      setEmployers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch employers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filters, page]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

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
    <div className="page companies-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            Explore <span className="gradient-text">Companies</span>
          </h1>
          <p className="page-subtitle">
            Discover {pagination.total || 0} companies hiring now
          </p>
        </div>

        {/* Search Bar */}
        <div className="companies-search glass">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search companies by name or industry..."
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

        <div className="companies-layout">
          {/* Filters Sidebar */}
          <aside className="companies-sidebar">
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Filters</h3>

              <div className="filter-group">
                <label className="filter-label">Industry</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Technology"
                  value={filters.industry || ''}
                  onChange={(e) => handleFilterChange('industry', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. San Francisco"
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Company Size</label>
                <select
                  className="form-input"
                  value={filters.companySize || ''}
                  onChange={(e) => handleFilterChange('companySize', e.target.value)}
                >
                  <option value="">All sizes</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={handleResetFilters} style={{ width: '100%' }}>
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Companies Grid */}
          <main>
            {loading ? (
              <div className="companies-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card job-skeleton">
                    <div className="skeleton-line skeleton-sm"></div>
                    <div className="skeleton-line skeleton-lg"></div>
                    <div className="skeleton-line skeleton-md"></div>
                  </div>
                ))}
              </div>
            ) : employers.length > 0 ? (
              <>
                <div className="companies-grid">
                  {employers.map((employer) => (
                    <CompanyCard key={employer._id} employer={employer} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="companies-pagination">
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
                <div className="empty-state-icon">🏢</div>
                <h3 className="empty-state-title">No companies found</h3>
                <p className="empty-state-text">
                  Try adjusting your search or filters.
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

export default Companies;
