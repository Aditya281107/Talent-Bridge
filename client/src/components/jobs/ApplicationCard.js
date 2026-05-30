import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import api from '../../services/api';
import StatusTimeline from './StatusTimeline';
import './ApplicationCard.css';

const ApplicationCard = ({ application, isEmployerView = false, onStatusChange }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Assessment picker
  const [showOAPicker, setShowOAPicker] = useState(false);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [assigningOA, setAssigningOA] = useState(false);

  const handleShowOAPicker = async () => {
    setShowOAPicker(true);
    setLoadingAssessments(true);
    try {
      const res = await api.get('/assessments');
      setAvailableAssessments(res.data || []);
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleAssignOA = async (assessmentId) => {
    setAssigningOA(true);
    try {
      await api.put(`/applications/${application._id}/assign-oa`, { assessmentId });
      window.location.reload();
    } catch (err) {
      console.error('Failed to assign OA:', err);
    } finally {
      setAssigningOA(false);
    }
  };

  const statusOptions = ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'];

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

  const handleViewHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    setHistoryLoading(true);
    try {
      const res = await applicationService.getHistory(application._id);
      setHistory(res.data);
      setShowHistory(true);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStatusSelect = (e) => {
    const newStatus = e.target.value;
    if (newStatus === application.status) return;
    setPendingStatus(newStatus);
    setShowNoteInput(true);
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatus && onStatusChange) {
      onStatusChange(application._id, pendingStatus, statusNote, application.__v, scheduledDate, meetingLink);
    }
    setShowNoteInput(false);
    setStatusNote('');
    setScheduledDate('');
    setMeetingLink('');
    setPendingStatus(null);
  };

  const handleCancelStatusChange = () => {
    setShowNoteInput(false);
    setStatusNote('');
    setScheduledDate('');
    setMeetingLink('');
    setPendingStatus(null);
  };

  return (
    <div className="application-card card">
      <div className="app-card-header">
        <div className="app-card-info">
          {isEmployerView ? (
            <>
              <div className="app-card-avatar">
                {application.applicant?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div>
                <h4 className="app-card-name">{application.applicant?.name}</h4>
                <p className="app-card-detail">{application.applicant?.title || 'Job Seeker'}</p>
                <p className="app-card-detail">{application.applicant?.email}</p>
              </div>
            </>
          ) : (
            <>
              <div className="app-card-avatar">
                {application.job?.company?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <Link to={`/jobs/${application.job?._id}`} className="app-card-name">
                  {application.job?.title}
                </Link>
                <p className="app-card-detail">{application.job?.company}</p>
                <p className="app-card-detail">📍 {application.job?.location}</p>
              </div>
            </>
          )}
        </div>
        <span className={`status-badge status-${application.status}`}>
          {application.status}
        </span>
      </div>

      {application.coverLetter && (
        <div className="app-card-cover">
          <p className="app-card-cover-text">
            {application.coverLetter.length > 150
              ? `${application.coverLetter.substring(0, 150)}...`
              : application.coverLetter}
          </p>
        </div>
      )}

      <div className="app-card-footer">
        <span className="app-card-time">Applied {timeAgo(application.createdAt)}</span>

        {isEmployerView && onStatusChange && !showNoteInput && (
          <div className="app-card-actions">
            <select
              className="form-input app-status-select"
              value={application.status}
              onChange={handleStatusSelect}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {isEmployerView && application.applicant?.skills?.length > 0 && (
          <div className="app-card-skills">
            {application.applicant.skills.slice(0, 4).map((skill, i) => (
              <span key={i} className="job-card-skill">{skill}</span>
            ))}
          </div>
        )}

        {/* Bonus Stage: OA Actions */}
        <div className="app-card-actions" style={{ marginLeft: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isEmployerView ? (
            <>
              {!application.assessmentRef ? (
                !showOAPicker ? (
                  <button className="btn btn-secondary btn-sm" onClick={handleShowOAPicker} disabled={assigningOA}>
                    📋 Assign OA
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                    {loadingAssessments ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</span>
                    ) : availableAssessments.length > 0 ? (
                      availableAssessments.map((a) => (
                        <button
                          key={a._id}
                          className="btn btn-secondary btn-sm"
                          style={{ textAlign: 'left', fontSize: '0.78rem' }}
                          onClick={() => handleAssignOA(a._id)}
                          disabled={assigningOA}
                        >
                          {a.type === 'quiz' ? '📝' : '💻'} {a.title}
                        </button>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No assessments available</span>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowOAPicker(false)} style={{ fontSize: '0.75rem' }}>Cancel</button>
                  </div>
                )
              ) : (
                <Link to={`/live-monitor/${application._id}`} className="btn btn-secondary btn-sm">
                  👁️ {application.oaStatus === 'completed' ? `Score: ${application.oaScore}%` : 'Live Monitor'}
                </Link>
              )}
              {application.status === 'accepted' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('tb_token');
                      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                      const response = await fetch(`${baseURL}/applications/${application._id}/offer-letter`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (!response.ok) throw new Error('Failed to download');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Offer_Letter.pdf`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Failed to download offer letter:', err);
                    }
                  }}
                >
                  📄 Offer Letter
                </button>
              )}
            </>
          ) : (
            <>
              {application.assessmentRef && application.oaStatus !== 'completed' && (
                <Link to={`/assessment/${application._id}`} className="btn btn-primary btn-sm">
                  🚀 Take Assessment
                </Link>
              )}
              {application.oaStatus === 'completed' && (
                <span className="badge badge-success">OA Score: {application.oaScore}%</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status change note input */}
      {showNoteInput && (
        <div className="app-card-note-section">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Changing status to <span className={`status-badge status-${pendingStatus}`}>{pendingStatus}</span>
          </p>

          {pendingStatus === 'shortlisted' && (
            <div style={{ marginBottom: '8px' }}>
              <input
                type="datetime-local"
                className="form-input"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{ marginBottom: '8px' }}
                title="Schedule Interview/OA Date"
              />
              <input
                type="text"
                className="form-input"
                placeholder="Meeting Link / Location (optional)"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          )}

          <input
            type="text"
            className="form-input"
            placeholder="Add a note (optional)..."
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleConfirmStatusChange}>
              Confirm
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleCancelStatusChange}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* History toggle button */}
      <div className="app-card-history-section">
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleViewHistory}
          disabled={historyLoading}
          style={{ width: '100%', marginTop: '12px' }}
        >
          {historyLoading ? '⏳ Loading...' : showHistory ? '▲ Hide History' : '📋 View History'}
        </button>

        {showHistory && history && (
          <div style={{ marginTop: '16px' }}>
            <StatusTimeline
              history={history.history}
              currentStatus={history.currentStatus}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationCard;
