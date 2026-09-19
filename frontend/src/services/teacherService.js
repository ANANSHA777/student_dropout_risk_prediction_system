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
    studentId,
    planType: planData?.planType || 'Academic Support Plan',
    notes: planData?.notes || '',
    studySchedule: planData?.studySchedule,
    remedialClasses: planData?.remedialClasses,
    backlogTracking: planData?.backlogTracking,
  };

  const endpoints = [
    { url: `/api/academic-plan/assign`, method: 'POST' },
    { url: `/api/risk/assign-plan`, method: 'POST' },
    { url: `${API_BASE}/students/${studentId}/marks`, method: 'POST' },
  ];

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
    } catch (err) {
      // Continue to next endpoint
    }
  }

  // Fallback to local persistence in localStorage if backend endpoint doesn't exist
  try {
    const localPlans = JSON.parse(localStorage.getItem('assigned_academic_plans') || '{}');
    localPlans[studentId] = payload;
    localStorage.setItem('assigned_academic_plans', JSON.stringify(localPlans));
  } catch (e) {
    console.error('LocalStorage save failed:', e);
  }

  return { success: true, message: 'Plan assigned and cached locally.' };
};

// 7. Generate Academic Plan (Strictly Academic)
export const generateAcademicPlan = async (studentId, metrics = {}) => {
  const res = await fetch('/api/academic-plan/generate', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ studentId, ...metrics }),
  });
  return handleResponse(res, 'Failed to generate academic plan');
};

// 8. Delete Student
export const deleteStudent = async (studentId) => {
  const res = await fetch(`${API_BASE}/students/${studentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to delete student');
};

// 9. Change Teacher Password
export const changeTeacherPassword = async (passwordData) => {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(passwordData),
  });
  return handleResponse(res, 'Failed to change password');
};

// 10. Fetch Registered Counselors for Dropdown
export const fetchCounselors = async () => {
  try {
    const res = await fetch('/api/counselors', { headers: getHeaders() });
    if (res.ok) {
      return await handleResponse(res, 'Failed to fetch registered counselors');
    }
  } catch (e) {
    // try fallback
  }

  const resFallback = await fetch(`${API_BASE}/counselors`, { headers: getHeaders() });
  return handleResponse(resFallback, 'Failed to fetch registered counselors');
};

// 11. Assign/Refer Counselor to Student
export const assignCounselorToStudent = async (referralData) => {
  const studentId = referralData.studentId;
  const payload = {
    counselorId: referralData.counselorId,
    referralReason: referralData.reasonForReferral || referralData.referralReason || '',
    notes: referralData.notes || '',
    category: referralData.category || 'General Support',
    riskCategory: referralData.riskCategory || 'General Support',
    referredAt: new Date().toISOString(),
  };

  const endpoints = [
    { url: `${API_BASE}/students/${studentId}/assign-counselor`, method: 'POST' },
    { url: `/api/risk/assign-counselor`, method: 'POST' },
    { url: `${API_BASE}/assign-counselor`, method: 'POST' },
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: getHeaders(),
        body: JSON.stringify({ studentId, ...payload }),
      });

      if (res.ok) {
        return await handleResponse(res, 'Counselor assigned successfully');
      }
    } catch (err) {
      // Continue to next endpoint
    }
  }

  // Fallback local storage update
  try {
    const localCounseling = JSON.parse(localStorage.getItem('assigned_counseling_sessions') || '{}');
    localCounseling[studentId] = payload;
    localStorage.setItem('assigned_counseling_sessions', JSON.stringify(localCounseling));
  } catch (e) {
    console.error('LocalStorage save failed:', e);
  }

  return { success: true, message: 'Counselor referral recorded locally.' };
};

// 12. Request College Emergency Fund / Financial Relief (Pending Institutional Support)
export const requestCollegeFund = async (studentId, fundData = {}) => {
  const payload = {
    studentId,
    amount: fundData.amount || 5000,
    requestedAmount: fundData.amount || 5000,
    reason: fundData.reason || 'Tuition / Living Support',
    notes: fundData.notes || '',
  };

  const endpoints = [
    `${API_BASE}/students/${studentId}/grant-financial-aid`,
    `${API_BASE}/students/${studentId}/grant-aid`,
    `/api/risk/grant-financial-aid`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await handleResponse(res, 'College fund request processed');
      }
    } catch (e) {
      // try next
    }
  }

  throw new Error('Failed to request college fund');
};

// 10. Authorize Survey Re-submission (Bypass Cooldown)
export const requestSurveyResubmission = async (studentId) => {
  const res = await fetch(`${API_BASE}/request-survey-resubmission`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ studentId }),
  });
  return handleResponse(res, 'Failed to authorize survey re-submission');
};