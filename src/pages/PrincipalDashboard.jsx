// frontend/src/pages/PrincipalDashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for routing
import * as API from '../api/principal';

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: '#0a0f1a',
  surface: '#111827',
  surfaceAlt: '#1a2235',
  border: '#1e2d45',
  accent: '#6c8ebf',
  accentBright: '#7aa2d4',
  accentDim: 'rgba(108,142,191,.14)',
  success: '#4ade80',
  successDim: 'rgba(74,222,128,.12)',
  warning: '#fbbf24',
  warningDim: 'rgba(251,191,36,.12)',
  danger: '#f87171',
  dangerDim: 'rgba(248,113,113,.12)',
  purple: '#c084fc',
  purpleDim: 'rgba(192,132,252,.12)',
  teal: '#2dd4bf',
  tealDim: 'rgba(45,212,191,.12)',
  gold: '#f59e0b',
  goldDim: 'rgba(245,158,11,.12)',
  text: '#e2e8f0',
  muted: '#64748b',
  faint: '#2d3a4f',
  // Principal accent = a refined indigo-blue
  P: '#818cf8',
  PDim: 'rgba(129,140,248,.15)',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @keyframes rise    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background:${C.bg}; color:${C.text}; font-family:'Plus Jakarta Sans',sans-serif; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
  input, select, textarea {
    background:${C.bg}!important; color:${C.text}!important;
    border:1px solid ${C.border}!important; border-radius:8px!important;
    padding:9px 12px!important; font-family:'Plus Jakarta Sans',sans-serif!important;
    font-size:13px!important; outline:none!important; width:100%;
    box-sizing:border-box; transition:border-color .15s,box-shadow .15s;
  }
  input:focus, select:focus, textarea:focus {
    border-color:${C.P}!important;
    box-shadow:0 0 0 3px ${C.PDim}!important;
  }
  input::placeholder, textarea::placeholder { color:${C.faint}!important; }
  button { font-family:'Plus Jakarta Sans',sans-serif; }
`;

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════
function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setL] = useState(true);
  const [error, setE] = useState('');

  const load = useCallback(async () => {
    setL(true); setE('');
    try { setData(await fn()); }
    catch (e) { setE(e.message); }
    finally { setL(false); }
    // eslint-disable-next-line
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

function useToast() {
  const [toast, setT] = useState(null);
  const show = (msg, ok = true) => { setT({ msg, ok }); setTimeout(() => setT(null), 3000); };
  const Toast = () => toast ? (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      padding: '11px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13,
      background: toast.ok ? C.successDim : C.dangerDim,
      border: `1px solid ${toast.ok ? C.success : C.danger}`,
      color: toast.ok ? C.success : C.danger,
      animation: 'fadeIn .25s ease',
      boxShadow: `0 8px 24px ${toast.ok ? C.success : C.danger}22`,
    }}>
      {toast.ok ? '✓ ' : '✗ '}{toast.msg}
    </div>
  ) : null;
  return { show, Toast };
}

// ═══════════════════════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════════════════════
function PageWrap({ children }) {
  return <div style={{ animation: 'rise .35s ease' }}>{children}</div>;
}

function Card({ children, style = {}, onClick, glow }) {
  const [h, sH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => onClick && sH(true)}
      onMouseLeave={() => sH(false)}
      style={{
        background: C.surface, border: `1px solid ${h ? C.P + '44' : C.border}`,
        borderRadius: 14, padding: 20,
        boxShadow: glow ? `0 0 24px ${C.P}12` : h ? `0 8px 32px rgba(0,0,0,.3)` : 'none',
        transition: 'all .2s', cursor: onClick ? 'pointer' : 'default',
        transform: h ? 'translateY(-1px)' : 'none',
        ...style
      }}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle, icon, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {icon && (
          <div style={{ width: 42, height: 42, borderRadius: 12, background: C.PDim, border: `1px solid ${C.P}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {icon}
          </div>
        )}
        <div>
          <h2 style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 22, color: C.text, letterSpacing: '-.02em' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Btn({ children, onClick, color = C.P, dim = C.PDim, disabled, small, style = {} }) {
  const [h, sH] = useState(false);
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
      style={{
        padding: small ? '5px 12px' : '8px 18px', background: h ? color + '28' : dim,
        border: `1px solid ${color}55`, borderRadius: 8, color,
        fontWeight: 700, fontSize: small ? 11 : 13, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? .5 : 1, transition: 'all .15s', whiteSpace: 'nowrap', ...style,
      }}>
      {children}
    </button>
  );
}
function SuccessBtn(p) { return <Btn {...p} color={C.success} dim={C.successDim} />; }
function DangerBtn(p) { return <Btn {...p} color={C.danger} dim={C.dangerDim} />; }
function WarnBtn(p) { return <Btn {...p} color={C.warning} dim={C.warningDim} />; }

function Badge({ label, color, small }) {
  return <span style={{ padding: small ? '1px 7px' : '2px 9px', borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 700, background: color + '1e', color, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>{label}</span>;
}

function Stat({ label, value, sub, color = C.P, icon }) {
  return (
    <Card glow>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: 'Fraunces,serif', letterSpacing: '-.03em', marginTop: 6 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color }}>{icon}</div>
      </div>
    </Card>
  );
}

