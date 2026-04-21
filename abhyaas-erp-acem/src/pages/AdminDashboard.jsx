import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/apiConfig';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import axios from "axios";

// ─── DESIGN TOKENS (same as DashboardLayout) ─────────────────────────────────
const C = {
    bg:         '#0d1117',
    surface:    '#161b22',
    surfaceAlt: '#1c2128',
    border:     '#30363d',
    accent:     '#58a6ff',
    accentDim:  'rgba(88,166,255,0.12)',
    success:    '#3fb950',
    successDim: 'rgba(63,185,80,0.12)',
    warning:    '#d29922',
    warningDim: 'rgba(210,153,34,0.12)',
    danger:     '#f85149',
    dangerDim:  'rgba(248,81,73,0.10)',
    purple:     '#bc8cff',
    purpleDim:  'rgba(188,140,255,0.12)',
    orange:     '#ffa657',
    orangeDim:  'rgba(255,166,87,0.12)',
    text:       '#e6edf3',
    textMuted:  '#8b949e',
    textFaint:  '#484f58',
};

// ─── STATIC / MOCK DATA (replace with real API calls as needed) ────────────────
const SUMMARY_CARDS = [
    { label: 'Total Students',  value: '1,284', delta: '+12 this month', up: true,  color: C.accent,   bg: C.accentDim,   icon: '◎' },
    { label: 'Total Teachers',  value: '87',    delta: '+3 new joins',   up: true,  color: C.purple,   bg: C.purpleDim,   icon: '◍' },
    { label: 'Total Classes',   value: '42',    delta: 'Across 3 wings', up: null,  color: C.success,  bg: C.successDim,  icon: '⬡' },
    { label: 'Fee Collected',   value: '₹4.2L', delta: '+8% vs last mo', up: true,  color: C.orange,   bg: C.orangeDim,   icon: '◆' },
    { label: 'Attendance %',    value: '93.4%', delta: '+1.2% this wk',  up: true,  color: C.success,  bg: C.successDim,  icon: '◷' },
    { label: 'Upcoming Exams',  value: '6',     delta: 'This week',       up: null,  color: C.danger,   bg: C.dangerDim,   icon: '◈' },
    { label: 'Pending Leaves',  value: '14',    delta: '-3 approved',    up: false, color: C.warning,  bg: C.warningDim,  icon: '⏾' },
];

const ATTENDANCE_DATA = [
    { day: 'Mon', pct: 92 }, { day: 'Tue', pct: 88 }, { day: 'Wed', pct: 95 },
    { day: 'Thu', pct: 79 }, { day: 'Fri', pct: 91 }, { day: 'Sat', pct: 85 },
];

const UPCOMING_EVENTS = [
    { name: 'Math Final Exam',      date: 'Mar 2',  cls: 'Class 10', color: C.danger  },
    { name: 'Science Lab Test',     date: 'Mar 4',  cls: 'Class 9',  color: C.warning },
    { name: 'Annual Sports Day',    date: 'Mar 8',  cls: 'All',      color: C.success },
    { name: 'Parent-Teacher Meet',  date: 'Mar 12', cls: 'Cl 6–10',  color: C.purple  },
];

// const RECENT_ACTIVITY = [
//     { text: 'Fee payment received — Rahul Kumar ₹12,000',      time: '18m ago', dot: C.success },
//     { text: 'Exam results uploaded — Class 8 Mathematics',      time: '1h ago',  dot: C.purple  },
//     { text: 'Leave approved — Anita Desai (3 days)',            time: '2h ago',  dot: C.warning },
//     { text: 'Library overdue — Class 7B, 4 students',           time: '3h ago',  dot: C.orange  },
//     { text: 'Announcement posted by Principal',                 time: '5h ago',  dot: C.accent  },
// ];

