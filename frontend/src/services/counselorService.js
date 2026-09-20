const API_BASE_URL = '/api/counselor';

const getAuthHeaders = () => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token') || userObj?.token || userObj?.data?.token || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const fetchCounselorCases = async () => {
  const res = await fetch(`${API_BASE_URL}/cases`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch counseling cases');
  return data.cases || data;
};

export const logInterventionNote = async (studentId, interventionData) => {
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/intervention`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(interventionData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to log intervention note');
  return data;
};

export const updateCaseStatus = async (studentId, status) => {
  const res = await fetch(`${API_BASE_URL}/students/${studentId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update case status');
  return data;
};

export const scheduleCounselingSession = async (studentId, { date, time, notes }) => {
  const res = await fetch(`${API_BASE_URL}/schedule-session`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentId, date, time, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to schedule counseling session');
  return data;
};

export const completeCounselingSession = async (studentId, { completion_notes }) => {
  const res = await fetch(`${API_BASE_URL}/complete-session`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentId, completion_notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to complete counseling session');
  return data;
};