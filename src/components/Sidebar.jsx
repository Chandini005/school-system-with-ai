import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ meta, collapsed, setCollapsed, navLinks, pendingCount }) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [hovered, setHovered] = useState(null);

  // Determine visibility based on screen size using Tailwind classes in parent
  return (
    <aside
      className={`bg-[var(--color-surface)] border-r border-[var(--color-border)] h-screen transition-all duration-300 ease-in-out flex flex-col shadow-soft ${collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width-expanded)]'}`}
    >
      {/* Logo Section */}
      <div className={`flex items-center p-4 border-b border-[var(--color-border)] min-h-[var(--navbar-height)] ${collapsed ? 'justify-center' : 'justify-start gap-3'}`}>
        <div 
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110" 
          style={{ 
            background: meta.gradient,
            boxShadow: `0 4px 12px ${meta.color}30`
          }}
        >
          {meta.icon}
        </div>
        {!collapsed && (
          <div className="animate-[fadeRight_0.3s_ease]">
            <div className="font-extrabold text-[13px] text-[var(--color-text)] tracking-wider">ABHYAAS</div>
            <div className="text-[9px] uppercase font-bold tracking-widest" style={{ color: meta.color }}>
              {meta.label}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
        {navLinks.map((link, idx) => {
          const isDropdown = !!link.children;
          const isActiveParent = link.path && location.pathname === link.path;
          const isChildActive = isDropdown && link.children.some(c => location.pathname === c.path);
          const isActive = isDropdown ? (isActiveParent || isChildActive) : location.pathname === link.path;
          const dropdownOpen = openMenu === idx || isChildActive;

          const baseLinkClasses = `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 relative ${
            collapsed ? 'justify-center' : 'justify-start'
          } ${isActive 
            ? 'bg-[var(--color-surface-alt)] text-[var(--color-accent)] font-semibold' 
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
          }`;

          if (isDropdown) {
            return (
              <div key={link.name}>
                <div
                  className={baseLinkClasses}
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    setOpenMenu(dropdownOpen ? null : idx);
                  }}
                  title={collapsed ? link.name : ''}
                >
                  <span className={`text-lg transition-colors ${isActive ? '' : 'group-hover:text-[var(--color-text)]'}`} style={{ color: isActive ? meta.color : 'inherit' }}>
                    {link.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-[13px]">{link.name}</span>
                      <span className={`text-[10px] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </>
                  )}
                  {isActive && !collapsed && <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--color-accent)] rounded-r-full" />}
                </div>
                
                {/* Responsive Dropdown Children */}
                {dropdownOpen && !collapsed && (
                  <div className="ml-6 flex flex-col gap-1 mt-1 border-l border-[var(--color-border)] pl-3 animate-[fadeDown_0.2s_ease]">
                    {link.children.map(child => {
                      const isChildCurrent = location.pathname === child.path;
                      return (
                        <Link
                          key={child.name}
                          to={child.path}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-[12px] transition-all ${
                            isChildCurrent 
                              ? 'text-[var(--color-accent)] font-bold bg-[var(--color-surface-alt)]' 
                              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                          }`}
                        >
                          <span style={{ color: isChildCurrent ? meta.color : 'inherit' }}>{child.icon}</span>
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Standard link
          return (
            <Link
              key={link.name}
              to={link.path}
              className={baseLinkClasses}
              title={collapsed ? link.name : ''}
            >
              <span className={`text-lg transition-colors ${isActive ? '' : 'group-hover:text-[var(--color-text)]'}`} style={{ color: isActive ? meta.color : 'inherit' }}>
                {link.icon}
              </span>
              {!collapsed && (
                <span className="flex-1 text-[13px]">{link.name}</span>
              )}
              {/* Badge for notifications */}
              {!collapsed && link.badge && pendingCount > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-[var(--color-danger)] text-white rounded-full px-1">
                  {pendingCount}
                </span>
              )}
              {collapsed && link.badge && pendingCount > 0 && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full border-2 border-white" />
              )}
              {isActive && !collapsed && <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--color-accent)] rounded-r-full" />}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 w-full p-2 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all ${collapsed ? 'justify-center' : 'justify-start'}`}
        >
          <span className={`text-xl transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}>
            ➜
          </span>
          {!collapsed && <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
