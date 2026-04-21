// src/api/index.js — Centralised API calls for all modules
import { API_URL } from '../config/apiConfig';
const BASE = API_URL;

const getToken = () => {
  try {
    const state = JSON.parse(localStorage.getItem('persist:root') || '{}');
    return JSON.parse(state.auth || '{}').token || '';
  } catch { return ''; }
};

const h = (isFormData = false, extra = {}) => {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
    'X-Academic-Year': localStorage.getItem('selectedAcademicYear') || '',
    ...extra,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const req = async (method, path, body) => {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h(isFormData),
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data.data;
};

export const api = {
  // Dashboard
  getStats:        ()           => req('GET',  '/dashboard/stats'),
  getActivity:     ()           => req('GET',  '/dashboard/activity'),

  // Students
  getStudents:     (params='') => req('GET',  `/students?${params}`),
  getStudent:      (id)        => req('GET',  `/students/${id}`),
  createStudent:   (b)         => req('POST', '/students', b),
  updateStudent:   (id,b)      => req('PUT',  `/students/${id}`, b),
  deleteStudent:   (id)        => req('DELETE',`/students/${id}`),

  // Teachers
  getTeachers:     (params='') => req('GET',  `/teachers?${params}`),
  getTeacher:      (id)        => req('GET',  `/teachers/${id}`),
  createTeacher:   (b)         => req('POST', '/teachers', b),
  updateTeacher:   (id,b)      => req('PUT',  `/teachers/${id}`, b),

  // Classes
  getClasses:      ()          => req('GET',  '/classes'),
  getClass:        (id)        => req('GET',  `/classes/${id}`),
  createClass:     (b)         => req('POST', '/classes', b),
  updateClass:     (id,b)      => req('PUT',  `/classes/${id}`, b),
  getSubjects:     ()          => req('GET',  '/subjects'),
  createSubject:   (b)         => req('POST', '/subjects', b),

  // Attendance
  getAttendance:   (params='') => req('GET',  `/attendance?${params}`),
  getAttSummary:   (classId, params='') => req('GET', `/attendance/summary/${classId}?${params}`),
  markAttendance:  (b)         => req('POST', '/attendance', b),

  // Exams
  getExams:        (params='') => req('GET',  `/exams?${params}`),
  createExam:      (b)         => req('POST', '/exams', b),
  updateExam:      (id,b)      => req('PUT',  `/exams/${id}`, b),
  deleteExam:      (id)        => req('DELETE',`/exams/${id}`),
  getResults:      (params='') => req('GET',  `/results?${params}`),
  submitResults:   (b)         => req('POST', '/results', b),
  getPerformance:  (studentId) => req('GET',  `/results/performance/${studentId}`),

  // Timetable
  getTimetable:    (params='') => req('GET',  `/timetable?${params}`),
  saveTimetable:   (b)         => req('POST', '/timetable', b),
  getTeacherTT:    (id)        => req('GET',  `/timetable/teacher/${id}`),

  // Fees
  getFees:         (params='') => req('GET',  `/fees?${params}`),
  getFeeSummary:   ()          => req('GET',  '/fees/summary'),
  createFee:       (b)         => req('POST', '/fees', b),
  updateFee:       (id,b)      => req('PUT',  `/fees/${id}`, b),

  // Homework
  getHomework:     (params='') => req('GET',  `/homework?${params}`),
  createHomework:  (b)         => req('POST', '/homework', b),
  submitHomework:  (id,b)      => req('POST', `/homework/${id}/submit`, b),
  gradeHomework:   (id,sid,b)  => req('PUT',  `/homework/${id}/grade/${sid}`, b),

  // Library
  getBooks:        (params='') => req('GET',  `/library/books?${params}`),
  addBook:         (b)         => req('POST', '/library/books', b),
  getIssues:       (params='') => req('GET',  `/library/issues?${params}`),
  issueBook:       (b)         => req('POST', '/library/issue', b),
  returnBook:      (id)        => req('PUT',  `/library/return/${id}`),

  // Announcements
  getAnnouncements:()          => req('GET',  '/announcements'),
  createAnnouncement:(b)       => req('POST', '/announcements', b),
  deleteAnnouncement:(id)      => req('DELETE',`/announcements/${id}`),

  // Transport
  getRoutes:       ()          => req('GET',  '/transport/routes'),
  createRoute:     (b)         => req('POST', '/transport/routes', b),
  updateRoute:     (id,b)      => req('PUT',  `/transport/routes/${id}`, b),
  getTransportAssignments: ()  => req('GET',  '/transport/assignments'),
  assignTransport: (b)         => req('POST', '/transport/assign', b),

  // Leave
  getLeaves:       (params='') => req('GET',  `/leaves?${params}`),
  applyLeave:      (b)         => req('POST', '/leaves', b),
  reviewLeave:     (id,b)      => req('PUT',  `/leaves/${id}`, b),

  // Payroll
  getPayroll:      (params='') => req('GET',  `/payroll?${params}`),
  generatePayroll: (b)         => req('POST', '/payroll/generate', b),
  markPaid:        (id)        => req('PUT',  `/payroll/${id}/pay`),

  // Logs
  getLogs:         (params='') => req('GET',  `/logs?${params}`),

  // Talent
  getTalentTests:  (params='') => req('GET',  `/talent?${params}`),
  createTalentTest:(b)         => req('POST', '/talent', b),
  getTalentTest:   (id)        => req('GET',  `/talent/${id}`),

  // Registrations
  getRegistrations:()          => req('GET',  '/admin/registrations'),
  reviewRegistration:(id,b)    => req('PUT',  `/admin/registrations/${id}`, b),

  // Reports
  getReports:      ()          => req('GET',  '/reports/overview'),
};