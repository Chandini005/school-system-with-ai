import React, { useState, useRef, useEffect } from 'react';
import AIService from '../services/AIService';

/* ─────────────────────────────────────────────
   Inline styles kept as JS objects so there is
   NO dependency on Tailwind or external CSS files.
───────────────────────────────────────────── */

const STYLES = {
  overlay: {
    position: 'fixed',
    bottom: '80px',
    right: '16px',
    width: 'clamp(300px, 90vw, 380px)',
    height: 'clamp(420px, 70vh, 520px)',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(10,17,40,0.97)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(99,179,237,0.18)',
    borderRadius: '18px',
    boxShadow: '0 24px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    zIndex: 9999,
    overflow: 'hidden',
    fontFamily: '"Sora", "Inter", system-ui, sans-serif',
    animation: 'chatSlideIn 0.28s cubic-bezier(0.22,1,0.36,1) both',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(139,92,246,0.18))',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarWrap: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', flexShrink: 0,
  },
  headerTitle: {
    margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#fff',
  },
  headerSub: {
    margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)',
    display: 'flex', alignItems: 'center', gap: '4px',
  },
  dot: {
    width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.08)', border: 'none',
    width: '28px', height: '28px', borderRadius: '50%',
    color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
    fontSize: '16px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'background 0.2s',
    flexShrink: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    scrollBehavior: 'smooth',
  },
  inputArea: {
    padding: '10px 12px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    background: 'rgba(255,255,255,0.03)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '9px 13px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: '1.4',
    maxHeight: '80px',
    overflowY: 'auto',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    padding: '9px 14px',
    background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: '4px',
    transition: 'opacity 0.2s, transform 0.15s',
    flexShrink: 0,
    height: '38px',
  },
  suggestionPill: {
    display: 'inline-block',
    padding: '5px 11px',
    background: 'rgba(59,130,246,0.12)',
    border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: '20px',
    color: '#93c5fd',
    fontSize: '0.73rem',
    cursor: 'pointer',
    marginRight: '6px',
    marginBottom: '6px',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap',
  },
};

/* ── Message Bubble ──────────────────────────────── */
const Bubble = ({ msg }) => {
  const isUser = msg.sender === 'user';
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '7px',
    }}>
      {!isUser && (
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', flexShrink: 0,
        }}>🤖</div>
      )}

      <div style={{
        maxWidth: '80%',
        padding: '9px 12px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser
          ? 'linear-gradient(135deg,#3b82f6,#6d28d9)'
          : 'rgba(255,255,255,0.08)',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.09)',
        color: '#fff',
        fontSize: '0.84rem',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.message}
        <div style={{
          fontSize: '0.65rem',
          color: isUser ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
          marginTop: '4px',
          textAlign: isUser ? 'left' : 'right',
        }}>{time}</div>
      </div>
    </div>
  );
};

/* ── Typing Indicator ────────────────────────────── */
const TypingDots = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '7px' }}>
    <div style={{
      width: '26px', height: '26px', borderRadius: '50%',
      background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px',
    }}>🤖</div>
    <div style={{
      padding: '10px 14px',
      borderRadius: '14px 14px 14px 4px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.09)',
      display: 'flex', gap: '4px', alignItems: 'center',
    }}>
      {[0, 0.18, 0.36].map((delay, i) => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#60a5fa',
          animation: `typingBounce 1s ${delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  </div>
);

/* ── Main ChatWindow ─────────────────────────────── */
const SUGGESTED = [
  'How do I login?',
  'How to check fees?',
  'Reset my password',
  'View attendance',
];

const ChatWindow = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([{
    id: 1,
    sender: 'bot',
    message: "Hello! I'm the ABHYAAS AI Assistant 🤖\nAsk me anything — about school, fees, results, or anything else!",
    timestamp: new Date().toISOString(),
  }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    const userMsg = { id: Date.now(), sender: 'user', message: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const history = messages.slice(-12);
      const res = await AIService.sendMessage(msg, history);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        message: res?.response || "I'm Abhyaas Assistant. How can I help you?",
        timestamp: res?.timestamp || new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        message: "I'm Abhyaas Assistant. How can I help you?",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-6px); }
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        .chat-input:focus { border-color: rgba(96,165,250,0.5) !important; }
        .chat-close:hover { background: rgba(255,255,255,0.15) !important; }
        .chat-send:hover:not(:disabled) { opacity: 0.88; transform: scale(0.97); }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .sugg-pill:hover { background: rgba(59,130,246,0.22) !important; }
      `}</style>

      <div style={STYLES.overlay}>
        {/* Header */}
        <div style={STYLES.header}>
          <div style={STYLES.headerLeft}>
            <div style={STYLES.avatarWrap}>🤖</div>
            <div>
              <p style={STYLES.headerTitle}>ABHYAAS Assistant</p>
              <p style={STYLES.headerSub}>
                <span style={STYLES.dot} />
                AI-Powered · Always Online
              </p>
            </div>
          </div>
          <button className="chat-close" style={STYLES.closeBtn} onClick={onClose} aria-label="Close chat">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages" style={STYLES.messagesArea}>
          {messages.map(m => <Bubble key={m.id} msg={m} />)}
          {typing && <TypingDots />}

          {/* Suggested questions shown only at start */}
          {messages.length === 1 && !typing && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>
                Quick questions:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {SUGGESTED.map(q => (
                  <span
                    key={q}
                    className="sugg-pill"
                    style={STYLES.suggestionPill}
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={STYLES.inputArea}>
          <textarea
            ref={inputRef}
            className="chat-input"
            style={STYLES.input}
            rows={1}
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={typing}
          />
          <button
            className="chat-send"
            style={STYLES.sendBtn}
            onClick={() => sendMessage()}
            disabled={!input.trim() || typing}
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;