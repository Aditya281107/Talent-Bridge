import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import api from '../services/api';
import './Scoreboard.css';

const Scoreboard = () => {
  const { jobId } = useParams();
  const { socket } = useSocket();

  const [scoreboard, setScoreboard] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [flashId, setFlashId] = useState(null);

  useEffect(() => {
    fetchScoreboard();
    // eslint-disable-next-line
  }, [jobId]);

  // Join scoreboard room and listen for real-time updates
  useEffect(() => {
    if (socket && jobId) {
      socket.emit('join-scoreboard', { jobId });

      socket.on('scoreboard-update', (data) => {
        setScoreboard((prev) => {
          const updated = prev.map((entry) =>
            entry.applicationId === data.applicationId
              ? {
                  ...entry,
                  oaScore: data.score,
                  oaStatus: data.oaStatus,
                  proctorWarnings: data.warningsCount,
                }
              : entry
          );
          // Re-sort by score descending
          updated.sort((a, b) => b.oaScore - a.oaScore);
          // Re-assign ranks
          return updated.map((entry, i) => ({ ...entry, rank: i + 1 }));
        });
        setFlashId(data.applicationId);
        setTimeout(() => setFlashId(null), 1500);
      });
    }

    return () => {
      if (socket) {
        socket.off('scoreboard-update');
      }
    };
  }, [socket, jobId]);

  const fetchScoreboard = async () => {
    try {
      const res = await api.get(`/applications/job/${jobId}/scoreboard`);
      setScoreboard(res.data);
      setJobTitle(res.jobTitle);
      setJobCompany(res.jobCompany);
    } catch (err) {
      console.error('Failed to fetch scoreboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#60a5fa';
    if (score >= 40) return '#fbbf24';
    return '#f87171';
  };

  const getWarningsClass = (w) => {
    if (w === 0) return 'warnings-clean';
    if (w <= 2) return 'warnings-mild';
    return 'warnings-severe';
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-default';
  };

  // Stats
  const totalCandidates = scoreboard.length;
  const completedCount = scoreboard.filter((s) => s.oaStatus === 'completed').length;
  const avgScore =
    completedCount > 0
      ? Math.round(
          scoreboard
            .filter((s) => s.oaStatus === 'completed')
            .reduce((sum, s) => sum + s.oaScore, 0) / completedCount
        )
      : 0;
  const topScore = completedCount > 0 ? Math.max(...scoreboard.map((s) => s.oaScore)) : 0;

  if (loading) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '100px' }}>
        <div className="loader"></div>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Loading Scoreboard...</p>
      </div>
    );
  }

  return (
    <div className="page scoreboard-page">
      <div className="container">
        <div className="scoreboard-header">
          <div>
            <h1 className="page-title">
              Live <span className="gradient-text">Scoreboard</span>
            </h1>
            <p className="page-subtitle">
              {jobTitle} at {jobCompany}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="scoreboard-live-badge">
              <span className="scoreboard-live-dot"></span>
              LIVE
            </span>
            <Link to="/dashboard" className="btn btn-secondary">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="scoreboard-stats">
          <div className="scoreboard-stat">
            <div className="scoreboard-stat-value">{totalCandidates}</div>
            <div className="scoreboard-stat-label">Total Candidates</div>
          </div>
          <div className="scoreboard-stat">
            <div className="scoreboard-stat-value">{completedCount}</div>
            <div className="scoreboard-stat-label">Completed</div>
          </div>
          <div className="scoreboard-stat">
            <div className="scoreboard-stat-value">{avgScore}%</div>
            <div className="scoreboard-stat-label">Average Score</div>
          </div>
          <div className="scoreboard-stat">
            <div className="scoreboard-stat-value">{topScore}%</div>
            <div className="scoreboard-stat-label">Top Score</div>
          </div>
        </div>

        {/* Scoreboard Table */}
        {scoreboard.length > 0 ? (
          <div className="scoreboard-table-wrapper">
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Warnings</th>
                  <th>Assessment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry) => (
                  <tr
                    key={entry.applicationId}
                    className={flashId === entry.applicationId ? 'score-flash' : ''}
                  >
                    <td>
                      <span className={`rank-badge ${getRankClass(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td>
                      <div className="scoreboard-candidate">
                        <div className="scoreboard-avatar">
                          {entry.applicant?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="scoreboard-candidate-name">
                            {entry.applicant?.name}
                          </div>
                          <div className="scoreboard-candidate-email">
                            {entry.applicant?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="score-bar-wrapper">
                        <div className="score-bar">
                          <div
                            className="score-bar-fill"
                            style={{
                              width: `${entry.oaScore}%`,
                              background: getScoreBarColor(entry.oaScore),
                            }}
                          ></div>
                        </div>
                        <span className={`score-value ${getScoreClass(entry.oaScore)}`}>
                          {entry.oaScore}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`oa-status-badge oa-${entry.oaStatus}`}
                      >
                        {entry.oaStatus === 'completed'
                          ? '✅ Completed'
                          : entry.oaStatus === 'in-progress'
                          ? '⏳ In Progress'
                          : '🔲 Pending'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`warnings-count ${getWarningsClass(
                          entry.proctorWarnings
                        )}`}
                      >
                        {entry.proctorWarnings === 0
                          ? '✓ Clean'
                          : `⚠ ${entry.proctorWarnings}`}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {entry.assessmentTitle}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/live-monitor/${entry.applicationId}`}
                        className="btn btn-secondary btn-sm"
                      >
                        👁️ Monitor
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="scoreboard-empty card">
            <div className="scoreboard-empty-icon">📊</div>
            <h3 className="empty-state-title">No assessments assigned yet</h3>
            <p className="empty-state-text">
              Assign assessments to candidates from the job applications page to populate the scoreboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
