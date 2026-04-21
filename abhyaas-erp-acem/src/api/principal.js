// frontend/src/api/principal.js
// Centralized API client for all Principal Dashboard endpoints

import { API_URL } from '../config/apiConfig';
const BASE = API_URL;

// 🛡️ FIX: Updated to match your actual login token key
function getToken() {
  return localStorage.getItem('token'); 
}

async function req(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Request failed');
  return json.data;
}

const get  = (path)         => req('GET',    path);
const post = (path, body)   => req('POST',   path, body);
const put  = (path, body)   => req('PUT',    path, body);
const del  = (path)         => req('DELETE', path);

// ─── Auth ─────────────────────────────────────────────────────
export const login = (email, password) =>
  req('POST', '/auth/login', { email, password });

// ─── Dashboard ────────────────────────────────────────────────
export const getDashboardStats = () => get('/principal/dashboard/stats');

// ─── Students ─────────────────────────────────────────────────
export const getStudents  = (params = {}) => get(`/principal/students?${new URLSearchParams(params)}`);
export const getStudent   = (id)          => get(`/principal/students/${id}`);

// ─── Teachers ─────────────────────────────────────────────────
export const getTeachers  = (params = {}) => get(`/principal/teachers?${new URLSearchParams(params)}`);
export const getTeacher   = (id)          => get(`/principal/teachers/${id}`);

// ─── Classes ─────────────────────────────────────────────────
export const getClasses   = ()  => get('/principal/classes');

// ─── Attendance ───────────────────────────────────────────────
export const getAttendance       = (params) => get(`/principal/attendance?${new URLSearchParams(params)}`);
export const getAttendanceSummary= ()       => get('/principal/attendance/summary');
export const getClassWiseAttendance = ()     => get('/principal/attendance/class-wise');

// ─── Performance ──────────────────────────────────────────────
export const getPerformanceOverview = ()       => get('/principal/performance/overview');
export const getResults             = (params) => get(`/principal/performance/results?${new URLSearchParams(params)}`);
export const getSubjectPerformance  = ()       => get('/principal/performance/subject-wise');

// ─── Exams ────────────────────────────────────────────────────
export const getExams       = (params) => get(`/principal/exams?${new URLSearchParams(params || {})}`);
export const getExamResults = (id)     => get(`/principal/exams/${id}/results`);

// ─── Fees ─────────────────────────────────────────────────────
export const getFeeReport   = (params) => get(`/principal/fees/report?${new URLSearchParams(params || {})}`);

// ─── Timetable ────────────────────────────────────────────────
export const getTimetable   = (classId) => get(`/principal/timetable?classId=${classId}`);

// ─── Announcements ────────────────────────────────────────────
export const getAnnouncements    = ()      => get('/principal/announcements');
export const postAnnouncement    = (data)  => post('/principal/announcements', data);
export const deleteAnnouncement  = (id)    => del(`/principal/announcements/${id}`);

// ─── Talent Tests ─────────────────────────────────────────────
export const getTalentTests  = (params) => get(`/principal/talent?${new URLSearchParams(params || {})}`);
export const createTalentTest= (data)   => post('/principal/talent', data);

// ─── Reports ──────────────────────────────────────────────────
export const getReportsOverview = () => get('/principal/reports/overview');

// ─── Leaves ───────────────────────────────────────────────────
export const getLeaves     = (params) => get(`/principal/leaves?${new URLSearchParams(params || {})}`);
export const reviewLeave   = (id, status, reviewNote) => put(`/principal/leaves/${id}`, { status, reviewNote });