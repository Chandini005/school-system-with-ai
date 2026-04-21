import { useState, useEffect, useRef } from "react";

// ─── DESIGN SYSTEM ───────────────────────────────────────────────────────────
const theme = {
  colors: {
    bg: "#0d1117",
    surface: "#161b22",
    surfaceHover: "#1c2128",
    border: "#30363d",
    accent: "#58a6ff",
    accentGlow: "rgba(88,166,255,0.15)",
    success: "#3fb950",
    warning: "#d29922",
    danger: "#f85149",
    purple: "#bc8cff",
    teal: "#39d353",
    text: "#e6edf3",
    textMuted: "#8b949e",
    textFaint: "#484f58",
    adminColor: "#58a6ff",
    principalColor: "#bc8cff",
    teacherColor: "#3fb950",
    studentColor: "#ffa657",
    parentColor: "#39d353",
  },
};

// ─── ROLE CONFIGS ─────────────────────────────────────────────────────────────
const ROLE_CONFIGS = {
  admin: {
    label: "Admin",
    icon: "⚡",
    color: theme.colors.adminColor,
    gradient: "linear-gradient(135deg, #58a6ff 0%, #388bfd 100%)",
    nav: [
      { id: "dashboard", icon: "◈", label: "Dashboard" },
      { id: "users", icon: "◉", label: "User Management" },
      { id: "students", icon: "◎", label: "Students" },
      { id: "teachers", icon: "◍", label: "Teachers & Staff" },
      { id: "classes", icon: "⬡", label: "Classes & Subjects" },
      { id: "attendance", icon: "◷", label: "Attendance" },
      { id: "exams", icon: "◈", label: "Examinations" },
      { id: "timetable", icon: "⬢", label: "Timetable" },
      { id: "fees", icon: "◆", label: "Fee Management" },
      { id: "homework", icon: "◉", label: "Homework" },
      { id: "library", icon: "▣", label: "Library" },
      { id: "communication", icon: "◎", label: "Announcements" },
      { id: "transport", icon: "◈", label: "Transport" },
      { id: "reports", icon: "◫", label: "Reports & Analytics" },
      { id: "talent", icon: "★", label: "Talent Tests" },
      { id: "leave", icon: "◷", label: "Leave Management" },
      { id: "payroll", icon: "◆", label: "Payroll" },
      { id: "logs", icon: "◎", label: "Activity Logs" },
      { id: "settings", icon: "⊙", label: "Settings" },
    ],
    cards: [
      { label: "Total Students", value: "1,284", delta: "+12", color: "#58a6ff", icon: "◎" },
      { label: "Total Teachers", value: "87", delta: "+3", color: "#bc8cff", icon: "◍" },
      { label: "Total Classes", value: "42", delta: "0", color: "#3fb950", icon: "⬡" },
      { label: "Fee Collection", value: "₹4.2L", delta: "+8%", color: "#ffa657", icon: "◆" },
      { label: "Attendance %", value: "93.4%", delta: "+1.2%", color: "#39d353", icon: "◷" },
      { label: "Upcoming Exams", value: "6", delta: "this week", color: "#f85149", icon: "◈" },
      { label: "Pending Leaves", value: "14", delta: "-3", color: "#d29922", icon: "◷" },
    ],
  },
  principal: {
    label: "Principal",
    icon: "🎓",
    color: theme.colors.principalColor,
    gradient: "linear-gradient(135deg, #bc8cff 0%, #8957e5 100%)",
    nav: [
      { id: "dashboard", icon: "◈", label: "Dashboard" },
      { id: "students", icon: "◎", label: "View Students" },
      { id: "teachers", icon: "◍", label: "View Teachers" },
      { id: "attendance", icon: "◷", label: "Attendance Reports" },
      { id: "performance", icon: "◫", label: "Academic Performance" },
      { id: "exams", icon: "◈", label: "Exam Results" },
      { id: "fees", icon: "◆", label: "Fee Reports" },
      { id: "timetable", icon: "⬢", label: "Timetable View" },
      { id: "communication", icon: "◎", label: "Announcements" },
      { id: "talent", icon: "★", label: "Talent Tests" },
      { id: "reports", icon: "◫", label: "Reports & Analytics" },
    ],
    cards: [
      { label: "School Performance", value: "A+", delta: "Grade", color: "#bc8cff", icon: "★" },
      { label: "Overall Attendance", value: "91.2%", delta: "+0.8%", color: "#3fb950", icon: "◷" },
      { label: "Pass Rate", value: "96.4%", delta: "+2.1%", color: "#58a6ff", icon: "◈" },
      { label: "Fee Collected", value: "₹12.6L", delta: "84%", color: "#ffa657", icon: "◆" },
      { label: "Active Teachers", value: "83/87", delta: "95%", color: "#39d353", icon: "◍" },
    ],
  },
  teacher: {
    label: "Teacher",
    icon: "📚",
    color: theme.colors.teacherColor,
    gradient: "linear-gradient(135deg, #3fb950 0%, #238636 100%)",
    nav: [
      { id: "dashboard", icon: "◈", label: "Dashboard" },
      { id: "profile", icon: "◉", label: "My Profile" },
      { id: "classes", icon: "⬡", label: "My Classes" },
      { id: "attendance", icon: "◷", label: "Mark Attendance" },
      { id: "marks", icon: "◈", label: "Enter Marks" },
      { id: "homework", icon: "◉", label: "Upload Homework" },
      { id: "assignments", icon: "◫", label: "Evaluate Assignments" },
      { id: "timetable", icon: "⬢", label: "View Timetable" },
      { id: "leave", icon: "◷", label: "Leave Request" },
      { id: "performance", icon: "◎", label: "Student Performance" },
      { id: "communication", icon: "◎", label: "Parent Communication" },
    ],
    cards: [
      { label: "Today's Classes", value: "4", delta: "3 done", color: "#3fb950", icon: "⬡" },
      { label: "Pending Evals", value: "18", delta: "assignments", color: "#f85149", icon: "◫" },
      { label: "Attendance Done", value: "3/4", delta: "classes", color: "#58a6ff", icon: "◷" },
      { label: "Upcoming Exams", value: "2", delta: "this week", color: "#d29922", icon: "◈" },
      { label: "New Messages", value: "7", delta: "unread", color: "#bc8cff", icon: "◎" },
    ],
  },
  student: {
    label: "Student",
    icon: "🎒",
    color: theme.colors.studentColor,
    gradient: "linear-gradient(135deg, #ffa657 0%, #e0713b 100%)",
    nav: [
      { id: "dashboard", icon: "◈", label: "Dashboard" },
      { id: "profile", icon: "◉", label: "My Profile" },
      { id: "attendance", icon: "◷", label: "My Attendance" },
      { id: "results", icon: "◈", label: "Exam Results" },
      { id: "timetable", icon: "⬢", label: "Timetable" },
      { id: "homework", icon: "◉", label: "Homework & Submit" },
      { id: "fees", icon: "◆", label: "Fee Status" },
      { id: "library", icon: "▣", label: "Library" },
      { id: "notices", icon: "◎", label: "Notices" },
      { id: "talent", icon: "★", label: "Talent Tests" },
    ],
    cards: [
      { label: "Attendance %", value: "87.5%", delta: "-1.5%", color: "#ffa657", icon: "◷" },
      { label: "Latest Result", value: "A", delta: "Math exam", color: "#3fb950", icon: "◈" },
      { label: "Upcoming Exams", value: "3", delta: "this week", color: "#f85149", icon: "◎" },
      { label: "Pending HW", value: "2", delta: "due today", color: "#d29922", icon: "◉" },
      { label: "Fee Due", value: "₹4,500", delta: "overdue", color: "#f85149", icon: "◆" },
    ],
  },
  parent: {
    label: "Parent",
    icon: "👨‍👩‍👧",
    color: theme.colors.parentColor,
    gradient: "linear-gradient(135deg, #39d353 0%, #26a641 100%)",
    nav: [
      { id: "dashboard", icon: "◈", label: "Dashboard" },
      { id: "profile", icon: "◉", label: "Child Profile" },
      { id: "attendance", icon: "◷", label: "Attendance" },
      { id: "results", icon: "◈", label: "Exam Results" },
      { id: "timetable", icon: "⬢", label: "Timetable" },
      { id: "homework", icon: "◉", label: "Homework" },
      { id: "fees", icon: "◆", label: "Fee Status" },
      { id: "library", icon: "▣", label: "Library" },
      { id: "notices", icon: "◎", label: "Notices" },
      { id: "talent", icon: "★", label: "Talent Tests" },
    ],
    cards: [
      { label: "Attendance %", value: "87.5%", delta: "child", color: "#39d353", icon: "◷" },
      { label: "Latest Result", value: "A", delta: "Math exam", color: "#3fb950", icon: "◈" },
      { label: "Upcoming Exams", value: "3", delta: "this week", color: "#f85149", icon: "◎" },
      { label: "Pending HW", value: "2", delta: "due today", color: "#d29922", icon: "◉" },
      { label: "Fee Due", value: "₹4,500", delta: "pay now", color: "#f85149", icon: "◆" },
    ],
  },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const ATTENDANCE_DATA = [
  { day: "Mon", pct: 92 }, { day: "Tue", pct: 88 }, { day: "Wed", pct: 95 },
  { day: "Thu", pct: 79 }, { day: "Fri", pct: 91 }, { day: "Sat", pct: 85 },
];

const RECENT_ACTIVITIES = [
  { text: "New student Priya Sharma enrolled in Class 10A", time: "2m ago", type: "student" },
  { text: "Fee payment received from Rahul Kumar – ₹12,000", time: "18m ago", type: "fee" },
  { text: "Exam results uploaded for Class 8 Mathematics", time: "1h ago", type: "exam" },
  { text: "Leave approved for Teacher Anita Desai (3 days)", time: "2h ago", type: "leave" },
  { text: "Library book overdue: Class 7B – 4 students", time: "3h ago", type: "library" },
  { text: "New announcement posted by Principal", time: "5h ago", type: "notice" },
];

const UPCOMING_EVENTS = [
  { name: "Math Final Exam", date: "Mar 2", class: "Class 10", color: "#f85149" },
  { name: "Science Lab Test", date: "Mar 4", class: "Class 9", color: "#d29922" },
  { name: "Annual Sports Day", date: "Mar 8", class: "All Classes", color: "#3fb950" },
  { name: "Parent-Teacher Meet", date: "Mar 12", class: "Class 6-10", color: "#bc8cff" },
];

const TOP_STUDENTS = [
  { name: "Aarav Shah", class: "10A", score: 98, rank: 1 },
  { name: "Priya Sharma", class: "9B", score: 96, rank: 2 },
  { name: "Rohan Mehta", class: "10A", score: 94, rank: 3 },
  { name: "Sneha Patel", class: "8C", score: 93, rank: 4 },
];

// ─── MINI CHART COMPONENT ─────────────────────────────────────────────────────
function SparkBar({ data, color }) {
  const max = Math.max(...data.map((d) => d.pct));
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 48, marginTop: 12 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: "100%",
              height: `${(d.pct / max) * 38}px`,
              background: color,
              borderRadius: "3px 3px 0 0",
              opacity: 0.8,
              transition: "height 0.6s ease",
            }}
          />
          <span style={{ fontSize: 9, color: theme.colors.textMuted }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DONUT CHART ──────────────────────────────────────────────────────────────
function DonutChart({ pct, color, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.colors.border} strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ role, activeModule, setActiveModule, collapsed, setCollapsed }) {
  const config = ROLE_CONFIGS[role];
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minHeight: "100vh",
        background: theme.colors.surface,
        borderRight: `1px solid ${theme.colors.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 16px",
          borderBottom: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: config.gradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
            boxShadow: `0 0 12px ${config.color}40`,
          }}
        >
          {config.icon}
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: theme.colors.text, letterSpacing: "0.02em" }}>
              ABHYAAS
            </div>
            <div style={{ fontSize: 10, color: config.color, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {config.label} Portal
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto", overflowX: "hidden" }}>
        {config.nav.map((item) => {
          const isActive = activeModule === item.id;
          const isHovered = hoveredItem === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              title={collapsed ? item.label : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "9px 16px",
                margin: "1px 8px",
                borderRadius: 8,
                cursor: "pointer",
                background: isActive
                  ? `${config.color}18`
                  : isHovered
                  ? theme.colors.surfaceHover
                  : "transparent",
                borderLeft: isActive ? `2px solid ${config.color}` : "2px solid transparent",
                transition: "all 0.15s ease",
                justifyContent: collapsed ? "center" : "flex-start",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  color: isActive ? config.color : theme.colors.textMuted,
                  flexShrink: 0,
                  width: 20,
                  textAlign: "center",
                }}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span
                  style={{
                    fontSize: 13,
                    color: isActive ? config.color : theme.colors.textMuted,
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: "nowrap",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.01em",
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: "16px",
          borderTop: `1px solid ${theme.colors.border}`,
          cursor: "pointer",
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-end",
          color: theme.colors.textMuted,
          fontSize: 18,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = theme.colors.text)}
        onMouseLeave={(e) => (e.currentTarget.style.color = theme.colors.textMuted)}
      >
        {collapsed ? "→" : "←"}
      </div>
    </aside>
  );
}

// ─── TOP NAVBAR ───────────────────────────────────────────────────────────────
function Topbar({ role, activeModule, toggleSidebar, sidebarCollapsed }) {
  const config = ROLE_CONFIGS[role];
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const moduleName = config.nav.find((n) => n.id === activeModule)?.label || "Dashboard";

  return (
    <header
      style={{
        height: 60,
        background: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 9,
      }}
    >
      {/* Hamburger for mobile */}
      <button
        onClick={toggleSidebar}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: theme.colors.textMuted, fontSize: 20, padding: 4,
          display: "flex", alignItems: "center",
        }}
      >
        ☰
      </button>

      {/* Breadcrumb */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: theme.colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            {config.label}
          </span>
          <span style={{ color: theme.colors.textFaint, fontSize: 11 }}>›</span>
          <span style={{ fontSize: 13, color: theme.colors.text, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {moduleName}
          </span>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: theme.colors.bg,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 8, padding: "6px 12px",
          width: 200,
        }}
      >
        <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>⌕</span>
        <input
          placeholder="Search..."
          style={{
            background: "none", border: "none", outline: "none",
            color: theme.colors.text, fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", width: "100%",
          }}
        />
        <span style={{ color: theme.colors.textFaint, fontSize: 11 }}>⌘K</span>
      </div>

      {/* Notifications */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
          style={{
            background: showNotif ? theme.colors.surfaceHover : "none",
            border: `1px solid ${showNotif ? theme.colors.border : "transparent"}`,
            borderRadius: 8, cursor: "pointer", color: theme.colors.textMuted,
            fontSize: 18, padding: "6px 10px", position: "relative",
          }}
        >
          🔔
          <span
            style={{
              position: "absolute", top: 4, right: 6,
              width: 8, height: 8, borderRadius: "50%",
              background: "#f85149", border: `2px solid ${theme.colors.surface}`,
            }}
          />
        </button>
        {showNotif && (
          <div
            style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 300, background: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 12, padding: 12, zIndex: 100,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.colors.textMuted, marginBottom: 10, letterSpacing: "0.08em" }}>
              NOTIFICATIONS
            </div>
            {RECENT_ACTIVITIES.slice(0, 4).map((a, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < 3 ? `1px solid ${theme.colors.border}` : "none" }}>
                <div style={{ fontSize: 12, color: theme.colors.text }}>{a.text}</div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>{a.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: showProfile ? theme.colors.surfaceHover : "none",
            border: `1px solid ${showProfile ? theme.colors.border : "transparent"}`,
            borderRadius: 8, padding: "5px 10px", cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: config.gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#fff", fontWeight: 700,
            }}
          >
            {config.label[0]}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.text }}>
              {role === "admin" ? "Admin User" : role === "principal" ? "Dr. Sharma" : role === "teacher" ? "Anita Desai" : role === "student" ? "Aarav Shah" : "Rajesh Shah"}
            </div>
            <div style={{ fontSize: 10, color: config.color }}>{config.label}</div>
          </div>
        </button>
        {showProfile && (
          <div
            style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 180, background: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 12, overflow: "hidden", zIndex: 100,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {["My Profile", "Settings", "Change Password", "Logout"].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 16px", fontSize: 13, color: i === 3 ? "#f85149" : theme.colors.text,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  borderBottom: i < 3 ? `1px solid ${theme.colors.border}` : "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.surfaceHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ card, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.colors.surface,
        border: `1px solid ${hovered ? card.color + "60" : theme.colors.border}`,
        borderRadius: 12,
        padding: "18px 20px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 8px 24px ${card.color}20` : "none",
        animation: `fadeInUp 0.4s ease ${index * 0.06}s both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
            {card.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.text, marginTop: 6, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
            {card.value}
          </div>
          <div style={{ fontSize: 12, color: card.color, marginTop: 4, fontWeight: 500 }}>
            {card.delta}
          </div>
        </div>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: card.color + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: card.color,
          }}
        >
          {card.icon}
        </div>
      </div>
    </div>
  );
}

// ─── ATTENDANCE CHART CARD ─────────────────────────────────────────────────────
function AttendanceCard({ config }) {
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 12, padding: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.text, fontFamily: "'Syne', sans-serif" }}>
            Weekly Attendance
          </div>
          <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>Last 6 days</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DonutChart pct={91} color={config.color} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: theme.colors.text, fontFamily: "'Syne', sans-serif" }}>91%</div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>avg</div>
          </div>
        </div>
      </div>
      <SparkBar data={ATTENDANCE_DATA} color={config.color} />
    </div>
  );
}

// ─── RECENT ACTIVITY CARD ─────────────────────────────────────────────────────
function RecentActivityCard() {
  const typeColors = {
    student: "#58a6ff", fee: "#3fb950", exam: "#bc8cff",
    leave: "#d29922", library: "#ffa657", notice: "#39d353",
  };
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 12, padding: 20,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.text, marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>
        Recent Activity
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {RECENT_ACTIVITIES.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: typeColors[a.type] || "#8b949e",
                marginTop: 4, flexShrink: 0,
                boxShadow: `0 0 6px ${typeColors[a.type]}80`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: theme.colors.text, lineHeight: 1.5 }}>{a.text}</div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── UPCOMING EVENTS CARD ─────────────────────────────────────────────────────
function UpcomingEventsCard() {
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 12, padding: 20,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.text, marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>
        Upcoming Events
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {UPCOMING_EVENTS.map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 8,
              background: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div
              style={{
                width: 4, height: 36, borderRadius: 2,
                background: e.color, flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.text }}>{e.name}</div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{e.class}</div>
            </div>
            <div
              style={{
                fontSize: 11, color: e.color, fontWeight: 700,
                background: e.color + "18", padding: "3px 8px", borderRadius: 6,
              }}
            >
              {e.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TOP STUDENTS CARD ────────────────────────────────────────────────────────
function TopStudentsCard({ config }) {
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 12, padding: 20,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.text, marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>
        Top Performers
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TOP_STUDENTS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i === 0 ? "#d2992230" : i === 1 ? "#8b949e30" : i === 2 ? "#ffa65730" : theme.colors.bg,
                border: `1px solid ${i === 0 ? "#d29922" : i === 1 ? "#8b949e" : i === 2 ? "#ffa657" : theme.colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                color: i === 0 ? "#d29922" : i === 1 ? "#8b949e" : i === 2 ? "#ffa657" : theme.colors.textMuted,
              }}
            >
              {s.rank}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.text }}>{s.name}</div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{s.class}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 60, height: 4, borderRadius: 2,
                  background: theme.colors.border, overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%", width: `${s.score}%`,
                    background: config.color,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: config.color }}>{s.score}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MODULE PLACEHOLDER ───────────────────────────────────────────────────────