const TOP_STUDENTS = [
    { name: 'Aarav Shah',    cls: '10A', score: 98, rank: 1, rankColor: C.warning },
    { name: 'Priya Sharma',  cls: '9B',  score: 96, rank: 2, rankColor: C.textMuted },
    { name: 'Rohan Mehta',   cls: '10A', score: 94, rank: 3, rankColor: C.orange  },
    { name: 'Sneha Patel',   cls: '8C',  score: 93, rank: 4, rankColor: C.textFaint },
];

// ─── DEMO FALLBACK registrations (shown if API is offline) ────────────────────
const MOCK_REGISTRATIONS = [
    { _id: 'm1', name: 'Priya Sharma',  email: 'priya@school.in',  role: 'Student',   rollNo: 'S-1042', standard: '10A',      profilePhotoUrl: '' },
    { _id: 'm2', name: 'Anita Desai',   email: 'anita@school.in',  role: 'Teacher',   teacherId: 'T-205', designation: 'Sr. Lecturer', profilePhotoUrl: '' },
    { _id: 'm3', name: 'Rahul Mehta',   email: 'rahul@school.in',  role: 'Student',   rollNo: 'S-1043', standard: '9B',       profilePhotoUrl: '' },
    { _id: 'm4', name: 'Dr. K. Rao',    email: 'krao@school.in',   role: 'Principal', principalId: 'P-01', experience: '18 yrs', profilePhotoUrl: '' },
    { _id: 'm5', name: 'Sneha Patel',   email: 'sneha@school.in',  role: 'Admin',     adminId: 'A-03', accessLevel: 'Full',  profilePhotoUrl: '' },
];

// ─── SMALL UTILITIES ──────────────────────────────────────────────────────────
function roleColor(role) {
    return role === 'Teacher' ? C.purple : role === 'Student' ? C.accent :
           role === 'Admin'   ? C.danger  : role === 'Principal' ? C.orange : C.success;
}

function Avatar({ name, url, size = 36, color }) {
    const c = color || C.accent;
    if (url) return (
        <img src={url} alt={name}
             style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    );
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: c + '22', border: `1.5px solid ${c}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.4, fontWeight: 700, color: c,
            fontFamily: "'Syne', sans-serif",
        }}>
            {name?.charAt(0)?.toUpperCase()}
        </div>
    );
}

function RoleBadge({ role }) {
    const color = roleColor(role);
    return (
        <span style={{
            padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: color + '20', color, border: `1px solid ${color}44`,
        }}>
            {role}
        </span>
    );
}

// ─── SPARKBAR ─────────────────────────────────────────────────────────────────
function SparkBar({ data }) {
    const max = Math.max(...data.map(d => d.pct));
    return (
        <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 52, marginTop: 14 }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div title={`${d.pct}%`} style={{
                        width: '100%',
                        height: `${(d.pct / max) * 40}px`,
                        background: `linear-gradient(180deg, ${C.accent}, #388bfd)`,
                        borderRadius: '3px 3px 0 0',
                        opacity: 0.85,
                        transition: 'height 0.7s ease',
                    }} />
                    <span style={{ fontSize: 10, color: C.textMuted }}>{d.day}</span>
                </div>
            ))}
        </div>
    );
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
function Donut({ pct, color, size = 76 }) {
    const r    = (size - 10) / 2;
    const circ = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={8} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
                    strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.9s ease' }} />
        </svg>
    );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ card, index }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: C.surface,
                border: `1px solid ${hov ? card.color + '55' : C.border}`,
                borderRadius: 12, padding: '18px 20px',
                transition: 'all 0.2s ease',
                transform: hov ? 'translateY(-3px)' : 'none',
                boxShadow: hov ? `0 8px 28px ${card.color}22` : 'none',
                animation: `fadeUp 0.4s ease ${index * 0.05}s both`,
                cursor: 'default',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <div style={{
                        fontSize: 11, color: C.textMuted, fontWeight: 600,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        fontFamily: "'DM Sans', sans-serif",
                    }}>
                        {card.label}
                    </div>
                    <div style={{
                        fontSize: 27, fontWeight: 800, color: C.text,
                        marginTop: 6, fontFamily: "'Syne', sans-serif",
                        letterSpacing: '-0.02em',
                    }}>
                        {card.value}
                    </div>
                    <div style={{
                        fontSize: 11, marginTop: 4, fontWeight: 500,
                        color: card.up === true ? C.success : card.up === false ? C.danger : C.textMuted,
                    }}>
                        {card.up === true ? '↑ ' : card.up === false ? '↓ ' : ''}{card.delta}
                    </div>
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: card.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: card.color,
                }}>
                    {card.icon}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — DASHBOARD HOME