function Modal({ open, onClose, title, children, width = 540 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '92vh', overflowY: 'auto', padding: 26, animation: 'rise .22s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 700, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FG({ label, children, half }) {
  return (
    <div style={{ marginBottom: 13, ...(half && { flex: 1, minWidth: 140 }) }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
function Row({ children }) { return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>; }

function Table({ cols, rows, keyFn, empty = 'No records' }) {
  if (!rows?.length) return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted }}>
      <div style={{ fontSize: 36, opacity: .15, marginBottom: 10 }}>◎</div>
      <div style={{ fontSize: 13 }}>{empty}</div>
    </div>
  );
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.surfaceAlt }}>
            {cols.map(c => (
              <th key={c.label} style={{ padding: '10px 14px', textAlign: c.center ? 'center' : 'left', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={keyFn ? keyFn(row) : i}
              style={{ borderBottom: `1px solid ${C.border}`, transition: 'background .15s', animation: `rise .3s ease ${i * .025}s both` }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cols.map(c => (
                <td key={c.label} style={{ padding: '12px 14px', fontSize: 12, color: C.text, textAlign: c.center ? 'center' : 'left', verticalAlign: 'middle' }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, color: C.muted, fontSize: 13 }}>
      <span style={{ width: 16, height: 16, border: `2px solid ${C.P}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
      Loading…
    </div>
  );
}

function LoadState({ loading, error, children }) {
  if (loading) return <Skeleton />;
  if (error) return <div style={{ textAlign: 'center', padding: 48, color: C.danger, fontSize: 13 }}>⚠ {error}</div>;
  return children;
}

// Bar chart component (pure CSS)
function BarChart({ data, colorKey = 'color', valueKey = 'value', labelKey = 'label', height = 140 }) {
  const max = Math.max(...(data || []).map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, paddingBottom: 20, paddingTop: 12 }}>
      {(data || []).map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: d[colorKey] || C.P }}>{d[valueKey]}</div>
          <div style={{ width: '100%', background: C.border, borderRadius: 4, overflow: 'hidden', flex: 1, maxHeight: height - 40, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: `${(d[valueKey] / max) * 100}%`, background: d[colorKey] || C.P, borderRadius: 4, transition: 'height 1s ease', opacity: .9, minHeight: 3 }} />
          </div>
          <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60 }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

// Horizontal bar
function HBar({ label, value, max, color = C.P, right }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 80, fontSize: 11, color: C.muted, flexShrink: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ flex: 1, height: 7, borderRadius: 4, background: C.border, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
      <div style={{ width: 36, fontSize: 11, fontWeight: 700, color, textAlign: 'right' }}>{right ?? value}</div>
    </div>
  );
}

// Donut
function Donut({ pct, color, size = 72, label }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'Fraunces,serif' }}>{pct}%</div>
      {label && <div style={{ fontSize: 10, color: C.muted }}>{label}</div>}
    </div>
  );
}

// Avatar
function Avatar({ name, photo, size = 32, color = C.P }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: color + '18', border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {photo
        ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: Math.floor(size * 0.38), fontWeight: 700, color }}>{name?.charAt(0)?.toUpperCase()}</span>
      }
    </div>
  );
}

// House badge
const HOUSE_C = { 'Red House': '#f87171', 'Blue House': '#60a5fa', 'Green House': '#4ade80', 'Yellow House': '#fbbf24' };
const HOUSE_E = { 'Red House': '🔴', 'Blue House': '🔵', 'Green House': '🟢', 'Yellow House': '🟡' };
function HouseBadge({ house }) {
  if (!house) return null;
  const c = HOUSE_C[house] || C.muted;
  return <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: c + '18', color: c, border: `1px solid ${c}33` }}>{HOUSE_E[house]} {house}</span>;
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
const NAV = [
  { id: 'dashboard', icon: '◈', label: 'Dashboard' },
  { id: 'students', icon: '◎', label: 'View Students' },
  { id: 'teachers', icon: '◍', label: 'View Teachers' },
  { id: 'attendance', icon: '◷', label: 'Attendance Reports' },
  { id: 'performance', icon: '◫', label: 'Academic Performance' },
  { id: 'exams', icon: '◈', label: 'Exam Results' },
  { id: 'fees', icon: '◆', label: 'Fee Reports' },
  { id: 'timetable', icon: '▦', label: 'Timetable View' },
  { id: 'announcements', icon: '◎', label: 'Announcements' },
  { id: 'talent', icon: '★', label: 'Talent Tests' },
  { id: 'reports', icon: '◫', label: 'Reports & Analytics' },
  { id: 'leave', icon: '◷', label: 'Leave Management' },
];

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const [hov, setHov] = useState(null);
  return (
    <aside style={{ width: collapsed ? 64 : 248, minHeight: '100vh', background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', transition: 'width .28s cubic-bezier(.4,0,.2,1)', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 10 }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '18px 0' : '18px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${C.P},#8b5cf6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 16px ${C.P}44`, fontSize: 16 }}>🎓</div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 15, color: C.text, letterSpacing: '-.01em' }}>ABHYAAS</div>
            <div style={{ fontSize: 10, color: C.P, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Principal Portal</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <div key={item.id} onClick={() => setActive(item.id)}
              onMouseEnter={() => setHov(item.id)}
              onMouseLeave={() => setHov(null)}
              title={collapsed ? item.label : ''}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '9px 14px', margin: '1px 8px', borderRadius: 9, cursor: 'pointer', background: isActive ? C.PDim : hov === item.id ? C.surfaceAlt : 'transparent', borderLeft: `2px solid ${isActive ? C.P : 'transparent'}`, transition: 'all .14s', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <span style={{ fontSize: 15, color: isActive ? C.P : C.muted, flexShrink: 0, width: 18, textAlign: 'center' }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: 13, color: isActive ? C.P : C.muted, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Collapse */}
      <div onClick={() => setCollapsed(!collapsed)}
        style={{ padding: 16, borderTop: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', color: C.muted, fontSize: 16, transition: 'color .2s' }}
        onMouseEnter={e => e.currentTarget.style.color = C.text}
        onMouseLeave={e => e.currentTarget.style.color = C.muted}>
        {collapsed ? '→' : '←'}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOPBAR
// ═══════════════════════════════════════════════════════════════
function Topbar({ activeModule, onToggle, user, onLogout }) {
  const [showN, setShowN] = useState(false);
  const [showP, setShowP] = useState(false);
  const pageName = NAV.find(n => n.id === activeModule)?.label || 'Dashboard';
  // Pull latest announcements as notifications
  const { data: anns } = useFetch(() => API.getAnnouncements().catch(() => []), []);
  const notifs = (Array.isArray(anns) ? anns : []).slice(0, 5);

  return (
    <header style={{ height: 58, background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, position: 'sticky', top: 0, zIndex: 19, flexShrink: 0 }}>
      <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 19, padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}>☰</button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 11, color: C.muted }}>Principal</span>
        <span style={{ color: C.faint, fontSize: 11 }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{pageName}</span>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', width: 200 }}>
        <span style={{ color: C.muted, fontSize: 13 }}>⌕</span>
        <input placeholder="Search…" style={{ background: 'none!important', border: 'none!important', outline: 'none', color: C.text, fontSize: 13, width: '100%', padding: '0!important' }} />
      </div>

      {/* Bell */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setShowN(n => !n); setShowP(false); }}
          style={{ background: showN ? C.surfaceAlt : 'none', border: `1px solid ${showN ? C.border : 'transparent'}`, borderRadius: 8, cursor: 'pointer', color: C.muted, fontSize: 17, padding: '5px 9px', position: 'relative' }}>
          🔔
          {notifs.length > 0 && <span style={{ position: 'absolute', top: 4, right: 5, width: 8, height: 8, borderRadius: '50%', background: C.P, border: `2px solid ${C.surface}` }} />}
        </button>
        {showN && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 300, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: '.08em' }}>LATEST ANNOUNCEMENTS</div>
            {notifs.length === 0
              ? <div style={{ color: C.muted, fontSize: 12, padding: '12px 0', textAlign: 'center' }}>No announcements</div>
              : notifs.map((a, i) => (
                <div key={a._id || i} style={{ padding: '8px 0', borderBottom: i < notifs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.priority} · {a.postedBy?.name}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setShowP(p => !p); setShowN(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, background: showP ? C.surfaceAlt : 'none', border: `1px solid ${showP ? C.border : 'transparent'}`, borderRadius: 9, padding: '5px 10px', cursor: 'pointer' }}>
          <Avatar name={user?.name || 'P'} photo={user?.profilePhotoUrl} size={30} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{user?.name || 'Principal'}</div>
            <div style={{ fontSize: 10, color: C.P }}>Principal</div>
          </div>
        </button>
        {showP && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 172, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
            {['My Profile', 'Settings', 'Logout'].map((item, i) => (
              <div key={i} onClick={item === 'Logout' ? onLogout : undefined}
                style={{ padding: '10px 16px', fontSize: 13, color: item === 'Logout' ? C.danger : C.text, cursor: 'pointer', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = item === 'Logout' ? C.dangerDim : C.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 1 — DASHBOARD
// ═══════════════════════════════════════════════════════════════
function DashboardPage({ userName }) {
  const { data, loading, error } = useFetch(API.getDashboardStats);

  // Mock sparkline data while loading
  const attData = [
    { day: 'Mon', pct: 92 }, { day: 'Tue', pct: 88 }, { day: 'Wed', pct: 95 },
    { day: 'Thu', pct: 79 }, { day: 'Fri', pct: 91 }, { day: 'Sat', pct: 85 },
  ];
  const upcoming = [
    { name: 'Math Final Exam', date: 'Mar 2', class: 'Class 10', c: '#f87171' },
    { name: 'Science Lab Test', date: 'Mar 4', class: 'Class 9', c: C.warning },
    { name: 'Annual Sports Day', date: 'Mar 8', class: 'All', c: C.success },
    { name: 'Parent–Teacher Meet', date: 'Mar 12', class: 'Class 6–10', c: C.P },
  ];
  const topStudents = [
    { name: 'Aarav Shah', cls: '10A', score: 98, rank: 1 },
    { name: 'Priya Sharma', cls: '9B', score: 96, rank: 2 },
    { name: 'Rohan Mehta', cls: '10A', score: 94, rank: 3 },
    { name: 'Sneha Patel', cls: '8C', score: 93, rank: 4 },
  ];
  const rankColors = [C.gold, '#9ca3af', '#cd7f32'];

  const stats = [
    { label: 'Total Students', value: data?.totalStudents ?? '—', sub: 'enrolled', color: C.P, icon: '◎' },
    { label: 'Total Teachers', value: data?.totalTeachers ?? '—', sub: 'active', color: C.teal, icon: '◍' },
    { label: 'Total Classes', value: data?.totalClasses ?? '—', sub: 'sections', color: C.purple, icon: '⬡' },
    { label: 'Today Attendance', value: (data?.todayAttendancePct != null ? data.todayAttendancePct + '%' : '—'), sub: 'present', color: C.success, icon: '◷' },
    { label: 'Pending Leaves', value: data?.pendingLeaves ?? '—', sub: 'to review', color: C.warning, icon: '◷' },
    { label: 'Upcoming Exams', value: data?.upcomingExams ?? '—', sub: 'scheduled', color: C.danger, icon: '◈' },
    { label: 'Fee Collected', value: data?.feeCollected ? `₹${(data.feeCollected / 100000).toFixed(1)}L` : '—', sub: 'this term', color: C.gold, icon: '◆' },
  ];

  return (
    <PageWrap>
      <style>{CSS}</style>
      {/* Welcome */}
      <div style={{ background: `linear-gradient(135deg, ${C.P}12, transparent 70%)`, border: `1px solid ${C.P}22`, borderRadius: 16, padding: '22px 26px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 22, fontWeight: 700, color: C.text }}>Good Morning, {userName} 👋</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}<span style={{ color: C.P }}>Principal Dashboard</span>
          </div>
        </div>
        <div style={{ fontSize: 52, opacity: .25, fontFamily: 'serif' }}>🎓</div>
      </div>

      {/* Stats Grid */}
      {loading ? <Skeleton /> : error ? <div style={{ color: C.danger, textAlign: 'center', padding: 48 }}>⚠ {error}</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(165px,1fr))', gap: 12, marginBottom: 22 }}>
          {stats.map((s, i) => <Stat key={i} {...s} />)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Attendance Spark */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text }}>Weekly Attendance</div>
              <div style={{ fontSize: 11, color: C.muted }}>Past 6 days</div>
            </div>
            <Donut pct={91} color={C.P} size={68} label="avg" />
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 56, marginTop: 14 }}>
            {attData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', height: `${(d.pct / 100) * 40}px`, background: C.P, borderRadius: '3px 3px 0 0', opacity: .75 }} />
                <span style={{ fontSize: 9, color: C.muted }}>{d.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Upcoming Events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {upcoming.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: C.bg, border: `1px solid ${C.border}` }}>
                <div style={{ width: 3, height: 32, borderRadius: 2, background: e.c, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{e.class}</div>
                </div>
                <div style={{ fontSize: 10, color: e.c, fontWeight: 700, background: e.c + '18', padding: '2px 8px', borderRadius: 6 }}>{e.date}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Students */}
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>🏆 Top Performers</div>
          {topStudents.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: rankColors[i] || C.surfaceAlt, border: `1px solid ${rankColors[i] || C.border}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: rankColors[i] || C.muted, flexShrink: 0 }}>{s.rank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{s.cls}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 54, height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.score}%`, background: C.P, transition: 'width .9s ease' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.P }}>{s.score}%</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Quick Actions */}
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>⚡ Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Post Announcement', icon: '📢', color: C.P },
              { label: 'Review Leaves', icon: '📋', color: C.warning },
              { label: 'View Reports', icon: '📊', color: C.teal },
              { label: 'Exam Results', icon: '📝', color: C.danger },
              { label: 'Fee Report', icon: '💰', color: C.gold },
              { label: 'Talent Tests', icon: '⭐', color: C.purple },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: C.bg, border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${a.color}55`; e.currentTarget.style.background = a.color + '0e'; }}
                onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; e.currentTarget.style.background = C.bg; }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{a.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 2 — STUDENTS
// ═══════════════════════════════════════════════════════════════
function StudentsPage() {
  const [search, setSearch] = useState('');
  const [std, setStd] = useState('');
  const [q, setQ] = useState('');
  const { data, loading, error } = useFetch(() => API.getStudents({ search: q, standard: std }), [q, std]);
  const students = data?.students || [];

  useEffect(() => { const t = setTimeout(() => setQ(search), 350); return () => clearTimeout(t); }, [search]);

  const STANDARDS = ['', 'KG1', 'KG2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  return (
    <PageWrap>
      <PageHeader title="Students" subtitle={`${data?.total || 0} enrolled students`} icon="◎" />
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" style={{ flex: 1, minWidth: 180 }} />
        <select value={std} onChange={e => setStd(e.target.value)} style={{ width: 150 }}>
          {STANDARDS.map(s => <option key={s} value={s}>{s ? `Class ${s}` : 'All Classes'}</option>)}
        </select>
      </div>
      <Card>
        <LoadState loading={loading} error={error}>
          <Table keyFn={r => r._id} rows={students} cols={[
            {
              label: 'Student', render: r => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={r.name} photo={r.profilePhotoUrl} size={32} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{r.email}</div>
                  </div>
                </div>
              )
            },
            { label: 'Roll No', key: 'rollNo' },
            { label: 'Class', render: r => `${r.standard}${r.section || ''}` },
            { label: 'House', render: r => <HouseBadge house={r.house} /> },
            { label: 'Parent', render: r => <div><div>{r.parentName}</div><div style={{ fontSize: 10, color: C.muted }}>{r.parentPhone}</div></div> },
            { label: 'Fee', render: r => <Badge label={r.feeStatus || 'Pending'} color={r.feeStatus === 'Paid' ? C.success : r.feeStatus === 'Partial' ? C.warning : C.danger} /> },
          ]} />
        </LoadState>
      </Card>
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 3 — TEACHERS
// ═══════════════════════════════════════════════════════════════
function TeachersPage() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [q, setQ] = useState('');
  const { data, loading, error } = useFetch(() => API.getTeachers({ search: q, department: dept }), [q, dept]);
  const teachers = data?.teachers || [];
  useEffect(() => { const t = setTimeout(() => setQ(search), 350); return () => clearTimeout(t); }, [search]);

  const DEPTS = ['', 'Science', 'Mathematics', 'Humanities', 'Languages', 'Computer Science'];
  const DESIG_C = { HOD: C.P, PGT: C.teal, TGT: C.success, PRT: C.warning };

  return (
    <PageWrap>
      <PageHeader title="Teachers & Staff" subtitle={`${data?.total || 0} active staff members`} icon="◍" />
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" style={{ flex: 1, minWidth: 180 }} />
        <select value={dept} onChange={e => setDept(e.target.value)} style={{ width: 180 }}>
          {DEPTS.map(d => <option key={d} value={d}>{d || 'All Departments'}</option>)}
        </select>
      </div>
      <Card>
        <LoadState loading={loading} error={error}>
          <Table keyFn={r => r._id} rows={teachers} cols={[
            {
              label: 'Teacher', render: r => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={r.name} photo={r.profilePhotoUrl} size={32} color={C.teal} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{r.email}</div>
                  </div>
                </div>
              )
            },
            { label: 'ID', key: 'teacherId' },
            { label: 'Designation', render: r => <Badge label={r.designation || '—'} color={DESIG_C[r.designation] || C.muted} /> },
            { label: 'Department', key: 'department' },
            {
              label: 'Subjects', render: r => (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(r.subjects || []).slice(0, 2).map(s => <span key={s} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: C.surfaceAlt, color: C.muted, border: `1px solid ${C.border}` }}>{s}</span>)}
                  {r.subjects?.length > 2 && <span style={{ fontSize: 10, color: C.muted }}>+{r.subjects.length - 2}</span>}
                </div>
              )
            },
            { label: 'Exp (yrs)', render: r => <span style={{ color: C.P, fontWeight: 700 }}>{r.experience || 0}</span> },
            { label: 'Phone', key: 'phone' },
          ]} />
        </LoadState>
      </Card>
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 4 — ATTENDANCE REPORTS
// ═══════════════════════════════════════════════════════════════
function AttendancePage() {
  const { data: summary, loading: lS } = useFetch(API.getAttendanceSummary);
  const { data: classWise, loading: lC } = useFetch(API.getClassWiseAttendance);

  const summaryData = (summary || []).map(m => ({
    label: m.month.slice(5),
    value: m.pct,
    color: m.pct >= 90 ? C.success : m.pct >= 75 ? C.warning : C.danger,
  }));

  const maxCW = Math.max(...(classWise || []).map(c => c.studentCount || 0), 1);

  return (
    <PageWrap>
      <PageHeader title="Attendance Reports" subtitle="Class-wise and monthly attendance analysis" icon="◷" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📈 Monthly Attendance %</div>
          {lS ? <Skeleton /> : <BarChart data={summaryData.length ? summaryData : [{ label: '—', value: 0, color: C.P }]} height={150} />}
        </Card>
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📊 Attendance Summary</div>
          {lS ? <Skeleton /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(summary || []).slice(-3).map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.month}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.pct >= 90 ? C.success : m.pct >= 75 ? C.warning : C.danger }}>{m.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${m.pct}%`, background: m.pct >= 90 ? C.success : m.pct >= 75 ? C.warning : C.danger, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
              {!summary?.length && <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: 20 }}>No data yet — mark attendance to see reports</div>}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>🏫 Class-wise Attendance (last 30 days)</div>
        {lC ? <Skeleton /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(classWise || []).map((c, i) => (
              <HBar key={i} label={c.className} value={c.pct} max={100}
                color={c.pct >= 90 ? C.success : c.pct >= 75 ? C.warning : C.danger} right={`${c.pct}%`} />
            ))}
            {!classWise?.length && <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: 24 }}>No attendance records found</div>}
          </div>
        )}
      </Card>
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 5 — ACADEMIC PERFORMANCE
// ═══════════════════════════════════════════════════════════════
function PerformancePage() {
  const { data, loading, error } = useFetch(API.getPerformanceOverview);
  const { data: subjData, loading: lSubj } = useFetch(API.getSubjectPerformance);

  const GRADE_C = { 'A+': C.teal, 'A': C.success, 'B+': C.P, 'B': C.purple, 'C': C.warning, 'F': C.danger };

  const gradeChartData = (data?.gradeDist || []).map(g => ({
    label: g._id, value: g.count, color: GRADE_C[g._id] || C.muted,
  }));
  const totalGrades = gradeChartData.reduce((s, g) => s + g.value, 0);

  return (
    <PageWrap>
      <PageHeader title="Academic Performance" subtitle="School-wide result analysis and top performers" icon="◫" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Grade Distribution */}
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>🎓 Grade Distribution</div>
          {loading ? <Skeleton /> : gradeChartData.length ? (
            <>
              <BarChart data={gradeChartData} height={140} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {gradeChartData.map(g => (
                  <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color }} />
                    <span style={{ color: C.muted }}>{g.label}: {totalGrades ? Math.round(g.value / totalGrades * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: 30 }}>No result data yet</div>}
        </Card>

        {/* Subject Performance */}
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📚 Subject-wise Average</div>
          {lSubj ? <Skeleton /> : (subjData || []).length ? (
            (subjData || []).map((s, i) => (
              <HBar key={i} label={s.subject || s._id} value={s.avg || s.avgScore || 0} max={100}
                color={s.avg >= 80 ? C.success : s.avg >= 60 ? C.P : C.warning} right={`${s.avg}%`} />
            ))
          ) : <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: 30 }}>No data</div>}
        </Card>
      </div>

      {/* Top Students */}
      <Card>
        <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>🏆 Top 10 Students</div>
        {loading ? <Skeleton /> : (
          <Table keyFn={(_, i) => i} rows={data?.topStudents || []} cols={[
            { label: 'Rank', render: (_, idx) => <span style={{ fontWeight: 800, color: idx === 0 ? C.gold : idx === 1 ? '#9ca3af' : idx === 2 ? '#cd7f32' : C.muted }}>#{idx + 1}</span> },
            {
              label: 'Student', render: r => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Avatar name={r.name} photo={r.profilePhotoUrl} size={30} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>Class {r.standard}{r.section}</div>
                  </div>
                </div>
              )
            },
            { label: 'House', render: r => <HouseBadge house={r.house} /> },
            {
              label: 'Avg Score', render: r => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.avgScore || 0}%`, background: C.P }} />
                  </div>
                  <span style={{ fontWeight: 700, color: C.P }}>{r.avgScore}%</span>
                </div>
              )
            },
            { label: 'Exams', render: r => <span style={{ color: C.muted }}>{r.examsCount}</span> },
          ]} />
        )}
      </Card>
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 6 — EXAM RESULTS
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// MODULE 6 — EXAM RESULTS
// ═══════════════════════════════════════════════════════════════
function ExamsPage() {
  const { data: exams, loading } = useFetch(API.getExams);
  const [selExam, setSelExam] = useState(null);
  const { data: examDetail, loading: lD } = useFetch(() => selExam ? API.getExamResults(selExam._id) : Promise.resolve(null), [selExam]);

  const upcoming = (exams || []).filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = (exams || []).filter(e => new Date(e.date) < new Date()).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <PageWrap>
      <PageHeader title="Exam Results" subtitle="View all scheduled and completed exams" icon="◈" />
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Exam list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? <Skeleton /> : <>
            {upcoming.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.warning, letterSpacing: '.07em', textTransform: 'uppercase', padding: '4px 0' }}>📅 Upcoming</div>
                {upcoming.map(e => (
                  <div key={e._id} onClick={() => setSelExam(e)}
                    style={{ background: selExam?._id === e._id ? C.PDim : C.surface, border: `1px solid ${selExam?._id === e._id ? C.P + '44' : C.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all .15s' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = C.surfaceAlt}
                    onMouseLeave={ev => ev.currentTarget.style.background = selExam?._id === e._id ? C.PDim : C.surface}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Class {e.standard} · {e.subject}</div>
                    <div style={{ fontSize: 10, color: C.warning, marginTop: 3 }}>📅 {e.date ? new Date(e.date).toLocaleDateString('en-IN') : 'TBD'}</div>
                  </div>
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: '.07em', textTransform: 'uppercase', padding: '4px 0', marginTop: 8 }}>✓ Completed</div>
                {past.map(e => (
                  <div key={e._id} onClick={() => setSelExam(e)}
                    style={{ background: selExam?._id === e._id ? C.PDim : C.surface, border: `1px solid ${selExam?._id === e._id ? C.P + '44' : C.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all .15s' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = C.surfaceAlt}
                    onMouseLeave={ev => ev.currentTarget.style.background = selExam?._id === e._id ? C.PDim : C.surface}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Class {e.standard} · {e.subject}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{e.date ? new Date(e.date).toLocaleDateString('en-IN') : '—'} · {e.totalMarks} marks</div>
                  </div>
                ))}
              </>
            )}
          </>} {/* 👈 THIS WAS THE BUG. I accidentally wrote <//>} earlier! */}
        </div>

        {/* Results panel */}
        <Card>
          {!selExam ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
              <div style={{ fontSize: 36, opacity: .15, marginBottom: 12 }}>◈</div>
              <div style={{ fontSize: 13 }}>Select an exam to view results</div>
            </div>
          ) : lD ? <Skeleton /> : examDetail ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: 'Fraunces,serif', fontSize: 17, fontWeight: 700, color: C.text }}>{examDetail.exam?.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Class {examDetail.exam?.standard} · {examDetail.exam?.subject} · {examDetail.exam?.totalMarks} marks</div>
              </div>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total', value: examDetail.stats?.total || 0, c: C.P },
                  { label: 'Pass', value: examDetail.stats?.pass || 0, c: C.success },
                  { label: 'Highest', value: examDetail.stats?.highest || 0, c: C.gold },
                  { label: 'Average', value: examDetail.stats?.avg || 0, c: C.teal },
                ].map(s => (
                  <div key={s.label} style={{ background: C.bg, borderRadius: 10, padding: '10px 12px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.c, fontFamily: 'Fraunces,serif', marginTop: 4 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <Table keyFn={r => r._id} rows={examDetail.results || []} cols={[
                { label: '#', render: (_, i) => <span style={{ color: C.muted }}>{i + 1}</span> },
                {
                  label: 'Student', render: r => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={r.student?.name} photo={r.student?.profilePhotoUrl} size={28} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.student?.name}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>Class {r.student?.standard}{r.student?.section}</div>
                      </div>
                    </div>
                  )
                },
                { label: 'Marks', render: r => <span style={{ fontWeight: 700 }}>{r.marksObtained}/{r.totalMarks}</span> },
                {
                  label: '%', render: r => {
                    const p = Math.round(r.marksObtained / r.totalMarks * 100);
                    return <span style={{ color: p >= 90 ? C.teal : p >= 75 ? C.success : p >= 60 ? C.P : p >= 50 ? C.warning : C.danger, fontWeight: 700 }}>{p}%</span>;
                  }
                },
                {
                  label: 'Grade', render: r => {
                    const GRADE_C = { 'A+': C.teal, 'A': C.success, 'B+': C.P, 'B': C.purple, 'C': C.warning, 'F': C.danger };
                    return <Badge label={r.grade || '—'} color={GRADE_C[r.grade] || C.muted} />;
                  }
                },
              ]} />
            </>
          ) : <div style={{ color: C.muted, textAlign: 'center', padding: 40 }}>No results found for this exam</div>}
        </Card>
      </div>
    </PageWrap>
  );
}
// ═══════════════════════════════════════════════════════════════
// MODULE 7 — FEE REPORTS
// ═══════════════════════════════════════════════════════════════
function FeesPage() {
  const { data, loading, error } = useFetch(() => API.getFeeReport());
  const summary = data?.summary || [];
  const trend = data?.monthlyTrend || [];
  const fees = data?.fees || [];

  const byStatus = summary.reduce((a, s) => ({ ...a, [s._id]: s }), {});
  const maxTrend = Math.max(...trend.map(t => t.collected || 0), 1);
  const collected = byStatus['Paid']?.total || 0;
  const pending = (byStatus['Pending']?.count || 0) + (byStatus['Overdue']?.count || 0);

  const STATUS_C = { Paid: C.success, Pending: C.warning, Overdue: C.danger, Partial: C.teal };

  return (
    <PageWrap>
      <PageHeader title="Fee Reports" subtitle="Fee collection and payment status overview" icon="◆" />
      {loading ? <Skeleton /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
            <Stat label="Total Collected" value={`₹${(collected / 100000).toFixed(1)}L`} color={C.success} icon="◆" />
            <Stat label="Pending Count" value={pending} sub="payments" color={C.warning} icon="⏳" />
            <Stat label="Overdue" value={byStatus['Overdue']?.count || 0} color={C.danger} icon="⚠" />
            <Stat label="Paid Rate" value={summary.length ? `${Math.round((byStatus['Paid']?.count || 0) / summary.reduce((s, x) => s + x.count, 0) * 100)}%` : '—'} color={C.teal} icon="✓" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>💰 Monthly Collection</div>
              {trend.length ? (
                <BarChart
                  data={trend.map(t => ({ label: t._id.slice(5), value: Math.round(t.collected / 1000), color: C.success }))}
                  height={150}
                />
              ) : <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: 40 }}>No paid fees recorded yet</div>}
            </Card>
            <Card>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📊 Fee Status</div>
              {summary.map((s, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Badge label={s._id} color={STATUS_C[s._id] || C.muted} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.count}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(s.count / summary.reduce((a, x) => a + x.count, 0) * 100)}%`, background: STATUS_C[s._id] || C.muted, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <Card>
            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📋 Fee Records</div>
            <Table keyFn={r => r._id} rows={fees} cols={[
              { label: 'Student', render: r => <div><div style={{ fontWeight: 600 }}>{r.student?.name}</div><div style={{ fontSize: 10, color: C.muted }}>Class {r.student?.standard}{r.student?.section}</div></div> },
              { label: 'Fee Type', key: 'feeType' },
              { label: 'Amount', render: r => <span style={{ fontWeight: 700 }}>₹{r.amount?.toLocaleString()}</span> },
              { label: 'Due', render: r => r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '—' },
              { label: 'Status', render: r => <Badge label={r.status} color={STATUS_C[r.status] || C.muted} /> },
              { label: 'Method', key: 'method' },
            ]} />
          </Card>
        </>
      )}
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 8 — TIMETABLE
// ═══════════════════════════════════════════════════════════════
function TimetablePage() {
  const { data: classes } = useFetch(API.getClasses);
  const [selClass, setSelClass] = useState('');
  const { data: tt, loading } = useFetch(() => selClass ? API.getTimetable(selClass) : Promise.resolve(null), [selClass]);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timetable = tt?.timetable || [];
  const periods = 7;

  return (
    <PageWrap>
      <PageHeader title="Timetable View" subtitle="School timetable — read-only principal view" icon="▦" />
      <div style={{ marginBottom: 16 }}>
        <select value={selClass} onChange={e => setSelClass(e.target.value)} style={{ width: 220 }}>
          <option value="">Select a class…</option>
          {(classes || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      {!selClass ? (
        <Card><div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Select a class above to view its timetable</div></Card>
      ) : loading ? <Skeleton /> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: C.surfaceAlt }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.07em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, width: 100 }}>Day</th>
                  {Array.from({ length: periods }, (_, i) => (
                    <th key={i} style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.07em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>
                      P{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => {
                  const dayTT = timetable.find(t => t.day === day);
                  return (
                    <tr key={day} style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: C.P, whiteSpace: 'nowrap' }}>{day.slice(0, 3)}</td>
                      {Array.from({ length: periods }, (_, pi) => {
                        const period = dayTT?.periods?.find(p => p.periodNo === pi + 1);
                        return (
                          <td key={pi} style={{ padding: '8px 6px', textAlign: 'center' }}>
                            {period ? (
                              <div style={{ background: C.PDim, borderRadius: 7, padding: '6px 8px', border: `1px solid ${C.P}22` }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>{period.subject}</div>
                                <div style={{ fontSize: 9, color: C.muted }}>{period.startTime}–{period.endTime}</div>
                                {period.teacher && <div style={{ fontSize: 9, color: C.P }}>{period.teacher?.name?.split(' ')[0]}</div>}
                              </div>
                            ) : (
                              <div style={{ fontSize: 10, color: C.faint }}>—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 9 — ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════
function AnnouncementsPage() {
  const { data: apiAnns, loading, reload } = useFetch(API.getAnnouncements);
  const [localAnns, setLocalAnns] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'Normal', audience: ['All'] });
  const [saving, setSaving] = useState(false);
  const { show, Toast } = useToast();

  const allAnns = [...localAnns, ...(apiAnns || [])];

  const save = async () => {
    if (!form.title || !form.content) return show('Title and content required', false);
    setSaving(true);
    try {
      const r = await API.postAnnouncement(form);
      setLocalAnns(l => [r, ...l]);
      show('Announcement posted!'); setModal(false);
      setForm({ title: '', content: '', priority: 'Normal', audience: ['All'] });
    } catch (e) {
      // Add locally if API fails
      setLocalAnns(l => [{ ...form, _id: 'local_' + Date.now(), postedBy: { name: 'Principal' }, createdAt: new Date() }, ...l]);
      show('Announcement posted (local)!'); setModal(false);
    }
    setSaving(false);
  };

  const del = async id => {
    if (String(id).startsWith('local_')) { setLocalAnns(l => l.filter(a => a._id !== id)); return; }
    try { await API.deleteAnnouncement(id); reload(); show('Deleted!'); }
    catch (e) { show(e.message, false); }
  };

  const P_C = { Normal: C.muted, Important: C.warning, Urgent: C.danger };
  const AUD_C = ['All', 'Student', 'Teacher', 'Parent'].reduce((a, x, i) => ({ ...a, [x]: [C.P, C.success, C.teal, C.purple][i] }), {});

  return (
    <PageWrap>
      <Toast />
      <PageHeader title="Announcements" subtitle="Post and manage school-wide announcements" icon="◎"
        action={<Btn onClick={() => setModal(true)}>+ Post Announcement</Btn>} />
      <LoadState loading={loading} error={null}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allAnns.map(a => (
            <Card key={a._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Badge label={a.priority} color={P_C[a.priority] || C.muted} />
                    {(a.audience || []).map(aud => <Badge key={aud} label={aud} color={AUD_C[aud] || C.muted} small />)}
                  </div>
                  <div style={{ fontFamily: 'Fraunces,serif', fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{a.content}</div>
                  <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Posted by {a.postedBy?.name} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : '—'}</div>
                </div>
                <DangerBtn small onClick={() => del(a._id)}>Delete</DangerBtn>
              </div>
            </Card>
          ))}
          {!allAnns.length && <div style={{ textAlign: 'center', padding: 48, color: C.muted }}><div style={{ fontSize: 36, opacity: .15, marginBottom: 12 }}>◎</div><div>No announcements yet</div></div>}
        </div>
      </LoadState>

      <Modal open={modal} onClose={() => setModal(false)} title="Post Announcement">
        <FG label="Title"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" /></FG>
        <FG label="Content"><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Announcement content…" /></FG>
        <Row>
          <FG label="Priority" half>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {['Normal', 'Important', 'Urgent'].map(p => <option key={p}>{p}</option>)}
            </select>
          </FG>
          <FG label="Audience" half>
            <select value={form.audience[0]} onChange={e => setForm(f => ({ ...f, audience: [e.target.value] }))}>
              {['All', 'Student', 'Teacher', 'Parent', 'Admin'].map(a => <option key={a}>{a}</option>)}
            </select>
          </FG>
        </Row>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Btn onClick={save} disabled={saving}>{saving ? 'Posting…' : 'Post Announcement'}</Btn>
          <Btn onClick={() => setModal(false)} color={C.muted} dim={C.surfaceAlt}>Cancel</Btn>
        </div>
      </Modal>
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 10 — TALENT TESTS
// ═══════════════════════════════════════════════════════════════
function TalentTestsPage() {
  const { data: apiTests, loading, reload } = useFetch(API.getTalentTests);
  const [localTests, setLocalTests] = useState([]);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ title: '', standard: '10', subject: '', duration: 60, date: '' });
  const [qs, setQs] = useState([{ question: '', options: ['', '', '', ''], answer: 0, marks: 1 }]);
  const [saving, setSaving] = useState(false);
  const { show, Toast } = useToast();

  const allTests = [...localTests, ...(apiTests || [])];
  const STANDARDS = ['KG1', 'KG2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

  const addQ = () => setQs(q => [...q, { question: '', options: ['', '', '', ''], answer: 0, marks: 1 }]);
  const removeQ = i => setQs(q => q.filter((_, j) => j !== i));
  const updQ = (i, k, v) => setQs(q => q.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const updOpt = (qi, oi, v) => setQs(q => q.map((x, j) => j === qi ? { ...x, options: x.options.map((o, k) => k === oi ? v : o) } : x));

  const save = async () => {
    if (!form.title || !form.subject) return show('Title and subject required', false);
    if (qs.some(q => !q.question)) return show('All questions need text', false);
    setSaving(true);
    try {
      const r = await API.createTalentTest({ ...form, questions: qs });
      setLocalTests(l => [r, ...l]);
      show('Talent test created!'); setModal(false);
    } catch {
      setLocalTests(l => [{ ...form, questions: qs, _id: 'local_' + Date.now(), createdBy: { name: 'Principal' } }, ...l]);
      show('Created (local preview)!'); setModal(false);
    }
    setSaving(false);
    setForm({ title: '', standard: '10', subject: '', duration: 60, date: '' });
    setQs([{ question: '', options: ['', '', '', ''], answer: 0, marks: 1 }]);
  };

  return (
    <PageWrap>
      <Toast />
      <PageHeader title="Talent Tests" subtitle="Create and view MCQ talent tests" icon="★"
        action={<Btn onClick={() => setModal(true)}>+ Create Test</Btn>} />
      <LoadState loading={loading} error={null}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {allTests.map(t => (
            <Card key={t._id} style={{ cursor: 'pointer' }} onClick={() => setDetail(t)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Badge label={`Class ${t.standard}`} color={C.P} />
                <Badge label={`${t.questions?.length || 0} Qs`} color={C.purple} />
              </div>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 5 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{t.subject} · {t.duration} min</div>
              {t.date && <div style={{ fontSize: 11, color: C.warning, marginTop: 6 }}>📅 {new Date(t.date).toLocaleDateString('en-IN')}</div>}
              <div style={{ marginTop: 12 }}>
                <Btn small onClick={e => { e.stopPropagation(); setDetail(t); }}>View Questions</Btn>
              </div>
            </Card>
          ))}
          {!allTests.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: C.muted }}>No talent tests yet</div>}
        </div>
      </LoadState>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Create Talent Test" width={600}>
        <FG label="Test Title"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Math Olympiad 2025" /></FG>
        <Row>
          <FG label="Class" half>
            <select value={form.standard} onChange={e => setForm(f => ({ ...f, standard: e.target.value }))}>
              {STANDARDS.map(s => <option key={s}>{s}</option>)}
            </select>
          </FG>
          <FG label="Subject" half>
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
              <option value="">Select…</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </FG>
        </Row>
        <Row>
          <FG label="Duration (min)" half><input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} /></FG>
          <FG label="Date" half><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></FG>
        </Row>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Questions</div>
            <Btn small onClick={addQ}>+ Add Question</Btn>
          </div>
          {qs.map((q, qi) => (
            <div key={qi} style={{ background: C.bg, borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.P }}>Q{qi + 1}</span>
                {qs.length > 1 && <DangerBtn small onClick={() => removeQ(qi)}>✕</DangerBtn>}
              </div>
              <FG label="Question Text">
                <input value={q.question} onChange={e => updQ(qi, 'question', e.target.value)} placeholder="Enter question…" />
              </FG>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: q.answer === oi ? C.PDim : C.surfaceAlt, border: `2px solid ${q.answer === oi ? C.P : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 11, color: q.answer === oi ? C.P : C.muted, fontWeight: 700 }}
                    onClick={() => updQ(qi, 'answer', oi)}>
                    {String.fromCharCode(65 + oi)}
                  </div>
                  <input value={opt} onChange={e => updOpt(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} style={{ flex: 1 }} />
                </div>
              ))}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Click the letter to mark correct answer</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Btn onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create Test'}</Btn>
          <Btn onClick={() => setModal(false)} color={C.muted} dim={C.surfaceAlt}>Cancel</Btn>
        </div>
      </Modal>

      {/* View Questions Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title} width={580}>
        {detail && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Badge label={`Class ${detail.standard}`} color={C.P} />
              <Badge label={detail.subject} color={C.teal} />
              <Badge label={`${detail.duration} min`} color={C.muted} />
            </div>
            {(detail.questions || []).map((q, qi) => (
              <div key={qi} style={{ background: C.bg, borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Q{qi + 1}. {q.question}</div>
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', borderRadius: 8, background: q.answer === oi ? C.successDim : C.surfaceAlt, border: `1px solid ${q.answer === oi ? C.success + '44' : C.border}` }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: q.answer === oi ? C.success : C.border, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: q.answer === oi ? C.bg : C.muted, flexShrink: 0 }}>{String.fromCharCode(65 + oi)}</span>
                    <span style={{ fontSize: 12, color: q.answer === oi ? C.success : C.text, fontWeight: q.answer === oi ? 700 : 400 }}>{opt}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </Modal>
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 11 — REPORTS & ANALYTICS
// ═══════════════════════════════════════════════════════════════
function ReportsPage() {
  const { data, loading } = useFetch(API.getReportsOverview);

  // Fallback mock data so charts always render
  const MOCK_CS = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '10A'].map((n, i) => ({ name: `Class ${n}`, count: 34 + i * 2 }));
  const MOCK_GD = [{ _id: 'A+', count: 42 }, { _id: 'A', count: 65 }, { _id: 'B+', count: 48 }, { _id: 'B', count: 32 }, { _id: 'C', count: 18 }, { _id: 'F', count: 7 }];
  const MOCK_FT = [{ _id: 'Aug', collected: 320000 }, { _id: 'Sep', collected: 410000 }, { _id: 'Oct', collected: 380000 }, { _id: 'Nov', collected: 445000 }, { _id: 'Dec', collected: 390000 }, { _id: 'Jan', collected: 470000 }];
  const MOCK_ATT = [{ month: 'Aug', pct: 88 }, { month: 'Sep', pct: 91 }, { month: 'Oct', pct: 85 }, { month: 'Nov', pct: 93 }, { month: 'Dec', pct: 79 }, { month: 'Jan', pct: 90 }];

  const cs = data?.classStrength?.length ? data.classStrength : MOCK_CS;
  const gd = data?.gradeDist?.length ? data.gradeDist : MOCK_GD;
  const ft = data?.feeTrend?.length ? data.feeTrend : MOCK_FT;
  const att = data?.attendanceTrend?.length ? data.attendanceTrend : MOCK_ATT;

  const GRADE_C = { 'A+': C.teal, 'A': C.success, 'B+': C.P, 'B': C.purple, 'C': C.warning, 'F': C.danger };
  const maxCS = Math.max(...cs.map(c => c.count || 0), 1);
  const totalG = gd.reduce((s, g) => s + g.count, 0);

  const [tab, setTab] = useState('overview');

  return (
    <PageWrap>
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive school performance dashboard" icon="◫" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['overview', 'attendance', 'fees', 'grades'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: tab === t ? C.PDim : C.surface, border: `1px solid ${tab === t ? C.P : C.border}`, color: tab === t ? C.P : C.muted, textTransform: 'capitalize', transition: 'all .15s' }}>
            {t}
          </button>
        ))}
      </div>

      {loading && <Skeleton />}

      {!loading && tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📚 Class Strength</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cs.slice(0, 10).map((c, i) => (
                <HBar key={i} label={c.name || c.className || '—'} value={c.count || 0} max={maxCS} right={c.count || 0} />
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>🎓 Grade Distribution</div>
            <BarChart data={gd.map(g => ({ label: g._id, value: g.count, color: GRADE_C[g._id] || C.muted }))} height={140} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {gd.map(g => (
                <div key={g._id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: GRADE_C[g._id] || C.muted }} />
                  <span style={{ color: C.muted }}>{g._id}: {totalG ? Math.round(g.count / totalG * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {!loading && tab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card>
            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📊 Monthly Attendance %</div>
            <BarChart data={att.map(a => ({ label: a.month || a._id, value: a.pct, color: a.pct >= 90 ? C.success : a.pct >= 75 ? C.P : C.warning }))} height={160} />
          </Card>
          <Card>
            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>📈 Key Metrics</div>
            {[
              { label: 'Avg Attendance', val: `${Math.round(att.reduce((s, a) => s + (a.pct || 0), 0) / att.length)}%`, c: C.P },
              { label: 'Best Month', val: att.sort((a, b) => b.pct - a.pct)[0]?.month || '—', c: C.success },
              { label: 'Lowest Month', val: att.sort((a, b) => a.pct - b.pct)[0]?.month || '—', c: C.danger },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.c, fontFamily: 'Fraunces,serif', marginTop: 4 }}>{s.val}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {!loading && tab === 'fees' && (
        <Card>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>💰 Monthly Fee Collection (₹K)</div>
          <BarChart data={ft.map(f => ({ label: f._id.slice(5) || f._id, value: Math.round((f.collected || 0) / 1000), color: C.success }))} height={180} />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Stat label="Total Collected" value={`₹${(ft.reduce((s, f) => s + (f.collected || 0), 0) / 100000).toFixed(1)}L`} color={C.success} icon="◆" />
          </div>
        </Card>
      )}

      {!loading && tab === 'grades' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
            {gd.map(g => (
              <Card key={g._id} style={{ textAlign: 'center', border: `1px solid ${GRADE_C[g._id] || C.muted}33` }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: GRADE_C[g._id] || C.muted, fontFamily: 'Fraunces,serif' }}>{g._id}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 4 }}>{g.count}</div>
                <div style={{ fontSize: 11, color: C.muted }}>students</div>
                <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: 'hidden', marginTop: 10 }}>
                  <div style={{ height: '100%', width: `${totalG ? Math.round(g.count / totalG * 100) : 0}%`, background: GRADE_C[g._id] || C.muted, transition: 'width 1s ease' }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: GRADE_C[g._id] || C.muted, marginTop: 4 }}>{totalG ? Math.round(g.count / totalG * 100) : 0}%</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE 12 — LEAVE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
function LeavePage() {
  const [statusFilt, setStatus] = useState('Pending');
  const { data: leaves, loading, reload } = useFetch(() => API.getLeaves({ status: statusFilt }), [statusFilt]);
  const [processing, setP] = useState({});
  const { show, Toast } = useToast();

  const review = async (id, status) => {
    setP(p => ({ ...p, [id]: status }));
    try {
      await API.reviewLeave(id, status);
      show(`Leave ${status}!`); reload();
    } catch (e) {
      show(e.message, false);
    }
    setP(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const S_C = { Pending: C.warning, Approved: C.success, Rejected: C.danger };
  const LEAVE_TYPE_C = { Sick: C.danger, Casual: C.P, Earned: C.success, Emergency: C.warning, Maternity: C.purple };

  return (
    <PageWrap>
      <Toast />
      <PageHeader title="Leave Management" subtitle="Review and approve staff leave requests" icon="◷" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: statusFilt === s ? C.PDim : C.surface, border: `1px solid ${statusFilt === s ? C.P : C.border}`, color: statusFilt === s ? C.P : C.muted, transition: 'all .15s' }}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <LoadState loading={loading} error={null}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(leaves || []).map(l => (
            <Card key={l._id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                  <Avatar name={l.applicant?.name} photo={l.applicant?.profilePhotoUrl} size={40} color={C.purple} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{l.applicant?.name}</div>
                      <Badge label={l.role || 'Teacher'} color={C.teal} small />
                      <Badge label={l.type} color={LEAVE_TYPE_C[l.type] || C.muted} small />
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {l.from ? new Date(l.from).toLocaleDateString('en-IN') : '—'} → {l.to ? new Date(l.to).toLocaleDateString('en-IN') : '—'}
                      {' · '}<strong style={{ color: C.text }}>{l.days} day{l.days !== 1 ? 's' : ''}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: C.text, marginTop: 6, fontStyle: 'italic', lineHeight: 1.6 }}>"{l.reason}"</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <Badge label={l.status} color={S_C[l.status] || C.muted} />
                  {l.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <SuccessBtn small disabled={!!processing[l._id]} onClick={() => review(l._id, 'Approved')}>
                        {processing[l._id] === 'Approved' ? '…' : '✓ Approve'}
                      </SuccessBtn>
                      <DangerBtn small disabled={!!processing[l._id]} onClick={() => review(l._id, 'Rejected')}>
                        {processing[l._id] === 'Rejected' ? '…' : '✕ Reject'}
                      </DangerBtn>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {!(leaves || []).length && <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>No {statusFilt.toLowerCase()} leave requests</div>}
        </div>
      </LoadState>
    </PageWrap>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP (UPDATED TO USE REDUX / LOCALSTORAGE)
// ═══════════════════════════════════════════════════════════════
export default function PrincipalDashboard() {
  const navigate = useNavigate();

  // 1. Read user directly from the same place MasterLandingPage saved it
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user'); // Changed from 'abhyaas_user' to match your login code
    return stored ? JSON.parse(stored) : null;
  });

  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // 2. Redirect to login if they aren't authenticated
  useEffect(() => {
    const token = localStorage.getItem('token'); // Changed from 'abhyaas_token'
    if (!user || !token) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Prevent rendering if redirecting
  if (!user) return <div style={{ background: C.bg, height: '100vh' }}></div>;

  const MODULES = {
    dashboard: <DashboardPage userName={user.name} />, // Passing name here!
    students: <StudentsPage />,
    teachers: <TeachersPage />,
    attendance: <AttendancePage />,
    performance: <PerformancePage />,
    exams: <ExamsPage />,
    fees: <FeesPage />,
    timetable: <TimetablePage />,
    announcements: <AnnouncementsPage />,
    talent: <TalentTestsPage />,
    reports: <ReportsPage />,
    leave: <LeavePage />,
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
        <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Topbar activeModule={active} onToggle={() => setCollapsed(c => !c)} user={user} onLogout={handleLogout} />
          <main style={{ flex: 1, padding: 24, overflowY: 'auto', background: C.bg }}>
            {MODULES[active] || <DashboardPage userName={user.name} />}
          </main>
        </div>
      </div>
    </>
  );
}