function ModulePlaceholder({ module, config }) {
  const moduleName = config.nav.find((n) => n.id === module)?.label || module;
  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: 400, gap: 16,
      }}
    >
      <div
        style={{
          width: 80, height: 80, borderRadius: 20,
          background: config.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, boxShadow: `0 0 40px ${config.color}40`,
        }}
      >
        {config.nav.find((n) => n.id === module)?.icon || "◈"}
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: theme.colors.text }}>
        {moduleName}
      </div>
      <div style={{ fontSize: 13, color: theme.colors.textMuted, textAlign: "center", maxWidth: 300 }}>
        This module is under development. Connect your backend API to populate this view.
      </div>
      <button
        style={{
          padding: "10px 24px",
          background: config.gradient,
          border: "none", borderRadius: 8,
          color: "#fff", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          boxShadow: `0 0 20px ${config.color}40`,
        }}
      >
        Configure Module →
      </button>
    </div>
  );
}

// ─── DASHBOARD CONTENT ────────────────────────────────────────────────────────
function DashboardContent({ role, activeModule }) {
  const config = ROLE_CONFIGS[role];

  if (activeModule !== "dashboard") {
    return <ModulePlaceholder module={activeModule} config={config} />;
  }

  const isStudentOrParent = role === "student" || role === "parent";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Welcome Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${config.color}15 0%, transparent 60%)`,
          border: `1px solid ${config.color}30`,
          borderRadius: 12,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text, fontFamily: "'Syne', sans-serif" }}>
            Good Morning! 👋
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {" · "}
            <span style={{ color: config.color }}>{config.label} Dashboard</span>
          </div>
        </div>
        <div
          style={{
            fontSize: 48, opacity: 0.6,
          }}
        >
          {config.icon}
        </div>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {config.cards.map((card, i) => (
          <StatCard key={i} card={card} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: isStudentOrParent ? "1fr" : "1fr 1fr", gap: 16 }}>
        <AttendanceCard config={config} />
        {!isStudentOrParent && <UpcomingEventsCard />}
        {isStudentOrParent && <UpcomingEventsCard />}
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: isTeacher || isStudentOrParent ? "1fr" : "1fr 1fr", gap: 16 }}>
        {(isAdmin || role === "principal") && <TopStudentsCard config={config} />}
        <RecentActivityCard />
      </div>

      {/* Parent / Student Info Banner */}
      {isStudentOrParent && (
        <div
          style={{
            background: role === "parent" ? "#39d35315" : "#ffa65715",
            border: `1px solid ${role === "parent" ? "#39d35340" : "#ffa65740"}`,
            borderRadius: 12, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>{role === "parent" ? "👁" : "📝"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.text }}>
              {role === "parent" ? "Parent View — Read Only" : "Student View — You can submit assignments"}
            </div>
            <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
              {role === "parent"
                ? "You are viewing your child's data. All information is read-only."
                : "Navigate to Homework module to submit your pending assignments."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROLE SWITCHER ────────────────────────────────────────────────────────────
function RoleSwitcher({ currentRole, onSwitch }) {
  return (
    <div
      style={{
        position: "fixed", bottom: 20, right: 20,
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 12, padding: 12,
        zIndex: 999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ fontSize: 10, color: theme.colors.textMuted, marginBottom: 8, fontWeight: 600, letterSpacing: "0.08em" }}>
        DEMO: SWITCH ROLE
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {Object.entries(ROLE_CONFIGS).map(([role, cfg]) => (
          <button
            key={role}
            onClick={() => onSwitch(role)}
            style={{
              background: currentRole === role ? cfg.gradient : "none",
              border: `1px solid ${currentRole === role ? cfg.color : theme.colors.border}`,
              borderRadius: 6, padding: "5px 10px", cursor: "pointer",
              color: currentRole === role ? "#fff" : theme.colors.textMuted,
              fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s",
            }}
          >
            <span>{cfg.icon}</span> {cfg.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function SchoolDashboard() {
  const [role, setRole] = useState("admin");
  const [activeModule, setActiveModule] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // When role changes, reset to dashboard
  useEffect(() => {
    setActiveModule("dashboard");
  }, [role]);

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          background: ${theme.colors.bg};
          color: ${theme.colors.text};
          font-family: 'DM Sans', sans-serif;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.colors.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.colors.textFaint}; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed !important;
            left: ${mobileSidebarOpen ? "0" : "-300px"} !important;
            z-index: 1000 !important;
            transition: left 0.3s ease !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: theme.colors.bg }}>

        {/* Sidebar */}
        <Sidebar
          role={role}
          activeModule={activeModule}
          setActiveModule={(m) => { setActiveModule(m); setMobileSidebarOpen(false); }}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Topbar
            role={role}
            activeModule={activeModule}
            toggleSidebar={() => setCollapsed(!collapsed)}
            sidebarCollapsed={collapsed}
          />

          {/* Content */}
          <main
            style={{
              flex: 1,
              padding: "24px",
              overflowY: "auto",
              background: theme.colors.bg,
            }}
          >
            <DashboardContent role={role} activeModule={activeModule} />
          </main>
        </div>
      </div>

      {/* Demo Role Switcher */}
      <RoleSwitcher currentRole={role} onSwitch={handleRoleSwitch} />
    </>
  );
}