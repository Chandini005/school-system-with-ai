import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, selectCurrentUser } from '../store/authSlice';
import { GlobalYearSwitcher } from '../pages/GlobalYearSwitcher';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Navbar';
// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const ROLE_META = {
    admin: {
        color: 'var(--color-accent)',
        gradient: `linear-gradient(135deg, var(--color-accent) 0%, #4f46e5 100%)`, 
        // icon: '<img src="/abhyaas-logo.png" alt="Abhyaas" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />,',
        icon: <img src="/logo.png" alt="Abhyaas" style={{ width: '200%', height: '180%', objectFit: 'cover', borderRadius: '8px' }} />,
        label: 'Admin Portal',
        links: [
            { name: 'Dashboard', path: '/dashboard/admin', icon: '◈' },
            { name: 'Admissions', path: '/dashboard/admin/admissions', icon: '📥' },
            // { name: 'Registrations', path: '/dashboard/admin/registrations', icon: '◉', badge: true },
            {
                name: 'User Creation',
                icon: '👤',
                children: [
                    { name: 'Create User', path: '/dashboard/admin/user-creation', icon: '➕' },
                    { name: 'Students', path: '/dashboard/admin/students', icon: '◎' },
                    { name: 'Teachers', path: '/dashboard/admin/teachers', icon: '◍' }
                ]
            },
            {
                name: 'Classes',
                path: '/dashboard/admin/classes',
                icon: '⬡',
                children: [
                    { name: 'View Classes', path: '/dashboard/admin/classes/view', icon: '◎' },
                    { name: 'Create Class', path: '/dashboard/admin/classes/create', icon: '◍' },
                    { name: 'Create Houses', path: '/dashboard/admin/classes/houses', icon: '◫' }
                ]
            },


            { name: 'Attendance', path: '/dashboard/admin/attendance', icon: '◷' },
            // { name: 'Examinations', path: '/dashboard/admin/exams', icon: '◈' },
            { name: 'Timetable', path: '/dashboard/admin/timetable', icon: '▦' },
            { name: 'Fee Management', path: '/dashboard/admin/fees', icon: '◆' },
            { name: 'Subjects', path: '/dashboard/admin/subjects', icon: '📖' },
            { name: 'Enter Marks', path: '/dashboard/admin/marks', icon: '📝' },
            { name: 'Inventory', path: '/dashboard/admin/inventory', icon: '📦' },

            {
                name: 'Announcements',

                icon: '⬡',
                children: [
                    { name: 'Examinations', path: '/dashboard/admin/exams', icon: '◈' },
                    { name: 'Circulars', path: '/dashboard/admin/communication', icon: '◎' }

                ]
            },
            // { name: 'Announcements', path: '/dashboard/admin/communication', icon: '◎' },
            { name: 'Reports', path: '/dashboard/admin/reports', icon: '◫' },
            // { name: 'Talent Tests', path: '/dashboard/admin/talent', icon: '★' },
            // { name: 'Leave Mgmt', path: '/dashboard/admin/leave', icon: '◷' },
            { name: 'Payroll', path: '/dashboard/admin/payroll', icon: '◆' },
            { name: 'System Settings', path: '/settings', icon: '⚙️' },
            { name: 'Security & Passwords', path: '/settings/security', icon: '🔐' },
        ],
    },
    principal: {
        color: 'var(--color-purple)',
        gradient: `linear-gradient(135deg, var(--color-purple) 0%, #a78bfa 100%)`,
        icon: '🎓',
        label: 'Principal Portal',
        links: [
            { name: 'Dashboard', path: '/dashboard/principal', icon: '◈' },
            { name: 'View Students', path: '/dashboard/principal/students', icon: '◎' },
            { name: 'View Teachers', path: '/dashboard/principal/teachers', icon: '◍' },
            { name: 'Attendance', path: '/dashboard/principal/attendance', icon: '◷' },
            { name: 'Performance', path: '/dashboard/principal/performance', icon: '◫' },
            { name: 'Exam Results', path: '/dashboard/principal/exams', icon: '◈' },

            { name: 'Fee Reports', path: '/dashboard/principal/fees', icon: '◆' },
            { name: 'Timetable', path: '/dashboard/principal/timetable', icon: '▦' },
            { name: 'Announcements', path: '/dashboard/principal/communication', icon: '◎' },
            { name: 'Talent Tests', path: '/dashboard/principal/talent', icon: '★' },
            { name: 'Analytics', path: '/dashboard/principal/reports', icon: '◫' },
        ],
    },
    teacher: {
        color: 'var(--color-success)',
        gradient: `linear-gradient(135deg, var(--color-success) 0%, #238636 100%)`,
        icon: '📚',
        label: 'Teacher Portal',
        links: [
            { name: 'Dashboard', path: '/dashboard/teacher', icon: '◈' },
            { name: 'My Profile', path: '/dashboard/teacher/profile', icon: '◉' },
            { name: 'My Classes', path: '/dashboard/teacher/classes', icon: '⬡' },
            { name: 'Mark Attendance', path: '/dashboard/teacher/attendance', icon: '◷' },
            { name: 'Enter Marks', path: '/dashboard/teacher/marks', icon: '◈' },
            { name: 'Upload Homework', path: '/dashboard/teacher/homework', icon: '◉' },
            { name: 'Evaluate Assignments', path: '/dashboard/teacher/assignments', icon: '◫' },
            { name: 'Timetable', path: '/dashboard/teacher/timetable', icon: '▦' },
            { name: 'Leave Request', path: '/dashboard/teacher/leave', icon: '◷' },
            { name: 'Student Perf.', path: '/dashboard/teacher/performance', icon: '◎' },
            { name: 'Parent Comm.', path: '/dashboard/teacher/communication', icon: '◎' },
        ],
    },
    student: {
        color: 'var(--color-orange)',
        gradient: `linear-gradient(135deg, var(--color-orange) 0%, #e0713b 100%)`,
        icon: '🎒',
        label: 'Student Portal',
        links: [
            { name: 'Dashboard', path: '/dashboard/student', icon: '◈' },
            { name: 'My Profile', path: '/dashboard/student/profile', icon: '◉' },
            { name: 'Attendance', path: '/dashboard/student/attendance', icon: '◷' },
            { name: 'Exam Results', path: '/dashboard/student/results', icon: '◈' },
            { name: 'Timetable', path: '/dashboard/student/timetable', icon: '▦' },
            { name: 'Homework', path: '/dashboard/student/homework', icon: '◉' },
            { name: 'Fee Status', path: '/dashboard/student/fees', icon: '◆' },
            { name: 'Library', path: '/dashboard/student/library', icon: '▣' },
            { name: 'Notices', path: '/dashboard/student/notices', icon: '◎' },
            { name: 'Talent Tests', path: '/dashboard/student/talent', icon: '★' },
        ],
    },
    parent: {
        color: 'var(--color-success)',
        gradient: `linear-gradient(135deg, #39d353 0%, #26a641 100%)`,
        icon: '👨‍👩‍👧',
        label: 'Parent Portal',
        links: [
            { name: 'Dashboard', path: '/dashboard/parent', icon: '◈' },
            { name: 'Child Profile', path: '/dashboard/parent/profile', icon: '◉' },
            { name: 'Attendance', path: '/dashboard/parent/attendance', icon: '◷' },
            { name: 'Exam Results', path: '/dashboard/parent/results', icon: '◈' },
            { name: 'Timetable', path: '/dashboard/parent/timetable', icon: '▦' },
            { name: 'Homework', path: '/dashboard/parent/homework', icon: '◉' },
            { name: 'Fee Status', path: '/dashboard/parent/fees', icon: '◆' },
            { name: 'Notices', path: '/dashboard/parent/notices', icon: '◎' },
            { name: 'Talent Tests', path: '/dashboard/parent/talent', icon: '★' },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════
export function DashboardLayout() {
    const user = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0); 

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    if (!user) return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-muted)]">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-4" />
                <span className="font-bold tracking-widest text-xs uppercase">Loading Portal...</span>
            </div>
        </div>
    );

    const role = user?.role?.toLowerCase();
    const meta = ROLE_META[role] || ROLE_META.admin;

    return (
        <>

            <div className="flex min-h-screen bg-[var(--color-bg)] relative overflow-hidden text-[var(--color-text)]">
                {/* Mobile Overlay */}
                {mobileOpen && (
                    <div 
                        className="fixed inset-0 bg-[var(--color-overlay)] backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
                        onClick={() => setMobileOpen(false)}
                    />
                )}

                {/* Responsive Sidebar Sidebar Wrapper */}
                <div className={`
                    fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <Sidebar
                        meta={meta}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                        navLinks={meta.links}
                        pendingCount={pendingCount}
                    />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                    <Topbar
                        user={user}
                        meta={meta}
                        onToggle={() => setMobileOpen(!mobileOpen)}
                        pendingCount={pendingCount}
                        onLogout={handleLogout}
                    />

                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-bg)] scroll-smooth">
                        <div className="max-w-[1600px] mx-auto animate-[fadeUp_0.3s_ease]">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

export default DashboardLayout;