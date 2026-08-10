const API_BASE_URL = '/api/counselor';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

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