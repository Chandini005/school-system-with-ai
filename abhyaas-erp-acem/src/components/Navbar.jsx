import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GlobalYearSwitcher } from '../pages/GlobalYearSwitcher';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ user, meta, onToggle, pendingCount, onLogout }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();


  const unread = 0; 

  // derive page name from last path segment
  const pageName = (() => {
    const seg = location.pathname.split('/').filter(Boolean).pop();
    if (!seg || ['admin', 'student', 'teacher', 'principal', 'parent'].includes(seg))
        return 'Dashboard';
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  })();

  return (
    <header className="h-[var(--navbar-height)] bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-4 md:px-6 lg:px-8 sticky top-0 z-30 shadow-sm transition-all duration-300">
      {/* Mobile Menu Toggle */}
      <button
        onClick={onToggle}
        className="p-2 mr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded-lg transition-colors md:hidden focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
        aria-label="Toggle Menu"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Breadcrumb - Hidden on very small screens, responsive typography */}
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        <div className="hidden sm:flex items-center gap-2 text-[var(--color-text-faint)] text-[11px] uppercase tracking-wider font-bold">
          <span>{user?.role}</span>
          <span>›</span>
        </div>
        <h1 className="text-[14px] md:text-[16px] font-bold text-[var(--color-text)] truncate">
          {pageName}
        </h1>
      </div>

      {/* Action Zone */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        {/* Global Year Switcher - Admin only, responsive visibility */}
        {user?.role?.toLowerCase() === 'admin' && (
          <div className="hidden lg:block">
            <GlobalYearSwitcher />
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className={`p-2.5 rounded-full transition-all duration-200 relative ${showNotif ? 'bg-[var(--color-surface-alt)] text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'}`}
          >
            <span className="text-lg">🔔</span>
            {(unread > 0 || pendingCount > 0) && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[var(--color-danger)] border-2 border-[var(--color-surface)] rounded-full animate-pulse" />
            )}
          </button>
          
          {showNotif && (
            <div className="absolute right-0 mt-3 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg p-4 z-50 animate-[fadeDown_0.2s_ease]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-widest">Notifications</h3>
                <span className="text-[10px] text-[var(--color-accent)] font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="flex flex-col items-center justify-center py-6 text-[var(--color-text-faint)]">
                <span className="text-2xl mb-1">📭</span>
                <p className="text-xs">No notifications yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className={`flex items-center gap-2 pl-1 pr-1 md:pr-3 py-1 rounded-full transition-all duration-200 ${showProfile ? 'bg-[var(--color-surface-alt)] ring-2 ring-[var(--color-accent)]/10' : 'hover:bg-[var(--color-bg)]'}`}
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-[14px] font-extrabold shadow-md overflow-hidden" 
                 style={{ background: meta.gradient }}>
              {user?.profilePhotoUrl 
                ? <img src={user.profilePhotoUrl} alt={user.name} className="w-full h-full object-cover" />
                : user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-[13px] font-bold text-[var(--color-text)]">{user?.name}</span>
              <span className="text-[10px] font-medium text-[var(--color-text-faint)] uppercase tracking-wide">{user?.role}</span>
            </div>
            <span className={`text-[10px] text-[var(--color-text-faint)] transition-transform duration-200 hidden md:block ${showProfile ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden z-50 animate-[fadeDown_0.2s_ease]">
              <div className="p-4 bg-[var(--color-bg)] md:hidden">
                <div className="font-bold text-sm text-[var(--color-text)]">{user?.name}</div>
                <div className="text-[10px] text-[var(--color-text-faint)] uppercase">{user?.role}</div>
              </div>
              <div className="p-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-accent)] rounded-lg transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  <span className="text-base">👤</span> My Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-accent)] rounded-lg transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  <span className="text-base">⚙️</span> Settings
                </Link>
                <div className="h-px bg-[var(--color-border)] my-1 mx-2" />
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-dim)] rounded-lg transition-colors font-medium"
                >
                  <span className="text-base">🚪</span> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
