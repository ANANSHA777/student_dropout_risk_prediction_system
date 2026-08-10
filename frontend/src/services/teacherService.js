// frontend/src/services/teacherService.js

const API_BASE = '/api/teacher';

// Helper to standardise authentication headers and safely extract token
const getHeaders = () => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token') || userObj?.token || userObj?.data?.token || '';

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// Helper to safely parse JSON responses and prevent empty response crashes
const handleResponse = async (res, defaultErrorMessage) => {
  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { message: text || 'Server error occurred' };
  }

  if (!res.ok) {
    throw new Error(data.message || defaultErrorMessage || `HTTP Error ${res.status}`);
  }

  return data;
};

// 1. Fetch Class Data
export const fetchTeacherClassData = async () => {
  const res = await fetch(`${API_BASE}/students`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to fetch teacher class data');
};

// 2. Create / Register Student
export const createStudent = async (studentData) => {
  const res = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(studentData),
  });
  return handleResponse(res, 'Failed to create student');
};

// 3. Update Student Academic Record (Marks & Attendance)
export const updateStudentAcademicRecord = async (studentId, recordData) => {
  const res = await fetch(`${API_BASE}/students/${studentId}/marks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(recordData),
  });
  return handleResponse(res, 'Failed to update academic record');
};

// 4. Trigger AI Risk Evaluation
export const triggerStudentRiskEvaluation = async (studentId) => {
  const res = await fetch(`${API_BASE}/risk/evaluate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ studentId }),
  });
  return handleResponse(res, 'Failed to trigger risk evaluation');
};

// 5. Assign Remedial Task or Peer Tutor
export const assignRemedialTask = async (studentId, taskData) => {
  const res = await fetch(`${API_BASE}/students/${studentId}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(res, 'Failed to assign remedial task');
};

// 6. Delete Student
export const deleteStudent = async (studentId) => {
  const res = await fetch(`${API_BASE}/students/${studentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to delete student');
};

// 7. Change Teacher Password
export const changeTeacherPassword = async (passwordData) => {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(passwordData),
  });
  return handleResponse(res, 'Failed to change password');
};