import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import jobService from '../services/jobService';
import applicationService from '../services/applicationService';
import './JobDetail.css';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isSeeker, isEmployer, user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applied, setApplied] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await jobService.getJobById(id);
      setJob(res.data);
    } catch (err) {
      console.error('Failed to fetch job:', err);
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await applicationService.apply({ jobId: id, coverLetter });
      setApplied(true);
      setShowApplyModal(false);
      showToast('Application submitted successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to apply', 'error');
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await jobService.deleteJob(id);
        navigate('/dashboard');
      } catch (err) {
        showToast(err.message || 'Failed to delete job', 'error');
      }
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Competitive Salary';
    const fmt = (n) => `$${n.toLocaleString()}`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  };

  const isOwner = isEmployer && job?.employer?._id === user?._id;

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="loader"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="page job-detail-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}

      <div className="container">
        <Link to="/jobs" className="back-link">← Back to Jobs</Link>

        <div className="job-detail-layout">
          {/* Main Content */}
          <div className="job-detail-main">
            <div className="job-detail-header card">
              <div className="jd-header-top">
                <div className="jd-company-icon">
                  {job.company?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className="jd-header-info">
                  <h1 className="jd-title">{job.title}</h1>
                  <p className="jd-company">{job.company}</p>
                </div>
              </div>

              <div className="jd-meta">
                <span className="jd-meta-item">📍 {job.location}</span>
                <span className="jd-meta-item">💼 {job.type}</span>
                <span className="jd-meta-item">📊 {job.experienceLevel} level</span>
                <span className="jd-meta-item">💰 {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
              </div>

              <div className="jd-tags">
                <span className={`badge badge-${job.status === 'open' ? 'success' : 'danger'}`}>
                  {job.status}
                </span>
                <span className="badge badge-primary">{job.type}</span>
                {job.skills?.map((skill, i) => (
                  <span key={i} className="badge badge-accent">{skill}</span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="jd-actions">
                {isSeeker && job.status === 'open' && !applied && (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowApplyModal(true)}
                  >
                    Apply Now →
                  </button>
                )}
                {applied && (
                  <div className="jd-applied-badge">
                    <span className="status-badge status-accepted">✓ Application Submitted</span>
                  </div>
                )}
                {isOwner && (
                  <div className="jd-owner-actions">
                    <Link to={`/post-job?edit=${job._id}`} className="btn btn-secondary">
                      ✏️ Edit
                    </Link>
                    <button className="btn btn-danger" onClick={handleDelete}>
                      🗑️ Delete
                    </button>
                  </div>
                )}
                {!isAuthenticated && (
                  <Link to="/login" className="btn btn-primary btn-lg">
                    Sign in to Apply →
                  </Link>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="job-detail-section card">
              <h2 className="jd-section-title">About This Role</h2>
              <div className="jd-description">{job.description}</div>
            </div>

            {/* Requirements */}
            {job.requirements?.length > 0 && (
              <div className="job-detail-section card">
                <h2 className="jd-section-title">Requirements</h2>
                <ul className="jd-requirements">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="jd-requirement">{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="job-detail-sidebar">
            <div className="jd-sidebar-card card">
              <h3 className="jd-sidebar-title">Company Info</h3>
              <div className="jd-employer-info">
                <div className="jd-employer-avatar">
                  {job.employer?.name?.charAt(0)?.toUpperCase() || 'E'}
                </div>
                <div>
                  <p className="jd-employer-name">{job.employer?.company || job.company}</p>
                  <p className="jd-employer-detail">{job.employer?.location}</p>
                </div>
              </div>
              {job.employer?.bio && (
                <p className="jd-employer-bio">{job.employer.bio}</p>
              )}
              {job.employer?.companyWebsite && (
                <a
                  href={job.employer.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  Visit Website ↗
                </a>
              )}
            </div>

            <div className="jd-sidebar-card card">
              <h3 className="jd-sidebar-title">Job Overview</h3>
              <div className="jd-overview-list">
                <div className="jd-overview-item">
                  <span className="jd-overview-label">Posted</span>
                  <span className="jd-overview-value">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {job.deadline && (
                  <div className="jd-overview-item">
                    <span className="jd-overview-label">Deadline</span>
                    <span className="jd-overview-value">
                      {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="jd-overview-item">
                  <span className="jd-overview-label">Applications</span>
                  <span className="jd-overview-value">{job.applicationCount || 0}</span>
                </div>
                <div className="jd-overview-item">
                  <span className="jd-overview-label">Experience</span>
                  <span className="jd-overview-value">{job.experienceLevel}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-backdrop" onClick={() => setShowApplyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Apply to {job.title}</h2>
              <button className="modal-close" onClick={() => setShowApplyModal(false)}>
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
              at {job.company}
            </p>

            <div className="form-group">
              <label className="form-label">Cover Letter (Optional)</label>
              <textarea
                className="form-input"
                rows="6"
                placeholder="Tell the employer why you're a great fit for this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowApplyModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? (
                  <>
                    <span className="loader loader-sm"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Application →'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
