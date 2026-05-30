import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import './Assessment.css';

const Assessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [warnings, setWarnings] = useState(0);

  // Coding State
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [codingAnswers, setCodingAnswers] = useState({});
  const [runResults, setRunResults] = useState(null);
  const [running, setRunning] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(null); // in seconds
  const timerRef = useRef(null);

  const warningsRef = useRef(0);

  useEffect(() => {
    fetchAssessment();
    
    // Tab switching proctoring
    const handleVisibilityChange = () => {
      if (document.hidden) {
        warningsRef.current += 1;
        setWarnings(warningsRef.current);
        
        if (socket) {
          socket.emit('tab-switch-warning', {
            applicationId: id,
            warningsCount: warningsRef.current
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [id, socket]);

  useEffect(() => {
    if (socket && assessment) {
      socket.emit('join-oa-room', { applicationId: id });
    }
  }, [socket, assessment, id]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null) return;

    if (timeRemaining <= 0) {
      // Auto-submit when timer expires
      handleSubmit(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [timeRemaining !== null]);

  const fetchAssessment = async () => {
    try {
      const res = await api.get(`/applications/${id}/assessment`);
      setAssessment(res);
      if (res.type === 'coding') {
        const initialAnswers = {};
        if (res.codingQuestions) {
          res.codingQuestions.forEach((q, idx) => {
            initialAnswers[idx] = q.initialCode?.javascript || '';
          });
        }
        setCodingAnswers(initialAnswers);
      }
      // Start timer if timeLimit > 0
      if (res.timeLimit && res.timeLimit > 0) {
        setTimeRemaining(res.timeLimit * 60); // convert minutes to seconds
      }
    } catch (err) {
      alert('Failed to load assessment');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleEditorChange = (value) => {
    setCodingAnswers(prev => ({ ...prev, [activeQuestion]: value }));
    if (socket) {
      socket.emit('code-change', {
        applicationId: id,
        code: value,
        language
      });
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const newAnswers = {};
    if (assessment?.codingQuestions) {
      assessment.codingQuestions.forEach((q, idx) => {
        newAnswers[idx] = q.initialCode?.[newLang] || '';
      });
    }
    setCodingAnswers(newAnswers);
    if (socket) {
      socket.emit('code-change', {
        applicationId: id,
        code: newAnswers[activeQuestion] || '',
        language: newLang
      });
    }
  };

  const handleRunCode = async () => {
    setRunning(true);
    setRunResults(null);
    try {
      const res = await api.post(`/applications/${id}/run-code`, {
        code: codingAnswers[activeQuestion],
        language,
        questionIndex: activeQuestion
      });
      setRunResults(res);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleQuizAnswer = (questionIndex, optionIndex) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm('Are you sure you want to submit? This cannot be undone.')) return;
    
    setSubmitting(true);
    try {
      const payload = {
        warningsCount: warningsRef.current,
      };

      if (assessment.type === 'coding') {
        payload.codingAnswers = codingAnswers;
        payload.language = language;
      } else if (assessment.type === 'quiz') {
        // Convert { 0: 2, 1: 0, ... } to [2, 0, ...]
        const answersArray = assessment.questions.map((_, i) =>
          quizAnswers[i] !== undefined ? quizAnswers[i] : -1
        );
        payload.answers = answersArray;
      }

      const res = await api.post(`/applications/${id}/assessment`, payload);
      alert(`Assessment Submitted! Score: ${res.score}%`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="page" style={{textAlign:'center', padding: '100px'}}>Loading Assessment...</div>;

  const isQuiz = assessment?.type === 'quiz';

  return (
    <div className="page assessment-page">
      <div className="container">
        
        {/* Timer & Warnings Bar */}
        <div className="assessment-top-bar">
          {warnings > 0 && (
            <div className="proctor-warning-banner">
              ⚠️ Proctor Warning: You have switched tabs {warnings} time(s). This is recorded.
            </div>
          )}
          {timeRemaining !== null && (
            <div className={`assessment-timer ${timeRemaining < 60 ? 'timer-critical' : timeRemaining < 300 ? 'timer-warning' : ''}`}>
              ⏱ {formatTimer(timeRemaining)}
            </div>
          )}
        </div>

        <div className="assessment-container">
          <aside className="assessment-sidebar">
            <h2 className="assessment-title">{assessment.title}</h2>
            <div className="assessment-type-badge">
              {isQuiz ? '📝 Quiz' : '💻 Coding Challenge'}
            </div>
            
            {isQuiz ? (
              <div className="assessment-description">{assessment.description}</div>
            ) : (
              <div className="assessment-description">
                <p><strong>{assessment.title}</strong><br/>{assessment.description}</p>
                <hr style={{ margin: '15px 0', borderColor: '#333' }} />
                <h3>{assessment.codingQuestions?.[activeQuestion]?.title}</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{assessment.codingQuestions?.[activeQuestion]?.description}</p>
              </div>
            )}
            
            {!isQuiz && (
              <div className="assessment-tests">
                <h3>Sample Test Cases</h3>
                {assessment.codingQuestions?.[activeQuestion]?.testCases?.map((tc, i) => (
                  <div key={i} className="test-case">
                    <div><strong>Input:</strong></div>
                    <div><pre style={{ margin: 0, fontFamily: 'monospace' }}>{tc.input}</pre></div>
                    <div style={{marginTop: 8}}><strong>Expected Output:</strong></div>
                    <div><pre style={{ margin: 0, fontFamily: 'monospace' }}>{tc.expectedOutput}</pre></div>
                  </div>
                ))}
              </div>
            )}

            {isQuiz && (
              <div className="quiz-progress">
                <h3>Progress</h3>
                <div className="quiz-progress-info">
                  {Object.keys(quizAnswers).length} / {assessment.questions?.length} answered
                </div>
                <div className="quiz-progress-bar">
                  <div
                    className="quiz-progress-fill"
                    style={{
                      width: `${(Object.keys(quizAnswers).length / (assessment.questions?.length || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </aside>

          <main className="assessment-editor-area">
            {isQuiz ? (
              /* Quiz Mode */
              <div className="quiz-container">
                {assessment.questions?.map((q, qIndex) => (
                  <div key={q._id || qIndex} className="quiz-question-card">
                    <div className="quiz-question-header">
                      <span className="quiz-question-number">Q{qIndex + 1}</span>
                      <span className="quiz-question-points">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="quiz-question-text">{q.question}</div>
                    <div className="quiz-options">
                      {q.options.map((option, oIndex) => (
                        <label
                          key={oIndex}
                          className={`quiz-option ${quizAnswers[qIndex] === oIndex ? 'quiz-option-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            checked={quizAnswers[qIndex] === oIndex}
                            onChange={() => handleQuizAnswer(qIndex, oIndex)}
                          />
                          <span className="quiz-option-label">{String.fromCharCode(65 + oIndex)}</span>
                          <span className="quiz-option-text">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="assessment-footer">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                  >
                    {submitting ? 'Grading...' : 'Submit Quiz'}
                  </button>
                </div>
              </div>
            ) : (
              /* Coding Mode */
              <div className="coding-mode-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {assessment.codingQuestions && assessment.codingQuestions.length > 1 && (
                  <div className="question-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {assessment.codingQuestions.map((q, idx) => (
                      <button 
                        key={idx} 
                        className={`btn ${activeQuestion === idx ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '6px 12px', fontSize: '14px', whiteSpace: 'nowrap' }}
                        onClick={() => { setActiveQuestion(idx); setRunResults(null); }}
                      >
                        Q{idx + 1}: {q.title}
                      </button>
                    ))}
                  </div>
                )}

                <div className="editor-header">
                  <span style={{ fontWeight: 'bold' }}>Code Editor - {assessment.codingQuestions?.[activeQuestion]?.title}</span>
                  <select className="language-select" value={language} onChange={handleLanguageChange}>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                
                <div style={{ flex: 1, minHeight: '350px' }}>
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={language === 'cpp' ? 'cpp' : language}
                    value={codingAnswers[activeQuestion] || ''}
                    onChange={handleEditorChange}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 16,
                      padding: { top: 16 }
                    }}
                  />
                </div>

                {/* Results Pane */}
                {runResults && (
                  <div className="run-results-pane" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '8px', color: '#fff', maxHeight: '300px', overflowY: 'auto' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                      Execution Results (Score: {runResults.score}%)
                    </h3>
                    {runResults.results.map((r, i) => (
                      <div key={i} style={{ marginBottom: '10px', padding: '10px', backgroundColor: r.passed ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', borderLeft: `4px solid ${r.passed ? '#2ecc71' : '#e74c3c'}` }}>
                        <div><strong>Test Case {i + 1}: {r.passed ? '✅ Passed' : '❌ Failed'}</strong></div>
                        <div style={{ marginTop: '5px' }}><strong>Input:</strong> <pre style={{ display: 'inline', background: 'transparent', padding: 0 }}>{r.input}</pre></div>
                        <div><strong>Expected:</strong> <pre style={{ display: 'inline', background: 'transparent', padding: 0 }}>{r.expected}</pre></div>
                        <div><strong>Actual:</strong> <pre style={{ display: 'inline', background: 'transparent', padding: 0 }}>{r.actual || (r.error ? 'Error' : 'None')}</pre></div>
                        {r.error && <div style={{ color: '#e74c3c', marginTop: '5px', padding: '10px', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '4px' }}><pre style={{margin: 0, whiteSpace: 'pre-wrap'}}>{r.error}</pre></div>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="assessment-footer" style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end', paddingTop: '15px', borderTop: '1px solid #333' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={handleRunCode}
                    disabled={running || submitting}
                  >
                    {running ? 'Running...' : '▶ Run Code'}
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleSubmit(false)}
                    disabled={submitting || running}
                  >
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
