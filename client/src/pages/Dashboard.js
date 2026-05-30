import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import userService from '../services/userService';
import applicationService from '../services/applicationService';
import jobService from '../services/jobService';
import ApplicationCard from '../components/jobs/ApplicationCard';
import { SkeletonList, SkeletonText } from '../components/layout/SkeletonLoader';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isSeeker, isEmployer } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employerJobs, setEmployerJobs] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await userService.getDashboard();
      setDashData(res.data);

      // Fetch employer's jobs for scoreboard links
      if (res.data.role === 'employer') {
        try {
          const jobRes = await jobService.getMyJobs();
          setEmployerJobs(jobRes.data || []);
        } catch (e) {
          // non-critical
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus, note, version, scheduledDate, meetingLink) => {
    try {
      await applicationService.updateStatus(appId, newStatus, note, version, scheduledDate, meetingLink);
      fetchDashboard(); // Refresh to get the latest status
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="container">
          <div className="dash-welcome">
            <div className="dash-welcome-info" style={{ width: '100%' }}>
              <SkeletonText lines={2} />
            </div>
          </div>
          <div className="dash-stats-grid" style={{ marginBottom: '40px' }}>
            <div className="card"><SkeletonText lines={2} /></div>
            <div className="card"><SkeletonText lines={2} /></div>
            <div className="card"><SkeletonText lines={2} /></div>
            <div className="card"><SkeletonText lines={2} /></div>
          </div>
          <div className="dash-section">
            <h2 className="dash-section-title"><SkeletonText lines={1} /></h2>
            <div className="dash-recent-list">
              <SkeletonList count={2} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="auth-error" style={{ maxWidth: 500, margin: '0 auto' }}>
            <span>⚠</span> {error}
          </div>
        </div>
      </div>
    );
  }

  const stats = dashData?.stats || {};

  return (
    <div className="page dashboard-page">
      <div className="container">
        {/* Welcome Header */}
        <div className="dash-welcome">
          <div className="dash-welcome-info">
            <h1 className="page-title">
              Welcome back, <span className="gradient-text">{user?.name}</span>! 👋
            </h1>
            <p className="page-subtitle">
              {isSeeker
                ? 'Track your applications and discover new opportunities.'
                : 'Manage your job postings and review applicants.'}
            </p>
          </div>
          <div className="dash-welcome-actions">
            {isEmployer ? (
              <Link to="/post-job" className="btn btn-primary">
                + Post New Job
              </Link>
            ) : (
              <Link to="/jobs" className="btn btn-primary">
                Browse Jobs →
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dash-stats-grid">
          {isSeeker ? (
            <>
              <div className="dash-stat-card card">
                <div className="dash-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>📋</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stats.totalApplications || 0}</span>
                  <span className="dash-stat-label">Total Applications</span>
                </div>
              </div>
              <div className="dash-stat-card card">
                <div className="dash-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>⏳</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stats.pending || 0}</span>
                  <span className="dash-stat-label">Pending</span>
                </div>
              </div>
              <div className="dash-stat-card card">
                <div className="dash-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>⭐</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stats.shortlisted || 0}</span>
                  <span className="dash-stat-label">Shortlisted</span>
                </div>
              </div>
              <div className="dash-stat-card card">
                <div className="dash-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>✅</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stats.accepted || 0}</span>
                  <span className="dash-stat-label">Accepted</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="dash-stat-card card">
                <div className="dash-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>📝</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stats.totalJobs || 0}</span>
                  <span className="dash-stat-label">Total Jobs</span>
                </div>
              </div>
              <div className="dash-stat-card card">
                <div className="dash-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>🟢</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stats.openJobs || 0}</span>
                  <span className="dash-stat-label">Open Positions</span>
                </div>
              </div>
              <div className="dash-stat-card card">
                <div className="dash-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>👥</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stats.totalApplicants || 0}</span>
                  <span className="dash-stat-label">Total Applicants</span>
                </div>
              </div>
              <div className="dash-stat-card card">
                <div className="dash-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>📬</div>
                <div className="dash-stat-info">
                  <span className="dash-stat-value">{stats.pendingReview || 0}</span>
                  <span className="dash-stat-label">Pending Review</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Recent Activity</h2>
            {isSeeker ? (
              <Link to="/my-applications" className="btn btn-secondary btn-sm">
                View All →
              </Link>
            ) : null}
          </div>

          <div className="dash-recent-list">
            {isSeeker && dashData?.recentApplications?.length > 0 ? (
              dashData.recentApplications.map((app) => (
                <ApplicationCard key={app._id} application={app} />
              ))
            ) : isEmployer && dashData?.recentApplicants?.length > 0 ? (
              dashData.recentApplicants.map((app) => (
                <ApplicationCard 
                  key={app._id} 
                  application={app} 
                  isEmployerView 
                  onStatusChange={handleStatusChange}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3 className="empty-state-title">No activity yet</h3>
                <p className="empty-state-text">
                  {isSeeker
                    ? 'Start applying to jobs to see your activity here.'
                    : 'Post your first job to start receiving applications.'}
                </p>
                {isSeeker ? (
                  <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
                ) : (
                  <Link to="/post-job" className="btn btn-primary">Post a Job</Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Employer: Jobs & Scoreboards */}
        {isEmployer && employerJobs.length > 0 && (
          <div className="dash-section" style={{ marginTop: 32 }}>
            <div className="dash-section-header">
              <h2 className="dash-section-title">📊 Your Jobs & Scoreboards</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {employerJobs.map((job) => (
                <div key={job._id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{job.title}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {job.company} • {job.applicationCount || 0} applicants
                      </p>
                    </div>
                    <span className={`badge badge-${job.status === 'open' ? 'success' : 'danger'}`} style={{ fontSize: '0.7rem' }}>
                      {job.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/scoreboard/${job._id}`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem' }}>
                      📊 Scoreboard
                    </Link>
                    <Link to={`/jobs/${job._id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
