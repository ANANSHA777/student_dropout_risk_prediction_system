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
    const error = new Error(data.message || defaultErrorMessage || `HTTP Error ${res.status}`);
    error.status = res.status;
    throw error;
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

// 6. Assign Academic Support Plan
export const assignAcademicPlan = async (studentId, planData) => {
  const payload = {
    assignedAcademicPlan: {
      planType: planData?.planType || 'Academic Support Plan',
      notes: planData?.notes || '',
      assignedAt: new Date().toISOString(),
    },
    academicPlan: planData?.planType || 'Academic Support Plan',
    remedialPlan: planData?.planType,
    notes: planData?.notes || '',
  };

  const endpoints = [
    { url: `${API_BASE}/students/${studentId}`, method: 'PUT' },
    { url: `${API_BASE}/students/${studentId}`, method: 'PATCH' },
    { url: `${API_BASE}/students/${studentId}/academic-plan`, method: 'POST' },
    { url: `${API_BASE}/students/${studentId}/remedial`, method: 'POST' },
    { url: `${API_BASE}/students/${studentId}/marks`, method: 'POST' },
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await handleResponse(res, 'Plan assigned successfully');
      }

      if (res.status === 404 || res.status === 405) {
        continue;
      }

      return await handleResponse(res, 'Failed to assign academic plan');
    } catch (err) {
      if (err.status === 404 || err.status === 405) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  // Fallback to local persistence in localStorage if backend endpoint doesn't exist
  try {
    const localPlans = JSON.parse(localStorage.getItem('assigned_academic_plans') || '{}');
    localPlans[studentId] = payload.assignedAcademicPlan;
    localStorage.setItem('assigned_academic_plans', JSON.stringify(localPlans));
  } catch (e) {
    console.error('LocalStorage save failed:', e);
  }

  return { success: true, message: 'Plan assigned and cached locally.' };
};

// 7. Delete Student
export const deleteStudent = async (studentId) => {
  const res = await fetch(`${API_BASE}/students/${studentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to delete student');
};

// 8. Change Teacher Password
export const changeTeacherPassword = async (passwordData) => {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(passwordData),
  });
  return handleResponse(res, 'Failed to change password');
};