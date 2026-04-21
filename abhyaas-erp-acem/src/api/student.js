// // frontend/src/api/student.js
// const BASE_URL = 'http://localhost:5000/api/student';

// const getHeaders = () => ({
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${localStorage.getItem('token')}`
// });

// export const fetchStudentStats = async () => {
//   const res = await fetch(`${BASE_URL}/dashboard/stats`, { headers: getHeaders() });
//   return res.json();
// };

// export const fetchStudentActivity = async () => {
//   const res = await fetch(`${BASE_URL}/dashboard/activity`, { headers: getHeaders() });
//   return res.json();
// };

import { API_URL } from '../config/apiConfig';
const BASE_URL = `${API_URL}/student`;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const fetchStudentStats = async () => (await fetch(`${BASE_URL}/dashboard/stats`, { headers: getHeaders() })).json();
export const fetchStudentActivity = async () => (await fetch(`${BASE_URL}/dashboard/activity`, { headers: getHeaders() })).json();
export const fetchStudentProfile = async () => (await fetch(`${BASE_URL}/profile`, { headers: getHeaders() })).json();

// 🟢 NEW: Dedicated endpoints that safely find the student's real DB ID
export const fetchStudentFees = async () => (await fetch(`${BASE_URL}/my-fees`, { headers: getHeaders() })).json();
export const fetchStudentExams = async () => (await fetch(`${BASE_URL}/my-results`, { headers: getHeaders() })).json();