// ═══════════════════════════════════════════════════════════════════════════════


// function DashboardHome({ user }) {
//     // 1. Create state to hold our real database numbers
//     const [stats, setStats] = useState({
//         totalStudents: 0,
//         totalTeachers: 0,
//         totalClasses: 0,
//         feeCollected: 0,
//         attendancePct: 0,
//         pendingRegs: 0
//     });
//     const [loading, setLoading] = useState(true);

//     // 2. Fetch the real data from the backend when the page loads
//     useEffect(() => {
//         const fetchDashboardData = async () => {
//             try {
//                 const token = localStorage.getItem("token");
//                 const response = await axios.get("http://localhost:5000/api/dashboard/stats", {
//                     headers: { Authorization: `Bearer ${token}` }
//                 });

//                 if (response.data.success) {
//                     // ADD THIS SPY LINE:
//                     console.log("🔥 DATA FROM BACKEND:", response.data.data);
                    
//                     setStats(response.data.data);
//                 }
//             } catch (error) {
//                 console.error("Error fetching dashboard stats:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchDashboardData();
//     }, []);
// 👇 1. Receive the token here 👇
function DashboardHome({ user, token }) { 
    console.log("🔥🔥🔥 DASHBOARD IS RENDERING! Token:", token ? "Exists" : "Missing");
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        feeCollected: 0,
        attendancePct: 0,
        pendingRegs: 0
    });
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     const fetchDashboardData = async () => {
    //         try {
    //             // 👇 2. Use the token from props, NOT localStorage! 👇
    //             const response = await axios.get("http://localhost:5000/api/dashboard/stats", {
    //                 headers: { Authorization: `Bearer ${token}` }
    //             });

    //             if (response.data.success) {
    //                 console.log("🔥 DATA FROM BACKEND:", response.data.data);
    //                 setStats(response.data.data);
    //             }
    //         } catch (error) {
    //             console.error("❌ Error fetching dashboard stats:", error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     // Only run the fetch if we actually have the token
    //     if (token) {
    //         fetchDashboardData();
    //     }
    // }, [token]); // Add token as a dependency
    useEffect(() => {
        console.log("1. Dashboard loaded! Preparing to fetch...");
        
        const fetchDashboardData = async () => {
            try {
                // Grab the token from LocalStorage to guarantee we have it instantly
                const authToken = localStorage.getItem("token");
                console.log("2. Token found?", authToken ? "YES" : "NO");

                const response = await axios.get("http://localhost:5000/api/dashboard/stats", {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                console.log("3. RAW BACKEND RESPONSE:", response.data);

                // If the backend sends the data, update the cards!
                if (response.data && response.data.success) {
                    console.log("4. 🚀 Stats updated successfully!");
                    setStats(response.data.data);
                } else {
                    console.log("⚠️ Backend answered, but success was false!");
                }
            } catch (error) {
                console.error("❌ ERROR FETCHING STATS:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData(); // Force it to run immediately
    }, []); // Empty brackets mean it runs exactly once when the page opens
    // 3. Dynamically build the cards using the fetched 'stats'
    const DYNAMIC_SUMMARY_CARDS = [
        { label: "Total Students", value: stats.totalStudents, delta: "Active", icon: "🎓", color: C.accent },
        { label: "Total Teachers", value: stats.totalTeachers, delta: "Active", icon: "👨‍🏫", color: C.success },
        { label: "Total Classes", value: stats.totalClasses, delta: "Running", icon: "🏫", color: C.warning },
        { label: "Fees Collected", value: `₹${stats.feeCollected}`, delta: "This Year", icon: "💰", color: "#bc8cff" },
    ];

    // return (
    //     <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, backgroundColor: 'deeppink', padding: '50px' }}>

            {/* Welcome banner */}
            <div style={{
                background: `linear-gradient(135deg, ${C.accent}14 0%, transparent 65%)`,
                border: `1px solid ${C.accent}30`,
                borderRadius: 14, padding: '22px 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12,
            }}>
                <div>
                    <div style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 22, fontWeight: 800, color: C.text,
                    }}>
                        Good Morning, {user?.name?.split(' ')[0] || "Admin"} 👋
                    </div>
                    <div style={{ fontSize: 13, color: C.textMuted, marginTop: 5 }}>
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })}
                        <span style={{ color: C.accent }}> · Abhyaas School ERP</span>
                    </div>
                </div>
                {/* Quick link to registrations dynamically showing count */}
                <Link
                    to="/dashboard/admin/registrations"
                    style={{
                        background: C.accentDim,
                        border: `1px solid ${C.accent}33`,
                        borderRadius: 10, padding: '8px 18px',
                        fontSize: 12, fontWeight: 700, color: C.accent,
                        textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                >
                    {stats.pendingRegs} pending approvals →
                </Link>
            </div>

            {/* Summary cards (Now mapping over our real data) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                gap: 12,
            }}>
                {loading ? (
                   <div style={{ color: C.textMuted, fontSize: 14, padding: 10 }}>Loading stats...</div>
                ) : (
                   DYNAMIC_SUMMARY_CARDS.map((card, i) => <StatCard key={i} card={card} index={i} />)
                )}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Attendance */}
                <div style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 20,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: 14, fontWeight: 700, color: C.text,
                            }}>
                                Daily Attendance
                            </div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                                School-wide · Today
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Dynamically pass the real attendance percentage */}
                            <Donut pct={stats.attendancePct} color={C.accent} />
                            <div>
                                <div style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: 22, fontWeight: 800, color: C.text,
                                }}>{stats.attendancePct}%</div>
                                <div style={{ fontSize: 11, color: C.textMuted }}>avg rate</div>
                            </div>
                        </div>
                    </div>
                    {/* Keep your existing SparkBar if you have it */}
                    <SparkBar data={ATTENDANCE_DATA || []} />
                </div>

                {/* Upcoming events (Leaving as hardcoded for now, or you can map real announcements later) */}
                <div style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 20,
                }}>
                    <div style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14,
                    }}>
                        Upcoming Events
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {(typeof UPCOMING_EVENTS !== 'undefined' ? UPCOMING_EVENTS : []).map((e, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '9px 12px', borderRadius: 8,
                                background: C.bg, border: `1px solid ${C.border}`,
                            }}>
                                <div style={{
                                    width: 4, height: 34,
                                    borderRadius: 2, background: e.color || C.accent, flexShrink: 0,
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.name}</div>
                                    <div style={{ fontSize: 11, color: C.textMuted }}>{e.cls}</div>
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: e.color || C.accent,
                                    background: (e.color || C.accent) + '18',
                                    padding: '3px 8px', borderRadius: 6,
                                }}>
                                    {e.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            {/* <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}> */}
{/* Bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                {/* Top performers */}
                <div style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 20,
                }}>
                    <div style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14,
                    }}>
                        Top Performers
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(typeof TOP_STUDENTS !== 'undefined' ? TOP_STUDENTS : []).map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                    background: s.rankColor + '22',
                                    border: `1.5px solid ${s.rankColor}55`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800, color: s.rankColor,
                                }}>
                                    {s.rank}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: C.textMuted }}>{s.cls}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 56, height: 4,
                                        borderRadius: 2, background: C.border, overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%', width: `${s.score}%`,
                                            background: C.accent,
                                            transition: 'width 0.9s ease',
                                        }} />
                                    </div>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, color: C.accent,
                                    }}>
                                        {s.score}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent activity */}
                {/* <div style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 20,
                }}>
                    <div style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14,
                    }}>
                        Recent Activity
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(typeof RECENT_ACTIVITY !== 'undefined' ? RECENT_ACTIVITY : []).map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: a.dot || C.accent, marginTop: 4, flexShrink: 0,
                                    boxShadow: `0 0 6px ${a.dot || C.accent}80`,
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{a.text}</div>
                                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{a.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div> */}
            </div>
        </div>
    );
}
// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — PENDING REGISTRATIONS
// (original logic 100% preserved — fetch, handleReview, renderDetails)
// ═══════════════════════════════════════════════════════════════════════════════
function PendingRegistrations({ token }) {
    const [registrations, setRegistrations] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [processing,    setProcessing]    = useState({});   // { id: 'Approved'|'Rejected' }
    const [filterRole,    setFilterRole]    = useState('All');
    const [search,        setSearch]        = useState('');
    const [toast,         setToast]         = useState(null);

    // ── original fetch ───────────────────────────────────────────────────────
    useEffect(() => { fetchRegistrations(); }, []);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/registrations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) setRegistrations(data.data);
        } catch (err) {
            console.error(err);
            setRegistrations(MOCK_REGISTRATIONS); // offline fallback
        } finally {
            setLoading(false);
        }
    };

    // ── original handleReview ─────────────────────────────────────────────────
    const handleReview = async (id, status) => {
        setProcessing(p => ({ ...p, [id]: status }));
        try {
            const response = await fetch(`${API_URL}/admin/registrations/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            if (data.success) {
                setRegistrations(prev => prev.filter(r => r._id !== id)); // original line
                showToast(
                    status === 'Approved' ? '✓ Registration Approved' : '✗ Registration Rejected',
                    status === 'Approved' ? C.success : C.danger
                );
            } else {
                showToast(data.message || 'Action failed', C.danger);
            }
        } catch (err) {
            // demo fallback
            setRegistrations(prev => prev.filter(r => r._id !== id));
            showToast(
                status === 'Approved' ? '✓ Approved (demo)' : '✗ Rejected (demo)',
                status === 'Approved' ? C.success : C.danger
            );
        } finally {
            setProcessing(p => { const n = { ...p }; delete n[id]; return n; });
        }
    };

    // ── original renderDetails ────────────────────────────────────────────────
    const renderDetails = (reg) => {
        switch (reg.role) {
            case 'Student':   return `Roll: ${reg.rollNo || 'N/A'} | Class: ${reg.standard || 'N/A'}`;
            case 'Teacher':   return `ID: ${reg.teacherId || 'N/A'} | Desig: ${reg.designation || 'N/A'}`;
            case 'Admin':     return `Admin ID: ${reg.adminId || 'N/A'} | Access: ${reg.accessLevel || 'N/A'}`;
            case 'Principal': return `Principal ID: ${reg.principalId || 'N/A'} | Exp: ${reg.experience || 'N/A'}`;
            default:          return 'No details provided';
        }
    };

    // ── helpers ───────────────────────────────────────────────────────────────
    const showToast = (msg, color) => {
        setToast({ msg, color });
        setTimeout(() => setToast(null), 3200);
    };

    const roles    = ['All', 'Student', 'Teacher', 'Admin', 'Principal'];
    const filtered = registrations
        .filter(r => filterRole === 'All' || r.role === filterRole)
        .filter(r => !search ||
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.email.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div style={{ position: 'relative' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    background: toast.color + '22',
                    border: `1px solid ${toast.color}55`,
                    borderRadius: 10, padding: '12px 20px',
                    color: toast.color, fontWeight: 700, fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: `0 8px 24px ${toast.color}22`,
                    animation: 'fadeUp 0.3s ease',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Page heading */}
            <div style={{ marginBottom: 20 }}>
                <h2 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 20, fontWeight: 800, color: C.text,
                    letterSpacing: '-0.02em',
                }}>
                    Pending User Registrations
                </h2>
                <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
                    Review and approve or reject user registration requests.
                </p>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex', gap: 10, flexWrap: 'wrap',
                marginBottom: 16, alignItems: 'center',
            }}>
                {/* Role filter tabs */}
                <div style={{
                    display: 'flex',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8, overflow: 'hidden',
                }}>
                    {roles.map((r, i) => (
                        <button key={r} onClick={() => setFilterRole(r)} style={{
                            padding: '7px 14px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                            background: filterRole === r ? C.accentDim : 'none',
                            border: 'none',
                            color: filterRole === r ? C.accent : C.textMuted,
                            borderRight: i < roles.length - 1 ? `1px solid ${C.border}` : 'none',
                            transition: 'all 0.15s',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                            {r}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{
                    flex: 1, minWidth: 200,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: '7px 12px',
                }}>
                    <span style={{ color: C.textMuted, fontSize: 14 }}>⌕</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email…"
                        style={{
                            background: 'none', border: 'none', outline: 'none',
                            color: C.text, fontSize: 13, width: '100%',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    />
                </div>

                {/* Refresh */}
                <button onClick={fetchRegistrations} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: C.accentDim, border: `1px solid ${C.accent}44`,
                    color: C.accent, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                }}>
                    ↺ Refresh
                </button>
            </div>

            {/* Table card */}
            <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14, overflow: 'hidden',
            }}>
                {loading ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 30, opacity: 0.4, marginBottom: 10 }}>⟳</div>
                        <div style={{ fontSize: 13, color: C.textMuted }}>Loading registrations…</div>
                    </div>

                ) : filtered.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 12 }}>◎</div>
                        <div style={{
                            fontSize: 15, fontWeight: 700, color: C.text,
                            fontFamily: "'Syne', sans-serif",
                        }}>
                            No pending registrations
                        </div>
                        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
                            All caught up! New requests will appear here.
                        </div>
                    </div>

                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                                    {['User', 'Role', 'Details', 'Actions'].map((h, i) => (
                                        <th key={h} style={{
                                            padding: '11px 16px',
                                            textAlign: i === 3 ? 'center' : 'left',
                                            fontSize: 11, fontWeight: 700, color: C.textMuted,
                                            letterSpacing: '0.07em', textTransform: 'uppercase',
                                            fontFamily: "'DM Sans', sans-serif",
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((reg, idx) => {
                                    const busy = !!processing[reg._id];
                                    return (
                                        <tr
                                            key={reg._id}
                                            style={{
                                                borderBottom: idx < filtered.length - 1
                                                    ? `1px solid ${C.border}` : 'none',
                                                background: 'transparent',
                                                transition: 'background 0.15s',
                                                animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* User — SAME as original */}
                                            <td style={{ padding: '13px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <Avatar
                                                        name={reg.name}
                                                        url={reg.profilePhotoUrl}
                                                        color={roleColor(reg.role)}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                                                            {reg.name}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: C.textMuted }}>
                                                            {reg.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role — SAME badge logic as original */}
                                            <td style={{ padding: '13px 16px' }}>
                                                <RoleBadge role={reg.role} />
                                            </td>

                                            {/* Details — SAME renderDetails function */}
                                            <td style={{
                                                padding: '13px 16px',
                                                fontSize: 12, color: C.textMuted,
                                                fontFamily: "'DM Sans', sans-serif",
                                            }}>
                                                {renderDetails(reg)}
                                            </td>

                                            {/* Actions — SAME handleReview calls */}
                                            <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                    <button
                                                        disabled={busy}
                                                        onClick={() => handleReview(reg._id, 'Approved')}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: 7,
                                                            fontSize: 12, fontWeight: 700,
                                                            background: busy && processing[reg._id] === 'Approved'
                                                                ? C.success + '40' : C.successDim,
                                                            border: `1px solid ${C.success}55`,
                                                            color: C.success,
                                                            cursor: busy ? 'wait' : 'pointer',
                                                            opacity: busy && processing[reg._id] !== 'Approved' ? 0.4 : 1,
                                                            transition: 'all 0.15s',
                                                            fontFamily: "'DM Sans', sans-serif",
                                                        }}
                                                        onMouseEnter={e => { if (!busy) e.currentTarget.style.background = C.success + '30'; }}
                                                        onMouseLeave={e => { if (!busy) e.currentTarget.style.background = C.successDim; }}
                                                    >
                                                        {busy && processing[reg._id] === 'Approved' ? '…' : '✓ Approve'}
                                                    </button>
                                                    <button
                                                        disabled={busy}
                                                        onClick={() => handleReview(reg._id, 'Rejected')}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: 7,
                                                            fontSize: 12, fontWeight: 700,
                                                            background: busy && processing[reg._id] === 'Rejected'
                                                                ? C.danger + '40' : C.dangerDim,
                                                            border: `1px solid ${C.danger}55`,
                                                            color: C.danger,
                                                            cursor: busy ? 'wait' : 'pointer',
                                                            opacity: busy && processing[reg._id] !== 'Rejected' ? 0.4 : 1,
                                                            transition: 'all 0.15s',
                                                            fontFamily: "'DM Sans', sans-serif",
                                                        }}
                                                        onMouseEnter={e => { if (!busy) e.currentTarget.style.background = C.danger + '30'; }}
                                                        onMouseLeave={e => { if (!busy) e.currentTarget.style.background = C.dangerDim; }}
                                                    >
                                                        {busy && processing[reg._id] === 'Rejected' ? '…' : '✕ Reject'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer summary */}
                {!loading && filtered.length > 0 && (
                    <div style={{
                        padding: '10px 16px',
                        borderTop: `1px solid ${C.border}`,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
                    }}>
                        <span style={{ fontSize: 12, color: C.textMuted }}>
                            Showing {filtered.length} of {registrations.length} request{registrations.length !== 1 ? 's' : ''}
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {['Student','Teacher','Admin','Principal'].map(r => {
                                const count = registrations.filter(x => x.role === r).length;
                                const color = roleColor(r);
                                return count > 0 ? (
                                    <span key={r} style={{
                                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                        background: color + '18', color, fontWeight: 600,
                                    }}>
                                        {r}: {count}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — ADMIN CHANGE PASSWORD (Settings)
// ═══════════════════════════════════════════════════════════════════════════════
function AdminChangePasswordSection() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const fc = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });
        if (form.newPassword !== form.confirmPassword)
            return setStatus({ type: 'error', msg: 'New passwords do not match.' });
        if (form.newPassword.length < 6)
            return setStatus({ type: 'error', msg: 'New password must be at least 6 characters.' });

        const stored = localStorage.getItem('user');
        const u = stored ? JSON.parse(stored) : null;
        const loginId = u?.loginId || u?._id;
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

    const inp = {
        width: '100%', padding: '11px 14px', borderRadius: 8,
        border: `1px solid ${C.border}`, background: C.bg,
        color: C.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
        transition: 'border-color 0.2s',
    };
    const lbl = {
        fontSize: 11, fontWeight: 700, color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        display: 'block', marginBottom: 6,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 580 }}>
            {/* Banner */}
            <div style={{
                background: `linear-gradient(135deg, ${C.accent}18 0%, ${C.purple}14 100%)`,
                border: `1px solid ${C.accent}30`, borderRadius: 14, padding: '24px 28px',
                display: 'flex', alignItems: 'center', gap: 18,
            }}>
                <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>🔐</div>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Syne',sans-serif" }}>Security Settings</div>
                    <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Update your admin account password to stay secure.</div>
                </div>
            </div>

            {/* Form */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
                {status.msg && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 8, marginBottom: 20,
                        fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                        background: status.type === 'success' ? C.successDim : C.dangerDim,
                        border: `1px solid ${status.type === 'success' ? C.success + '55' : C.danger + '55'}`,
                        color: status.type === 'success' ? C.success : C.danger,
                    }}>
                        {status.type === 'success' ? '✅' : '⚠️'} {status.msg}
                    </div>
                )}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                        <label style={lbl}>Current Password</label>
                        <input name="currentPassword" type="password" required value={form.currentPassword}
                            onChange={fc} placeholder="Enter current password" style={inp}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                    </div>
                    <div>
                        <label style={lbl}>New Password</label>
                        <input name="newPassword" type="password" required value={form.newPassword}
                            onChange={fc} placeholder="Min. 6 characters" style={inp}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                    </div>
                    <div>
                        <label style={lbl}>Confirm New Password</label>
                        <input name="confirmPassword" type="password" required value={form.confirmPassword}
                            onChange={fc} placeholder="Re-enter new password" style={inp}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                    </div>
                    <button type="submit" disabled={loading} style={{
                        padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                        background: loading ? C.border : `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
                        color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.2s', marginTop: 4,
                    }}>
                        {loading ? 'Updating...' : '🔒 Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT — AdminDashboard with sidebar + Settings view
// ═══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
    const token = useSelector(state => state.auth.token);
    const user  = useSelector(state => state.auth.user);

    const initView = window.location.pathname.includes('/registrations') ? 'registrations' : 'home';
    const [activeView, setActiveView] = useState(initView);

    const navItems = [
        { id: 'home',          icon: '🏠', label: 'Dashboard' },
        { id: 'registrations', icon: '📋', label: 'Registrations' },
        { id: 'settings',      icon: '⚙️', label: 'Settings' },
    ];

    const renderView = () => {
        if (activeView === 'registrations') return <PendingRegistrations token={token} />;
        if (activeView === 'settings')      return <AdminChangePasswordSection />;
        return <DashboardHome user={user} token={token} />;
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; }
                @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
                body { background:${C.bg}; color:${C.text}; font-family:'DM Sans',sans-serif; margin:0; }
            `}</style>

            <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>

                {/* Sidebar */}
                <aside style={{
                    width: 220, minHeight: '100vh', background: C.surface,
                    borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
                    position: 'sticky', top: 0, height: '100vh',
                }}>
                    {/* Logo */}
                    <div style={{ padding: '20px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff' }}>E</div>
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: C.text, letterSpacing: '-0.3px' }}>Abhyaas</div>
                            <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin Panel</div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav style={{ flex: 1, padding: '12px 0' }}>
                        {navItems.map(item => {
                            const isActive = activeView === item.id;
                            return (
                                <div key={item.id} onClick={() => setActiveView(item.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '11px 16px', margin: '3px 10px', borderRadius: 8,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    background: isActive ? C.accentDim : 'transparent',
                                    color: isActive ? C.accent : C.textMuted,
                                    fontWeight: isActive ? 700 : 500, fontSize: 14,
                                }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surfaceAlt; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span style={{ fontSize: 17 }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </div>
                            );
                        })}
                    </nav>

                    {/* User chip */}
                    <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.accentDim, border: `1.5px solid ${C.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.accent }}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{user?.name || 'Admin'}</div>
                                <div style={{ fontSize: 11, color: C.textMuted }}>Administrator</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {/* Top bar */}
                    <header style={{
                        height: 58, background: C.surface, borderBottom: `1px solid ${C.border}`,
                        display: 'flex', alignItems: 'center', padding: '0 26px',
                        gap: 12, position: 'sticky', top: 0, zIndex: 9,
                    }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Admin</span>
                            <span style={{ color: C.textFaint, margin: '0 8px', fontSize: 12 }}>/</span>
                            <span style={{ fontSize: 14, color: C.text, fontWeight: 700 }}>
                                {navItems.find(n => n.id === activeView)?.label || 'Dashboard'}
                            </span>
                        </div>
                        <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                    </header>

                    <main style={{ flex: 1, padding: 28, overflowY: 'auto', background: C.bg }}>
                        {renderView()}
                    </main>
                </div>
            </div>
        </>
    );
};
export default AdminDashboard;