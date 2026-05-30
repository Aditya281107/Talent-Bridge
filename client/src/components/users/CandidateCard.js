import React from 'react';
import { useNavigate } from 'react-router-dom';
import messageService from '../../services/messageService';
import './CandidateCard.css';

const CandidateCard = ({ candidate }) => {
  const navigate = useNavigate();

  const handleMessage = async (e) => {
    e.stopPropagation();
    try {
      const res = await messageService.startConversation(candidate._id);
      navigate('/messages', { state: { conversationId: res._id } });
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  return (
    <div className="card candidate-card">
      <div className="candidate-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="candidate-avatar">
            {candidate.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="candidate-name">{candidate.name}</div>
            <div className="candidate-title">{candidate.title || 'Job Seeker'}</div>
          </div>
        </div>
        
        {candidate.matchScore !== undefined && candidate.matchScore > 0 && (
          <div className={`badge badge-${candidate.matchScore > 0.6 ? 'success' : 'primary'}`}>
            ✨ {Math.round(candidate.matchScore * 100)}% Match
          </div>
        )}
      </div>

      <div className="candidate-meta">
        {candidate.location && (
          <span className="candidate-meta-item">📍 {candidate.location}</span>
        )}
        <span className="candidate-meta-item">
          💼 {candidate.experience || 0} yr{candidate.experience !== 1 ? 's' : ''} exp
        </span>
      </div>

      {candidate.skills && candidate.skills.length > 0 && (
        <div className="candidate-skills">
          {candidate.skills.slice(0, 6).map((skill, i) => (
            <span key={i} className="candidate-skill">{skill}</span>
          ))}
          {candidate.skills.length > 6 && (
            <span className="candidate-skill">+{candidate.skills.length - 6}</span>
          )}
        </div>
      )}

      {candidate.bio && (
        <p className="candidate-bio">{candidate.bio}</p>
      )}

      <div className="candidate-actions">
        <button className="btn btn-primary btn-sm" onClick={handleMessage}>
          💬 Message
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;
