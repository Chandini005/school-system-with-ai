import React from 'react';

/**
 * ChatMessage – standalone message bubble component.
 * Uses inline styles only (no Tailwind or external CSS).
 */
const ChatMessage = ({ message, isUser }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '10px',
    }}>
      <div style={{
        maxWidth: '80%',
        padding: '9px 13px',
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
        fontFamily: '"Sora","Inter",system-ui,sans-serif',
      }}>
        <p style={{ margin: 0 }}>{message.message}</p>
        <p style={{
          margin: '4px 0 0',
          fontSize: '0.65rem',
          color: isUser ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
          textAlign: isUser ? 'left' : 'right',
        }}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;