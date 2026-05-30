import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import useSocket from '../hooks/useSocket';
import './Assessment.css'; // Reuse styles

const LiveMonitor = () => {
  const { id } = useParams();
  const { socket } = useSocket();

  const [code, setCode] = useState('// Waiting for candidate to start typing...');
  const [language, setLanguage] = useState('javascript');
  const [alerts, setAlerts] = useState([]);
  const [oaStatus, setOaStatus] = useState('Watching Live...');
  const [finalScore, setFinalScore] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.emit('join-oa-room', { applicationId: id });

      socket.on('live-code-update', (data) => {
        setCode(data.code);
        setLanguage(data.language);
      });

      socket.on('proctor-alert', (data) => {
        setAlerts((prev) => [data, ...prev]);
      });

      socket.on('oa-completed', (data) => {
        setOaStatus('Completed');
        setFinalScore(data.score);
      });
    }

    return () => {
      if (socket) {
        socket.off('live-code-update');
        socket.off('proctor-alert');
        socket.off('oa-completed');
      }
    };
  }, [socket, id]);

  return (
    <div className="page assessment-page">
      <div className="container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            Live <span className="gradient-text">Proctor Monitor</span>
          </h1>
          <Link to="/dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
        </div>

        {finalScore !== null && (
          <div className="proctor-warning-banner" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            ✅ Candidate Submitted! Auto-Graded Score: {finalScore}%
          </div>
        )}

        <div className="assessment-container">
          <aside className="assessment-sidebar">
            <h2 className="assessment-title">Proctor Log</h2>
            <div className="assessment-description">
              Status: <strong>{oaStatus}</strong>
              <br/>
              Language: <strong>{language}</strong>
            </div>
            
            <div className="assessment-tests" style={{ flex: 1, overflowY: 'auto' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>Alerts History</h3>
              {alerts.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No suspicious activity detected.</p>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className="test-case" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ color: '#fca5a5' }}><strong>{alert.message}</strong></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <main className="assessment-editor-area">
            <div className="editor-header">
              <span style={{ fontWeight: 'bold' }}>Candidate's Live Screen</span>
              <span className="badge badge-primary">Read Only</span>
            </div>
            
            <Editor
              height="100%"
              theme="vs-dark"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 16,
                padding: { top: 16 }
              }}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
