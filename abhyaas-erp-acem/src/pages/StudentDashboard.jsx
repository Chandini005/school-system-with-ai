import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StudentMarksView } from "./modules";
import AILearningHub from "./StudentAILearningHub";
import { useTheme } from "../context/ThemeContext";

// ─── SAFE API FETCHERS ───
import { API_URL } from '../config/apiConfig';
const API_BASE = API_URL;
const STUDENT_BASE = `${API_BASE}/student`;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// API Calls
const fetchStudentProfile = async () => (await fetch(`${STUDENT_BASE}/profile`, { headers: getHeaders() })).json();
const fetchStudentStats = async () => (await fetch(`${STUDENT_BASE}/dashboard/stats`, { headers: getHeaders() })).json();
const fetchStudentActivity = async () => (await fetch(`${STUDENT_BASE}/dashboard/activity`, { headers: getHeaders() })).json();
const fetchStudentFees = async () => (await fetch(`${STUDENT_BASE}/my-fees`, { headers: getHeaders() })).json();
const fetchUpcomingExams = async (standard) => (await fetch(`${API_BASE}/exams?standard=${standard}`, { headers: getHeaders() })).json();
const fetchLatestAnnouncements = async () => (await fetch(`${API_BASE}/announcements`, { headers: getHeaders() })).json();

// ─── DESIGN SYSTEM (Reactive Theme) ───
const theme = {
  colors: {
    bg: "var(--color-bg)", 
    surface: "var(--color-surface)", 
    surfaceHover: "var(--color-surface-alt)", 
    border: "var(--color-border)",
    text: "var(--color-text)", 
    textMuted: "var(--color-text-muted)", 
    textFaint: "var(--color-text-faint)",
    studentColor: "#3b82f6", 
    success: "var(--color-success)", 
    warning: "var(--color-warning)", 
    danger: "var(--color-danger)",
    accent: "var(--color-accent)", 
    purple: "#8b5cf6"
  },
};

const STUDENT_CONFIG = {
  label: "Student Portal", icon: "👨‍🎓", color: theme.colors.studentColor,
  gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  nav: [
    { id: "dashboard", icon: "📊", label: "Dashboard overview" },
    { id: "profile", icon: "👤", label: "My Profile" },
    { id: "attendance", icon: "📅", label: "My Attendance" },
    { id: "marks", icon: "🏆", label: "My Exam Marks" },
    { id: "fees", icon: "💳", label: "Fee Status" },
    { id: "announcements", icon: "📢", label: "Announcements" },
    { id: "exams", icon: "📝", label: "Upcoming Exams" },
    { id: "library", icon: "📖", label: "Digital E-Library" },
    { id: "ai-hub", icon: "✨", label: "AI Learning Hub" },
    { id: "settings", icon: "⚙️", label: "Change Password" },
    { id: "security", icon: "🔐", label: "Security & Privacy" },
  ]
};

