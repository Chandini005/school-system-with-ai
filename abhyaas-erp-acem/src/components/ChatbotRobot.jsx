import React, { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';

const ChatbotRobot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Hide the welcome bubble after 6 seconds
    const timer = setTimeout(() => setShowWelcome(false), 6000);
    // Pulse animation for the button
    const pulseTimer = setInterval(() => {
      setPulse(p => !p);
    }, 2500);
    return () => { clearTimeout(timer); clearInterval(pulseTimer); };
  }, []);

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    setShowWelcome(false);
  };

  return (
    <>
      <style>{`
        @keyframes botPulse {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          70%  { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        @keyframes welcomeFadeIn {
          from { opacity: 0; transform: translateY(6px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .bot-btn-wrap:hover .bot-icon-btn {
          transform: scale(1.1);
        }
      `}</style>

      {/* Floating Button Wrapper */}
      <div
        className="bot-btn-wrap"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px',
          fontFamily: '"Sora", "Inter", system-ui, sans-serif',
        }}
      >
        {/* Welcome bubble */}
        {showWelcome && !isOpen && (
          <div style={{
            background: 'rgba(10,17,40,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,179,237,0.2)',
            borderRadius: '12px',
            padding: '10px 14px',
            maxWidth: '220px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            animation: 'welcomeFadeIn 0.3s ease both',
            position: 'relative',
          }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.4' }}>
              👋 Hi! I'm the <strong style={{ color: '#60a5fa' }}>ABHYAAS Assistant</strong>.
              <br />Ask me anything!
            </p>
            {/* Pointer */}
            <div style={{
              position: 'absolute',
              bottom: '-7px',
              right: '20px',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid rgba(99,179,237,0.2)',
            }} />
          </div>
        )}

        {/* Main FAB button */}
        <button
          className="bot-icon-btn"
          onClick={toggleChat}
          aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            border: 'none',
            background: isOpen
              ? 'linear-gradient(135deg,#ef4444,#dc2626)'
              : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            color: '#fff',
            fontSize: isOpen ? '20px' : '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(59,130,246,0.45)',
            transition: 'transform 0.25s, background 0.3s, box-shadow 0.3s',
            animation: !isOpen ? 'botPulse 2.5s ease infinite' : 'none',
            outline: 'none',
          }}
        >
          {isOpen ? '✕' : '🤖'}
        </button>
      </div>

      {/* Chat Window */}
      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatbotRobot;