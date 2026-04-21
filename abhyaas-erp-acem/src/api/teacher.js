// frontend/src/api/teacher.js
import { API_URL } from '../config/apiConfig';
const BASE_URL = `${API_URL}/teacher`;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const fetchTeacherStats = async () => {
  const res = await fetch(`${BASE_URL}/dashboard/stats`, { headers: getHeaders() });
  return res.json();
};

export const fetchTeacherActivity = async () => {
  const res = await fetch(`${BASE_URL}/dashboard/activity`, { headers: getHeaders() });
  return res.json();
};