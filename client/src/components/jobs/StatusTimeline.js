import React from 'react';
import './StatusTimeline.css';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusTimeline = ({ history = [], currentStatus }) => {
  if (!history || history.length === 0) {
    return (
      <div className="status-timeline">
        <div className="timeline-title">
          <span className="timeline-title-icon">📋</span>
          Status History
        </div>
        <div className="timeline-empty">No status history available</div>
      </div>
    );
  }

  return (
    <div className="status-timeline">
      <div className="timeline-title">
        <span className="timeline-title-icon">📋</span>
        Status History
      </div>
      <div className="timeline-list">
        {history.map((entry, index) => (
          <div
            key={entry._id || index}
            className="timeline-item"
          >
            <div className={`timeline-dot dot-${entry.toStatus}`} />
            <div className="timeline-content">
              <div className="timeline-header">
                <span className={`status-badge status-${entry.fromStatus}`}>
                  {entry.fromStatus}
                </span>
                <span className="timeline-arrow">→</span>
                <span className={`status-badge status-${entry.toStatus}`}>
                  {entry.toStatus}
                </span>
              </div>
              <div className="timeline-meta">
                <span className="timeline-user">
                  <span className="timeline-user-icon">👤</span>
                  {entry.changedBy?.name || 'System'}
                </span>
                <span className="timeline-time">
                  🕐 {formatDate(entry.changedAt)}
                </span>
              </div>
              {entry.note && (
                <div className="timeline-note">{entry.note}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusTimeline;
