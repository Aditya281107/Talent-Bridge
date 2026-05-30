import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import jobService from '../services/jobService';
import './PostJob.css';

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company: user?.company || '',
    description: '',
    requirements: '',
    location: '',
    type: 'full-time',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    skills: '',
    experienceLevel: 'mid',
    deadline: '',
  });

  useEffect(() => {
    if (editId) {
      fetchJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const fetchJob = async () => {
    try {
      const res = await jobService.getJobById(editId);
      const job = res.data;
      setFormData({
        title: job.title || '',
        company: job.company || '',
        description: job.description || '',
        requirements: job.requirements?.join('\n') || '',
        location: job.location || '',
        type: job.type || 'full-time',
        salaryMin: job.salaryMin || '',
        salaryMax: job.salaryMax || '',
        salaryCurrency: job.salaryCurrency || 'USD',
        skills: job.skills?.join(', ') || '',
        experienceLevel: job.experienceLevel || 'mid',
        deadline: job.deadline ? job.deadline.split('T')[0] : '',
      });
    } catch (err) {
      showToast('Failed to load job for editing', 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        requirements: formData.requirements
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        salaryMin: Number(formData.salaryMin) || 0,
        salaryMax: Number(formData.salaryMax) || 0,
        deadline: formData.deadline || undefined,
      };

      if (editId) {
        await jobService.updateJob(editId, payload);
        showToast('Job updated successfully!', 'success');
      } else {
        await jobService.createJob(payload);
        showToast('Job posted successfully!', 'success');
      }

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      showToast(err.message || 'Failed to save job', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="page post-job-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}

      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            {editId ? 'Edit' : 'Post a New'}{' '}
            <span className="gradient-text">Job</span>
          </h1>
          <p className="page-subtitle">
            {editId
              ? 'Update your job posting details'
              : 'Fill in the details to create a new job listing'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="post-job-form">
          <div className="post-job-grid">
            {/* Left Column */}
            <div className="post-job-main">
              <div className="card post-job-section">
                <h2 className="post-job-section-title">Basic Information</h2>

                <div className="form-group">
                  <label className="form-label" htmlFor="pj-title">Job Title *</label>
                  <input id="pj-title" name="title" type="text" className="form-input" placeholder="e.g., Senior React Developer" value={formData.title} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pj-company">Company Name *</label>
                  <input id="pj-company" name="company" type="text" className="form-input" placeholder="e.g., TechCorp Inc." value={formData.company} onChange={handleChange} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="pj-location">Location *</label>
                    <input id="pj-location" name="location" type="text" className="form-input" placeholder="e.g., New York, NY or Remote" value={formData.location} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pj-type">Job Type *</label>
                    <select id="pj-type" name="type" className="form-input" value={formData.type} onChange={handleChange}>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="remote">Remote</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pj-desc">Description *</label>
                  <textarea id="pj-desc" name="description" className="form-input" rows="8" placeholder="Describe the role, responsibilities, and what makes it exciting..." value={formData.description} onChange={handleChange} required></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pj-req">Requirements</label>
                  <textarea id="pj-req" name="requirements" className="form-input" rows="5" placeholder="Enter each requirement on a new line..." value={formData.requirements} onChange={handleChange}></textarea>
                  <span className="form-hint">One requirement per line</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="post-job-sidebar">
              <div className="card post-job-section">
                <h2 className="post-job-section-title">Details</h2>

                <div className="form-group">
                  <label className="form-label" htmlFor="pj-exp">Experience Level</label>
                  <select id="pj-exp" name="experienceLevel" className="form-input" value={formData.experienceLevel} onChange={handleChange}>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Salary Range</label>
                  <div className="salary-row">
                    <input name="salaryMin" type="number" className="form-input" placeholder="Min" value={formData.salaryMin} onChange={handleChange} />
                    <span className="salary-sep">—</span>
                    <input name="salaryMax" type="number" className="form-input" placeholder="Max" value={formData.salaryMax} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pj-skills">Skills</label>
                  <input id="pj-skills" name="skills" type="text" className="form-input" placeholder="React, Node.js, TypeScript" value={formData.skills} onChange={handleChange} />
                  <span className="form-hint">Comma-separated</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pj-deadline">Application Deadline</label>
                  <input id="pj-deadline" name="deadline" type="date" className="form-input" value={formData.deadline} onChange={handleChange} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg post-job-submit" disabled={loading}>
                {loading ? (
                  <><span className="loader loader-sm"></span> Saving...</>
                ) : editId ? (
                  'Update Job →'
                ) : (
                  'Post Job →'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
