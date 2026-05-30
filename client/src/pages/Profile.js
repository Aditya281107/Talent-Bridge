import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import userService from '../services/userService';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, isSeeker, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        title: user.title || '',
        skills: user.skills?.join(', ') || '',
        experience: user.experience || 0,
        company: user.company || '',
        companyWebsite: user.companyWebsite || '',
        companySize: user.companySize || '',
        industry: user.industry || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experience: Number(formData.experience) || 0,
      };

      const res = await userService.updateProfile(payload);
      updateUser(res.data);
      setEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [parsing, setParsing] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showToast('Please upload a PDF file', 'error');
      return;
    }

    setParsing(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const data = await api.post('/users/profile/parse-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      updateUser(data.data);
      showToast('Resume magically parsed!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setParsing(false);
      e.target.value = null; // reset input
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="page profile-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}

      <div className="container">
        <div className="profile-layout">
          {/* Profile Card */}
          <div className="profile-header-card card">
            <div className="profile-avatar-section">
              <div className="profile-avatar-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="profile-header-info">
                <h1 className="profile-name">{user?.name}</h1>
                <p className="profile-email">{user?.email}</p>
                <span className="badge badge-primary">{user?.role}</span>
              </div>
            </div>
            {!editing && (
              <div style={{ display: 'flex', gap: '10px' }}>
                {isSeeker && (
                  <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    {parsing ? '⏳ Parsing...' : '✨ Magic Update from Resume'}
                    <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleResumeUpload} disabled={parsing} />
                  </label>
                )}
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                  ✏️ Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Profile Form / Display */}
          <div className="profile-content">
            {editing ? (
              <form onSubmit={handleSubmit} className="profile-form card">
                <h2 className="profile-section-title">Edit Profile</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input name="name" type="text" className="form-input" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input name="phone" type="text" className="form-input" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 123-4567" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input name="location" type="text" className="form-input" value={formData.location} onChange={handleChange} placeholder="City, Country" />
                </div>

                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea name="bio" className="form-input" rows="3" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." maxLength={500}></textarea>
                </div>

                {isSeeker ? (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Professional Title</label>
                        <input name="title" type="text" className="form-input" value={formData.title} onChange={handleChange} placeholder="e.g., Full Stack Developer" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Years of Experience</label>
                        <input name="experience" type="number" className="form-input" value={formData.experience} onChange={handleChange} min="0" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Skills</label>
                      <input name="skills" type="text" className="form-input" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, Python..." />
                      <span className="form-hint">Comma-separated</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Company Name</label>
                        <input name="company" type="text" className="form-input" value={formData.company} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Industry</label>
                        <input name="industry" type="text" className="form-input" value={formData.industry} onChange={handleChange} placeholder="e.g., Technology" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Company Website</label>
                        <input name="companyWebsite" type="url" className="form-input" value={formData.companyWebsite} onChange={handleChange} placeholder="https://..." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Company Size</label>
                        <select name="companySize" className="form-input" value={formData.companySize} onChange={handleChange}>
                          <option value="">Select size</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-500">201-500</option>
                          <option value="500+">500+</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="profile-form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <><span className="loader loader-sm"></span> Saving...</> : 'Save Changes →'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-display">
                <div className="card profile-info-card">
                  <h2 className="profile-section-title">About</h2>
                  <p className="profile-bio">{user?.bio || 'No bio added yet.'}</p>

                  <div className="profile-details-grid">
                    <div className="profile-detail">
                      <span className="profile-detail-label">📍 Location</span>
                      <span className="profile-detail-value">{user?.location || 'Not specified'}</span>
                    </div>
                    <div className="profile-detail">
                      <span className="profile-detail-label">📞 Phone</span>
                      <span className="profile-detail-value">{user?.phone || 'Not specified'}</span>
                    </div>
                    {isSeeker ? (
                      <>
                        <div className="profile-detail">
                          <span className="profile-detail-label">💼 Title</span>
                          <span className="profile-detail-value">{user?.title || 'Not specified'}</span>
                        </div>
                        <div className="profile-detail">
                          <span className="profile-detail-label">📊 Experience</span>
                          <span className="profile-detail-value">{user?.experience || 0} years</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="profile-detail">
                          <span className="profile-detail-label">🏢 Company</span>
                          <span className="profile-detail-value">{user?.company || 'Not specified'}</span>
                        </div>
                        <div className="profile-detail">
                          <span className="profile-detail-label">🏭 Industry</span>
                          <span className="profile-detail-value">{user?.industry || 'Not specified'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {isSeeker && user?.skills?.length > 0 && (
                  <div className="card profile-info-card">
                    <h2 className="profile-section-title">Skills</h2>
                    <div className="profile-skills">
                      {user.skills.map((skill, i) => (
                        <span key={i} className="badge badge-accent">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