// ─── UI COMPONENTS ───
function DonutChart({ pct, color, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.colors.border} strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

function StatCard({ label, value, delta, color, icon, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.colors.surface, border: `1px solid ${hovered ? color + "60" : theme.colors.border}`,
        borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "none", boxShadow: hovered ? `0 8px 24px ${color}15` : "0 1px 3px rgba(0,0,0,0.05)",
        animation: `fadeInUp 0.4s ease ${index * 0.06}s both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: theme.colors.textMuted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.text, marginTop: 6, fontFamily: "'Inter', sans-serif" }}>{value}</div>
          <div style={{ fontSize: 12, color: color, marginTop: 4, fontWeight: 600 }}>{delta}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: color }}>{icon}</div>
      </div>
    </div>
  );
}

// ─── INDIVIDUAL MODULES ───

function FeeModule() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentFees().then(res => {
      if (res.success) setFees(res.data || []);
      setLoading(false);
    });
  }, []);

  const totalPending = fees
    .filter(f => f.status !== 'Paid')
    .reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 💳 OVERVIEW CARD */}
      <div style={{ background: STUDENT_CONFIG.gradient, borderRadius: 16, padding: "32px", color: "#fff", boxShadow: "0 10px 25px rgba(37, 99, 235, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Outstandings</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>₹{totalPending.toLocaleString()}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.2)", width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          💰
        </div>
      </div>

      <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>📜</span> Payment History & Ledger
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ color: theme.colors.textMuted }}>Loading ledger...</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: theme.colors.bg, borderRadius: 12, border: `1px dashed ${theme.colors.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🕊️</div>
                <div style={{ fontWeight: 700, color: theme.colors.text }}>No records found</div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>You don't have any current fee structures or history.</div>
              </div>
            ) : (
              fees.map((f, i) => {
                const amount = Number(f.amount) || 0;
                const paid = Number(f.paidAmount) || 0;
                const balance = amount - paid;
                const isPaid = f.status === 'Paid';
                const isOverdue = f.status === 'Overdue';

                return (
                  <div key={i} style={{
                    padding: "20px",
                    background: isPaid ? theme.colors.success + '05' : theme.colors.bg,
                    borderRadius: 12,
                    border: `1px solid ${isPaid ? theme.colors.success + '30' : theme.colors.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "transform 0.2s",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text }}>{f.feeType || 'General Fee'}</span>
                        <div style={{
                          padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                          background: isPaid ? theme.colors.success + '15' : isOverdue ? theme.colors.danger + '15' : theme.colors.warning + '15',
                          color: isPaid ? theme.colors.success : isOverdue ? theme.colors.danger : theme.colors.warning,
                          textTransform: "uppercase"
                        }}>{f.status}</div>
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, display: 'flex', gap: 16 }}>
                        <span>📅 Due: <b>{f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN') : 'N/A'}</b></span>
                        {f.paidDate && <span style={{ color: theme.colors.success }}>✅ Paid: <b>{new Date(f.paidDate).toLocaleDateString('en-IN')}</b></span>}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 140 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: theme.colors.text }}>₹{amount.toLocaleString()}</div>
                      {balance > 0 && paid > 0 && <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>Paid: ₹{paid.toLocaleString()}</div>}
                      {balance > 0 && (
                        <div style={{ fontSize: 13, color: theme.colors.danger, marginTop: 6, fontWeight: 700 }}>
                          Due: ₹{balance.toLocaleString()}
                        </div>
                      )}
                      {isPaid && (
                        <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 4, fontWeight: 600 }}>
                          Payment Method: {f.method || 'Cash'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementsModule() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/announcements`, { headers: getHeaders() })
      .then(res => res.json())
      .then(res => {
        if (res.success) setAnnouncements(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const priorityColors = { Normal: theme.colors.textMuted, Important: theme.colors.warning, Urgent: theme.colors.danger };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text, marginBottom: 16 }}>School Announcements</h2>
        {loading ? <p style={{ color: theme.colors.textMuted }}>Loading announcements...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {announcements.length === 0 ? <div style={{ color: theme.colors.textMuted, fontSize: 14 }}>No recent announcements.</div> :
              announcements.map((a, i) => {
                const pColor = priorityColors[a.priority] || theme.colors.accent;
                return (
                  <div key={i} style={{ padding: "20px", background: theme.colors.bg, borderRadius: 8, border: `1px solid ${theme.colors.border}`, borderLeft: `4px solid ${pColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: pColor + '15', color: pColor, display: 'inline-block', marginBottom: 8, border: `1px solid ${pColor}44` }}>
                          {a.priority === 'Urgent' ? '🔴' : a.priority === 'Important' ? '🟡' : '⚪'} {a.priority}
                        </span>
                        <div style={{ fontSize: 17, fontWeight: 800, color: theme.colors.text }}>{a.title}</div>
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textMuted, fontWeight: 600 }}>{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div style={{ fontSize: 14, color: theme.colors.textMuted, lineHeight: 1.6 }}>{a.content}</div>
                    <div style={{ fontSize: 12, color: theme.colors.textFaint, marginTop: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>✍️</span> Posted by Management
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
    </div>
  );
}

function ExaminationsModule({ profile }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const std = profile?.classId?.standard || profile?.standard;
    if (!std) return;

    fetchUpcomingExams(std).then(res => {
      if (res.success) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const upcoming = (res.data || []).filter(e => new Date(e.date) >= yesterday);
        setExams(upcoming);
      }
      setLoading(false);
    });
  }, [profile]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text, marginBottom: 16 }}>Upcoming Examinations</h2>
        {loading ? <p style={{ color: theme.colors.textMuted }}>Loading exam schedule...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {exams.length === 0 ? <div style={{ color: theme.colors.textMuted, fontSize: 14, padding: 20, textAlign: 'center', background: theme.colors.bg, borderRadius: 8 }}>No upcoming exams scheduled for Class {profile?.classId?.standard || profile?.standard}. Relax! 🎉</div> :
              exams.map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: theme.colors.bg, borderRadius: 8, border: `1px solid ${theme.colors.border}`, borderLeft: `4px solid ${theme.colors.accent}` }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text }}>{e.name}</div>
                    <div style={{ fontSize: 13, color: theme.colors.accent, marginTop: 4, fontWeight: 600 }}>{e.subject}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: theme.colors.text }}>📅 {new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>Duration: {e.duration} mins | Max Marks: {e.totalMarks}</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryModule() {
  const eLibraryResources = [
    { title: "Mathematics (NCERT Textbooks)", category: "Textbook", source: "NCERT Official", link: "https://ncert.nic.in/textbook.php", color: theme.colors.accent },
    { title: "Physics Concepts & Videos", category: "Reference", source: "Khan Academy", link: "https://www.khanacademy.org/science/physics", color: theme.colors.purple },
    { title: "English Grammar Rules", category: "Language", source: "GrammarBook", link: "https://www.grammarbook.com/", color: theme.colors.warning },
    { title: "World History Archive", category: "History", source: "History.com", link: "https://www.history.com/", color: theme.colors.danger },
    { title: "Computer Science Basics", category: "Technology", source: "Code.org", link: "https://code.org/", color: theme.colors.success },
    { title: "Chemistry Periodic Table", category: "Science", source: "Ptable", link: "https://ptable.com/", color: theme.colors.studentColor }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text, marginBottom: 6 }}>Digital E-Library</h2>
        <p style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 24 }}>Access free online educational resources, textbooks, and reference materials.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {eLibraryResources.map((book, i) => (
            <div key={i} style={{ padding: "20px", background: theme.colors.bg, borderRadius: 12, border: `1px solid ${theme.colors.border}`, borderTop: `4px solid ${book.color}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, padding: '4px 10px', background: book.color + '15', color: book.color, borderRadius: 6, fontWeight: 700, border: `1px solid ${book.color}33` }}>
                    {book.category}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: theme.colors.text, marginBottom: 6, lineHeight: 1.4 }}>{book.title}</div>
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 20 }}>Source: <span style={{ fontWeight: 600 }}>{book.source}</span></div>
              </div>
              <a href={book.link} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', padding: '10px', background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 8, color: theme.colors.text, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s', fontSize: 13 }}
                onMouseOver={e => { e.currentTarget.style.background = book.color; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = book.color; }}
                onMouseOut={e => { e.currentTarget.style.background = theme.colors.surface; e.currentTarget.style.color = theme.colors.text; e.currentTarget.style.borderColor = theme.colors.border; }}>
                Read Online ↗
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHANGE PASSWORD COMPONENT ───
function ChangePasswordModule() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: '', msg: '' }); // type: 'success'|'error'
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });
    if (form.newPassword !== form.confirmPassword)
      return setStatus({ type: 'error', msg: 'New passwords do not match.' });
    if (form.newPassword.length < 6)
      return setStatus({ type: 'error', msg: 'New password must be at least 6 characters.' });

    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    const loginId = user?.loginId || user?._id;

    if (!loginId) return setStatus({ type: 'error', msg: 'Session error. Please log in again.' });

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', msg: data.message });
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setStatus({ type: 'error', msg: data.message });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  const T = theme.colors;
  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.bg,
    color: T.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560 }}>
      {/* Header card */}
      <div style={{ background: STUDENT_CONFIG.gradient, borderRadius: 14, padding: '28px 28px', color: '#fff', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🔐</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Change Password</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Keep your account secure with a strong password.</div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {status.msg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600,
            background: status.type === 'success' ? T.success + '15' : T.danger + '12',
            border: `1px solid ${status.type === 'success' ? T.success + '40' : T.danger + '30'}`,
            color: status.type === 'success' ? T.success : T.danger,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {status.type === 'success' ? '✅' : '⚠️'} {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input name="currentPassword" type="password" required value={form.currentPassword}
              onChange={handleChange} placeholder="Enter current password" style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.studentColor}
              onBlur={e => e.target.style.borderColor = T.border} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input name="newPassword" type="password" required value={form.newPassword}
              onChange={handleChange} placeholder="Min. 6 characters" style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.studentColor}
              onBlur={e => e.target.style.borderColor = T.border} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input name="confirmPassword" type="password" required value={form.confirmPassword}
              onChange={handleChange} placeholder="Re-enter new password" style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.studentColor}
              onBlur={e => e.target.style.borderColor = T.border} />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 14,
            background: loading ? T.border : STUDENT_CONFIG.gradient,
            color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s', marginTop: 4,
          }}>
            {loading ? 'Changing Password...' : '🔒 Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD CONTENT ROUTER ───
function DashboardContent({ activeModule, userName, stats, activities, profile, announcements }) {

  if (activeModule === "profile") {
    if (!profile) return <div style={{ color: theme.colors.textMuted, padding: 40, textAlign: 'center' }}>Loading Profile...</div>;
    if (profile.error) return <div style={{ color: theme.colors.danger, padding: 40, textAlign: 'center' }}>Could not load profile. Please contact Admin.</div>;

    const InfoRow = ({ label, value }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 15, color: theme.colors.text, fontWeight: 600 }}>{value || '—'}</span>
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 800 }}>
        <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ height: 120, background: STUDENT_CONFIG.gradient, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: -40, left: 30, width: 90, height: 90, borderRadius: '50%', background: theme.colors.surface, border: `4px solid ${theme.colors.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {profile.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>👨‍🎓</span>}
            </div>
          </div>
          <div style={{ padding: '50px 30px 30px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.colors.text }}>{profile.name}</h2>
                <div style={{ fontSize: 14, color: theme.colors.textMuted, fontWeight: 600, marginTop: 4 }}>Roll No: <span style={{ color: theme.colors.studentColor }}>{profile.rollNo}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '6px 14px', borderRadius: 20, background: theme.colors.studentColor + '15', color: theme.colors.studentColor, fontSize: 13, fontWeight: 700 }}>Class {profile.classId?.name || profile.standard} {profile.section}</span>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${theme.colors.border}`, marginTop: 24, paddingTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              <div style={{ gridColumn: '1 / -1', fontSize: 15, fontWeight: 700, color: theme.colors.text, marginBottom: 8, borderBottom: `2px solid ${theme.colors.border}`, paddingBottom: 8 }}>Personal Details</div>
              <InfoRow label="Email Address" value={profile.email} />
              <InfoRow label="Phone Number" value={profile.phone} />
              <InfoRow label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : null} />
              <InfoRow label="Blood Group" value={profile.bloodGroup} />
              <div style={{ gridColumn: '1 / -1', fontSize: 15, fontWeight: 700, color: theme.colors.text, marginBottom: 8, marginTop: 16, borderBottom: `2px solid ${theme.colors.border}`, paddingBottom: 8 }}>Guardian Details</div>
              <InfoRow label="Parent/Guardian Name" value={profile.fatherName || profile.parentName} />
              <InfoRow label="Parent Contact" value={profile.parentPhone} />
              <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Residential Address" value={profile.address} /></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeModule === "attendance") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text, marginBottom: 16 }}>Attendance Dashboard</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            <div style={{ padding: 16, background: theme.colors.bg, borderRadius: 8, border: `1px solid ${theme.colors.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Total Days</div>
              <div style={{ fontSize: 28, color: theme.colors.text, fontWeight: 700, marginTop: 4 }}>{stats?.totalDays || 0}</div>
            </div>
            <div style={{ padding: 16, background: theme.colors.bg, borderRadius: 8, border: `1px solid ${theme.colors.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Present</div>
              <div style={{ fontSize: 28, color: theme.colors.success, fontWeight: 700, marginTop: 4 }}>{stats?.presentDays || 0}</div>
            </div>
            <div style={{ padding: 16, background: theme.colors.bg, borderRadius: 8, border: `1px solid ${theme.colors.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Absent</div>
              <div style={{ fontSize: 28, color: theme.colors.danger, fontWeight: 700, marginTop: 4 }}>{(stats?.totalDays || 0) - (stats?.presentDays || 0)}</div>
            </div>
            <div style={{ padding: 16, background: theme.colors.studentColor + '10', borderRadius: 8, border: `1px solid ${theme.colors.studentColor}30`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: theme.colors.studentColor, textTransform: "uppercase", fontWeight: 700 }}>Percentage</div>
              <div style={{ fontSize: 28, color: theme.colors.studentColor, fontWeight: 800, marginTop: 4 }}>{stats?.attendancePct || 0}%</div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text, marginBottom: 16, borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: 10 }}>Attendance History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(!stats?.attendanceHistory || stats.attendanceHistory.length === 0) ? (
              <div style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: "center", padding: 20 }}>No attendance records found.</div>
            ) : (
              stats.attendanceHistory.map((record, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: theme.colors.surface, borderRadius: 8, border: `1px solid ${theme.colors.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.text }}>
                    {new Date(record.date).toLocaleDateString("en-IN", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: record.status === 'Present' ? theme.colors.success + '15' : theme.colors.danger + '15',
                    color: record.status === 'Present' ? theme.colors.success : theme.colors.danger
                  }}>
                    {record.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeModule === "fees") return <FeeModule />;
  if (activeModule === "announcements") return <AnnouncementsModule />;
  if (activeModule === "exams") return <ExaminationsModule profile={profile} />;
  if (activeModule === "marks") return <StudentMarksView />;
  if (activeModule === "library") return <LibraryModule />;
  if (activeModule === "ai-hub") return <AILearningHub profile={profile} />;
  if (activeModule === "settings" || activeModule === "security") return <ChangePasswordModule />;

  const dynamicCards = [
    { label: "Attendance", value: `${stats?.attendancePct || 0}%`, delta: "Overall Year", color: "#3b82f6", icon: "📅" },
    { label: "Upcoming Exams", value: stats?.upcomingExams || "0", delta: "Scheduled Tests", color: "#f59e0b", icon: "📝" },
    { label: "Total Fee Due", value: stats?.feeDue > 0 ? `₹${stats.feeDue.toLocaleString()}` : "None", delta: stats?.feeDue > 0 ? "Overdue Balance" : "All Paid", color: stats?.feeDue > 0 ? "#ef4444" : "#10b981", icon: "💳" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: theme.colors.text }}>Welcome back, {userName}! 👋</div>
          <div style={{ fontSize: 14, color: theme.colors.textMuted, marginTop: 6, fontWeight: 500 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {dynamicCards.map((card, i) => <StatCard key={i} {...card} index={i} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text }}>My Attendance</div>
              <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>Current Academic Year</div>
            </div>
            <DonutChart pct={stats?.attendancePct || 0} color={STUDENT_CONFIG.color} size={70} />
          </div>
        </div>

        <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text }}>Latest Broadcasts</div>
            <div onClick={() => setActiveModule("announcements")} style={{ fontSize: 12, color: theme.colors.studentColor, cursor: 'pointer', fontWeight: 600 }}>View All →</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {announcements.filter(a => a.isBroadcast).length === 0 ? <div style={{ color: theme.colors.textMuted, fontSize: 13 }}>No recent broadcasts.</div> :
              announcements.filter(a => a.isBroadcast).slice(0, 5).map((a, i) => (
                <div key={i} style={{ padding: '12px', background: theme.colors.bg, borderRadius: 10, borderLeft: `4px solid ${a.priority === 'Urgent' ? theme.colors.danger : a.priority === 'Important' ? theme.colors.warning : theme.colors.accent}` }}>
                  <div style={{ fontSize: 14, color: theme.colors.text, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.content}</div>
                  <div style={{ fontSize: 10, color: theme.colors.textFaint, marginTop: 6, fontWeight: 600 }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
          </div>
        </div>

        <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.text, marginBottom: 16 }}>Recent Activities</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activities.length === 0 ? <div style={{ color: theme.colors.textMuted, fontSize: 13 }}>No recent updates.</div> :
              activities.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.colors.accent, marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500 }}>{a.text}</div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN WRAPPER COMPONENT ───
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { theme: currentTheme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState("");
  const [activeModule, setActiveModule] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'Student' && user.role !== 'Admin') {
      navigate("/");
      return;
    }
    setUserName(user.name);

    const loadData = async () => {
      try {
        const [statsRes, actRes, profRes, annRes] = await Promise.all([
          fetchStudentStats(),
          fetchStudentActivity(),
          fetchStudentProfile(),
          fetchLatestAnnouncements()
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (actRes.success) setActivities(actRes.data);
        if (annRes.success) setAnnouncements(annRes.data || []);

        if (profRes.success && profRes.data) {
          setProfile(profRes.data);
        } else {
          setProfile({ error: true });
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    };
    loadData();
  }, [navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${theme.colors.bg}; color: ${theme.colors.text}; font-family: 'Inter', sans-serif; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: theme.colors.bg, position: 'relative' }}>

        {/* SIDEBAR */}
        <aside style={{ 
          width: collapsed ? 70 : 260, 
          minHeight: "100vh", 
          background: theme.colors.surface, 
          borderRight: `1px solid ${theme.colors.border}`, 
          display: "flex", 
          flexDirection: "column", 
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
          overflow: "hidden", 
          position: isMobile ? "fixed" : "relative", 
          left: isMobile && !showMobileNav ? -260 : 0,
          zIndex: 100, 
          boxShadow: "4px 0 20px rgba(0,0,0,0.05)" 
        }}>
          {!isMobile && (
            <div style={{ padding: collapsed ? "20px 0" : "24px 20px", borderBottom: `1px solid ${theme.colors.border}`, display: "flex", alignItems: "center", gap: 12, justifyContent: collapsed ? "center" : "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: STUDENT_CONFIG.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", flexShrink: 0 }}>{STUDENT_CONFIG.icon}</div>
              {!collapsed && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: theme.colors.text, letterSpacing: "-0.02em" }}>ABHYAAS</div>
                  <div style={{ fontSize: 11, color: theme.colors.studentColor, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>{STUDENT_CONFIG.label}</div>
                </div>
              )}
            </div>
          )}

          {isMobile && (
            <div style={{ padding: '20px', borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, color: theme.colors.text }}>ABHYAAS</div>
              <button onClick={() => setShowMobileNav(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: theme.colors.danger }}>✕</button>
            </div>
          )}

          <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
            {STUDENT_CONFIG.nav.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <div key={item.id} onClick={() => { setActiveModule(item.id); setShowMobileNav(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "12px 0" : "12px 20px", margin: "4px 12px", borderRadius: 8, cursor: "pointer", background: isActive ? theme.colors.studentColor + '12' : "transparent", color: isActive ? theme.colors.studentColor : theme.colors.textMuted, transition: "all 0.2s ease", justifyContent: collapsed ? "center" : "flex-start" }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{item.icon}</span>
                  {!collapsed && <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap" }}>{item.label}</span>}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {showMobileNav && isMobile && (
          <div onClick={() => setShowMobileNav(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 90 }} />
        )}

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: theme.colors.bg }}>
          <header style={{ height: 68, background: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 16, position: "sticky", top: 0, zIndex: 9, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            
            {/* UNIVERSAL TOGGLE BUTTON */}
            <button 
              onClick={() => isMobile ? setShowMobileNav(true) : setCollapsed(!collapsed)} 
              style={{ 
                background: theme.colors.bg, 
                border: `1px solid ${theme.colors.border}`, 
                borderRadius: 8, 
                width: 40, height: 40,
                cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: theme.colors.studentColor,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = theme.colors.surfaceHover}
              onMouseOut={e => e.currentTarget.style.background = theme.colors.bg}
            >
              <span style={{ fontSize: 20 }}>{isMobile ? '☰' : collapsed ? '❯' : '❮'}</span>
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isMobile && <span style={{ fontWeight: 800, fontSize: 16, color: theme.colors.text, marginRight: 10 }}>ABHYAAS</span>}
                <span style={{ fontSize: 12, color: theme.colors.textMuted, fontWeight: 600, textTransform: "uppercase", display: isMobile ? 'none' : 'inline' }}>Student Portal</span>
                <span style={{ color: theme.colors.textFaint, fontSize: 12, display: isMobile ? 'none' : 'inline' }}>/</span>
                <span style={{ fontSize: 14, color: theme.colors.text, fontWeight: 700 }}>{STUDENT_CONFIG.nav.find((n) => n.id === activeModule)?.label || "Dashboard"}</span>
              </div>
            </div>

            {/* DARK MODE TOGGLE */}
            <button 
              onClick={toggleTheme}
              style={{ 
                background: theme.colors.bg, 
                border: `1px solid ${theme.colors.border}`, 
                borderRadius: 8, 
                padding: "8px 12px",
                cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: theme.colors.text,
                transition: 'all 0.2s',
                gap: 8,
                fontSize: 13,
                fontWeight: 600
              }}
              onMouseOver={e => e.currentTarget.style.background = theme.colors.surfaceHover}
              onMouseOut={e => e.currentTarget.style.background = theme.colors.bg}
            >
              <span>{currentTheme === 'dark' ? '☀️' : '🌙'}</span>
              <span style={{ display: isMobile ? 'none' : 'inline' }}>{currentTheme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }} style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 8, padding: "8px 16px", color: theme.colors.danger, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = theme.colors.danger + '10'} onMouseOut={e => e.currentTarget.style.background = theme.colors.surface}>
              Log out
            </button>
          </header>

          <main style={{ flex: 1, padding: "32px", overflowY: "auto", background: theme.colors.bg }}>
            <DashboardContent activeModule={activeModule} setActiveModule={setActiveModule} userName={userName} stats={stats} activities={activities} profile={profile} announcements={announcements} />
          </main>
        </div>
      </div>
    </>
  );
}