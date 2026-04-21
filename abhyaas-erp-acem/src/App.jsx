import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MasterLandingPage from './pages/MasterLandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SetPassword from "./pages/SetPassword";

import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import UserProfile from './pages/UserProfile';

import DashboardLayout from './layouts/DashboardLayout';

import {
  AdminDashboardPage,
  RegistrationsPage,
  UserCreationPage,
  InventoryPage,
  StudentsPage,
  TeachersPage,
  ClassesViewPage,
  ClassesCreatePage,
  HousesCreatePage,
  AttendancePage,
  ExaminationsPage,
  TimetablePage,
  FeesPage,
  HomeworkPage,
  LibraryPage,
  AnnouncementsPage,
  TransportPage,
  LeavePage,
  PayrollPage,
  ActivityLogsPage,
  TalentTestsPage,
  ReportsPage,
  SubjectsPage,
  MarksEntryPage,
  AcademicYearSettingsPage as SettingsPage,
  PromoteStudentsPage,
  StudentMarksView,
  AdmissionsPage,
  SecurityPage
} from './pages/modules';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("[App Error]", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)',
          color: 'var(--color-text)', padding: '20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛡️</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Something went wrong.</h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', marginBottom: '32px', fontSize: '14px' }}>
            {this.state.error?.message || "An unexpected error occurred in the application module."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', background: 'var(--color-accent)', color: '#fff',
              border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 8px 16px -4px rgba(55, 48, 163, 0.3)', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Reload Website
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  console.log('[App] Rendering main router...');
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* ── 1. PUBLIC ROUTES ── */}
          <Route path="/" element={<MasterLandingPage />} />
          <Route path="/school/:schoolCode/login" element={<LoginPage />} />
          <Route path="/school/:schoolCode/register" element={<RegisterPage />} />
          <Route path="/set-password" element={<SetPassword />} />

          {/* ── 2. NON-ADMIN DASHBOARDS (Outside of DashboardLayout) ── */}
          <Route path="/dashboard/principal" element={<PrincipalDashboard />} />
          <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
          <Route path="/dashboard/student" element={<StudentDashboard />} />

          {/* ── 3. ADMIN DASHBOARD LAYOUT & ROUTES ── */}
          <Route path="/" element={<DashboardLayout />}>
            <Route path="profile" element={<UserProfile />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/security" element={<SecurityPage />} />

            <Route path="dashboard/admin" element={<AdminDashboardPage />} />
            <Route path="dashboard/admin/registrations" element={<RegistrationsPage />} />
            <Route path="dashboard/admin/user-creation" element={<UserCreationPage />} />
            <Route path="dashboard/admin/inventory" element={<InventoryPage />} />
            <Route path="dashboard/admin/subjects" element={<SubjectsPage />} />
            <Route path="dashboard/admin/marks" element={<MarksEntryPage />} />
            <Route path="dashboard/admin/admissions" element={<AdmissionsPage />} />
            <Route path="dashboard/admin/students" element={<StudentsPage />} />
            <Route path="dashboard/admin/teachers" element={<TeachersPage />} />
            <Route path="dashboard/admin/classes/view" element={<ClassesViewPage />} />
            <Route path="dashboard/admin/classes/create" element={<ClassesCreatePage />} />
            <Route path="dashboard/admin/classes/houses" element={<HousesCreatePage />} />
            <Route path="dashboard/admin/attendance" element={<AttendancePage />} />
            <Route path="dashboard/admin/exams" element={<ExaminationsPage />} />
            <Route path="dashboard/admin/timetable" element={<TimetablePage />} />
            <Route path="dashboard/admin/fees" element={<FeesPage />} />
            <Route path="dashboard/admin/homework" element={<HomeworkPage />} />
            <Route path="dashboard/admin/library" element={<LibraryPage />} />
            <Route path="dashboard/admin/communication" element={<AnnouncementsPage />} />
            <Route path="dashboard/admin/transport" element={<TransportPage />} />
            <Route path="dashboard/admin/reports" element={<ReportsPage />} />
            <Route path="dashboard/admin/talent" element={<TalentTestsPage />} />
            <Route path="dashboard/admin/leave" element={<LeavePage />} />
            <Route path="dashboard/admin/payroll" element={<PayrollPage />} />
            <Route path="dashboard/admin/logs" element={<ActivityLogsPage />} />
            <Route path="dashboard/admin/students/promote" element={<PromoteStudentsPage />} />
          </Route>

          {/* ── 4. Catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;