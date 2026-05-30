import React, { useState, useEffect } from 'react';
import applicationService from '../services/applicationService';
import ApplicationCard from '../components/jobs/ApplicationCard';
import './MyApplications.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter) params.status = filter;
      const res = await applicationService.getMyApplications(params);
      setApplications(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusFilters = ['', 'pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];

  return (
    <div className="page my-apps-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            My <span className="gradient-text">Applications</span>
          </h1>
          <p className="page-subtitle">
            Track the status of all your job applications
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="apps-filters">
          {statusFilters.map((status) => (
            <button
              key={status}
              className={`apps-filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
            >
              {status || 'All'}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="loader"></div>
          </div>
        ) : applications.length > 0 ? (
          <>
            <div className="apps-list">
              {applications.map((app) => (
                <ApplicationCard key={app._id} application={app} />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="jobs-pagination">
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No applications found</h3>
            <p className="empty-state-text">
              {filter
                ? `You don't have any ${filter} applications.`
                : "You haven't applied to any jobs yet. Start exploring!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
