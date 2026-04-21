import React, { useState, useEffect, useRef } from 'react';

import { API_URL } from '../config/apiConfig';
const API_BASE = `${API_URL}/ai`;

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// ─── AI THEME TOKENS ───
const AI_THEME = {
  bg: '#0a0f1c', // Deep dark space background
  surface: '#111827', // Dark slate surface
  border: '#1e293b', 
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#6366f1', // Indigo glow
  secondary: '#8b5cf6', // Purple glow
  accent: '#06b6d4', // Cyan
  error: '#ef4444',
  success: '#10b981',
  glow: '0 0 20px rgba(99, 102, 241, 0.4)'
};

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, justifyContent: 'center' }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `3px solid ${AI_THEME.primary}40`,
        borderTopColor: AI_THEME.primary,
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ color: AI_THEME.primary, fontWeight: 600, fontSize: 13, letterSpacing: '1px', textTransform: 'uppercase' }}>
        AI is thinking...
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AILearningHub() {
  const [activeTab, setActiveTab] = useState('library'); // library, explain, quiz
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  // Upload state
  const fileInputRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // Explain State
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('Simple');
  const [explanation, setExplanation] = useState('');

  // Quiz State
  const [quizTopic, setQuizTopic] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState('');

  // Initial fetch of notes
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/notes`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } catch (err) {
      console.error('Failed to fetch AI notes');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5MB');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadStatus('Extracting & Processing...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      const res = await fetch(`${API_BASE}/process-notes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setUploadStatus('Processing Complete!');
        fetchNotes();
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        setError(data.message || 'Upload failed');
        setUploadStatus('');
      }
    } catch (err) {
      setError('Network error during upload');
      setUploadStatus('');
    }
    setLoading(false);
  };

  const handleExplain = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setExplanation('');

    try {
      const res = await fetch(`${API_BASE}/explain`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode })
      });
      const data = await res.json();
      if (data.success) setExplanation(data.data.explanation);
      else setError(data.message);
    } catch (err) {
      setError('Failed to get explanation');
    }
    setLoading(false);
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTopic.trim()) return;
    setLoading(true);
    setError(null);
    setQuizData(null);
    setUserAnswers({});
    setQuizResult('');

    try {
      const res = await fetch(`${API_BASE}/quiz`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: quizTopic })
      });
      const data = await res.json();
      if (data.success) setQuizData(data.data);
      else setError(data.message);
    } catch (err) {
      setError('Failed to generate quiz');
    }
    setLoading(false);
  };

  const checkQuizAnswers = () => {
    if (!quizData) return;
    let score = 0;
    let maxScore = quizData.length;
    
    quizData.forEach((q, i) => {
      if (q.type === 'mcq' && userAnswers[i] === q.answer) {
        score++;
      } else if (q.type === 'short' && userAnswers[i]?.trim().length > 5) {
        score++; // Basic check for short answers
      }
    });
    setQuizResult(`You scored ${score} out of ${maxScore}! Check the explanations below.`);
  };

  // --- SUB-VIEWS ---
  const renderLibrary = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: AI_THEME.surface, borderRadius: 16, padding: 32, border: `1px solid ${AI_THEME.border}`, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
        <h3 style={{ color: AI_THEME.text, fontSize: 18, marginBottom: 8 }}>Upload Notes & Handouts</h3>
        <p style={{ color: AI_THEME.textMuted, fontSize: 13, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          Upload PDF or image files (max 5MB). AI will extract text, generate a summary, and prepare the content for chunk-based intelligent querying.
        </p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="application/pdf, image/*" 
          style={{ display: 'none' }} 
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          disabled={loading}
          style={{
            background: `linear-gradient(135deg, ${AI_THEME.primary}, ${AI_THEME.secondary})`,
            color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: AI_THEME.glow, transition: 'transform 0.2s', opacity: loading ? 0.7 : 1
          }}
        >
          {loading && uploadStatus ? uploadStatus : 'Upload File'}
        </button>
      </div>

      <div>
        <h3 style={{ color: AI_THEME.text, fontSize: 16, marginBottom: 16, borderBottom: `1px solid ${AI_THEME.border}`, paddingBottom: 8 }}>My Processed Notes</h3>
        {notes.length === 0 ? (
          <div style={{ color: AI_THEME.textMuted, fontSize: 13, textAlign: 'center', padding: 40 }}>No notes uploaded yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {notes.map(note => (
              <div key={note._id} 
                style={{ 
                  background: AI_THEME.surface, borderRadius: 12, padding: 20, 
                  border: `1px solid ${AI_THEME.border}`, position: 'relative', overflow: 'hidden'
                }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: AI_THEME.primary }} />
                <h4 style={{ color: AI_THEME.text, fontSize: 15, marginBottom: 8, fontWeight: 700 }}>{note.title}</h4>
                <div style={{ fontSize: 11, color: AI_THEME.textMuted, marginBottom: 16 }}>Processed on: {new Date(note.createdAt).toLocaleDateString()}</div>
                <div style={{ fontSize: 13, color: AI_THEME.textMuted, lineHeight: 1.6, height: 60, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {note.summary || 'Summary unavailable.'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderExplain = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>
      <form onSubmit={handleExplain} style={{ background: AI_THEME.surface, borderRadius: 16, padding: 24, border: `1px solid ${AI_THEME.border}` }}>
        <h3 style={{ color: AI_THEME.text, fontSize: 18, marginBottom: 20 }}>Ask the AI Tutor</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: AI_THEME.textMuted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Topic / Question</label>
          <input 
            value={topic} onChange={e => setTopic(e.target.value)} required
            placeholder="e.g. Gravity, Newton's Laws, Photosynthesis"
            style={{ 
              width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${AI_THEME.border}`, 
              background: '#0f172a', color: AI_THEME.text, outline: 'none'
            }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: AI_THEME.textMuted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Explanation Mode</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Simple', 'Teacher', "Explain like I'm 10"].map(m => (
              <div 
                key={m} onClick={() => setMode(m)}
                style={{ 
                  padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: mode === m ? `${AI_THEME.primary}20` : 'transparent',
                  color: mode === m ? AI_THEME.primary : AI_THEME.textMuted,
                  border: `1px solid ${mode === m ? AI_THEME.primary : AI_THEME.border}`
                }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} style={{
          width: '100%', background: AI_THEME.primary, color: '#fff', border: 'none', padding: '12px', borderRadius: 8,
          fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: AI_THEME.glow
        }}>
          ✨ Generate Explanation
        </button>
      </form>

      <div style={{ background: AI_THEME.surface, borderRadius: 16, padding: 24, border: `1px solid ${AI_THEME.border}`, minHeight: 300 }}>
        <h3 style={{ color: AI_THEME.text, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: AI_THEME.textMuted, marginBottom: 16, borderBottom: `1px solid ${AI_THEME.border}`, paddingBottom: 8 }}>AI Response</h3>
        {loading && <Spinner />}
        {!loading && explanation && (
          <div style={{ color: AI_THEME.text, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {explanation}
          </div>
        )}
        {!loading && !explanation && <div style={{ color: AI_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>Your tailored explanation will appear here...</div>}
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {!quizData ? (
        <form onSubmit={handleGenerateQuiz} style={{ background: AI_THEME.surface, borderRadius: 16, padding: 32, border: `1px solid ${AI_THEME.border}`, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
           <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
           <h3 style={{ color: AI_THEME.text, fontSize: 18, marginBottom: 8 }}>Generate Practice Quiz</h3>
           <p style={{ color: AI_THEME.textMuted, fontSize: 13, marginBottom: 24 }}>Enter a topic, and AI will generate 3 MCQs and 2 Short Answer questions to test your knowledge.</p>
           <input 
            value={quizTopic} onChange={e => setQuizTopic(e.target.value)} required
            placeholder="e.g. World War II, Cell Structure..."
            style={{ 
              width: '100%', padding: '14px', borderRadius: 8, border: `1px solid ${AI_THEME.border}`, 
              background: '#0f172a', color: AI_THEME.text, outline: 'none', marginBottom: 16, textAlign: 'center', fontSize: 16
            }}
          />
          <button type="submit" disabled={loading} style={{
            background: `linear-gradient(135deg, ${AI_THEME.primary}, ${AI_THEME.secondary})`,
            color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: AI_THEME.glow
          }}>
            {loading ? 'Creating Quiz...' : 'Generate Quiz ✨'}
          </button>
        </form>
      ) : (
        <div style={{ background: AI_THEME.surface, borderRadius: 16, padding: 32, border: `1px solid ${AI_THEME.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: `1px solid ${AI_THEME.border}`, paddingBottom: 16 }}>
            <h3 style={{ color: AI_THEME.text, fontSize: 20 }}>Quiz: <span style={{ color: AI_THEME.primary }}>{quizTopic}</span></h3>
            <button onClick={() => { setQuizData(null); setQuizTopic(''); }} style={{ background: 'transparent', color: AI_THEME.textMuted, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✖ Reset Options</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {quizData.map((q, index) => (
              <div key={index} style={{ padding: 20, background: '#0f172a', borderRadius: 12, border: `1px solid ${AI_THEME.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: AI_THEME.secondary, marginBottom: 8, textTransform: 'uppercase' }}>Question {index + 1} • {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: AI_THEME.text, marginBottom: 16 }}>{q.question}</div>
                
                {q.type === 'mcq' && q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map(opt => {
                      const isSelected = userAnswers[index] === opt;
                      const isRevealed = !!quizResult;
                      const isCorrect = isRevealed && opt === q.answer;
                      const isWrong = isRevealed && isSelected && !isCorrect;
                      
                      let bg = AI_THEME.bg;
                      let borderColor = AI_THEME.border;
                      if (isSelected) { bg = `${AI_THEME.primary}20`; borderColor = AI_THEME.primary; }
                      if (isCorrect) { bg = `${AI_THEME.success}20`; borderColor = AI_THEME.success; }
                      if (isWrong) { bg = `${AI_THEME.error}20`; borderColor = AI_THEME.error; }

                      return (
                        <div 
                          key={opt}
                          onClick={() => !isRevealed && setUserAnswers(prev => ({...prev, [index]: opt}))}
                          style={{
                            padding: '12px 16px', borderRadius: 8, border: `1px solid ${borderColor}`, background: bg,
                            color: AI_THEME.text, cursor: isRevealed ? 'default' : 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {opt}
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {q.type === 'short' && (
                  <textarea 
                    value={userAnswers[index] || ''}
                    onChange={e => !quizResult && setUserAnswers(prev => ({...prev, [index]: e.target.value}))}
                    placeholder="Type your answer here..."
                    style={{
                      width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${AI_THEME.border}`, background: AI_THEME.bg,
                      color: AI_THEME.text, minHeight: 80, outline: 'none', resize: 'vertical'
                    }}
                    disabled={!!quizResult}
                  />
                )}

                {quizResult && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: `${AI_THEME.primary}10`, borderLeft: `3px solid ${AI_THEME.primary}`, borderRadius: '0 8px 8px 0', fontSize: 13, color: AI_THEME.textMuted }}>
                    <div style={{ fontWeight: 700, color: AI_THEME.text, marginBottom: 4 }}>Answer Check: <span style={{color: AI_THEME.success}}>{q.answer}</span></div>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!quizResult && (
            <button onClick={checkQuizAnswers} style={{
              width: '100%', marginTop: 32, background: AI_THEME.success, color: '#fff', border: 'none', padding: '14px', borderRadius: 8,
              fontSize: 16, fontWeight: 700, cursor: 'pointer'
            }}>
              Submit Quiz & Reveal Answers
            </button>
          )}

          {quizResult && (
            <div style={{ marginTop: 32, padding: 24, textAlign: 'center', background: `${AI_THEME.success}10`, border: `1px solid ${AI_THEME.success}40`, borderRadius: 12, color: AI_THEME.success }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{quizResult}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      background: AI_THEME.bg, minHeight: '100%', borderRadius: 16, padding: 0,
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* HEADER */}
      <div style={{ padding: '32px', background: `linear-gradient(180deg, ${AI_THEME.surface} 0%, ${AI_THEME.bg} 100%)`, borderBottom: `1px solid ${AI_THEME.border}`, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${AI_THEME.primary}, ${AI_THEME.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: AI_THEME.glow }}>
            ✨
          </div>
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>AI Learning Hub</h2>
            <div style={{ color: AI_THEME.textMuted, fontSize: 14, marginTop: 4 }}>Powered by intelligent RAG context awareness</div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 20, padding: 12, background: `${AI_THEME.error}15`, border: `1px solid ${AI_THEME.error}40`, borderRadius: 8, color: AI_THEME.error, fontSize: 13, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
          {[
            { id: 'library', icon: '📄', label: 'Notes AI Library' },
            { id: 'explain', icon: '🧠', label: 'Topic Explainer' },
            { id: 'quiz', icon: '🎯', label: 'Generate Quiz' },
          ].map(t =>(
            <div 
              key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: `2px solid ${activeTab === t.id ? AI_THEME.primary : 'transparent'}`,
                color: activeTab === t.id ? AI_THEME.primary : AI_THEME.textMuted, fontWeight: activeTab === t.id ? 700 : 600,
                fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 32 }}>
        {activeTab === 'library' && renderLibrary()}
        {activeTab === 'explain' && renderExplain()}
        {activeTab === 'quiz' && renderQuiz()}
      </div>
    </div>
  );
}
