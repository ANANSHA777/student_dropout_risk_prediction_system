const API_BASE_URL = '/api/student';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const fetchStudentProfileData = async () => {
  const res = await fetch(`${API_BASE_URL}/profile`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch student data');
  return data.profile || data;
};

export const submitSelfAssessmentSurvey = async (surveyData) => {
  const res = await fetch(`${API_BASE_URL}/survey`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(surveyData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit self-assessment');
  return data;
};

export const uploadFinancialDocument = async (docData) => {
  const res = await fetch(`${API_BASE_URL}/upload-document`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(docData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to upload document');
  return data;
};

export const fetchDashboardSummary = async () => {
  const res = await fetch(`${API_BASE_URL}/dashboard-summary`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch dashboard summary');
  return data.profile || data;
};

export const confirmCounselingSession = async () => {
  const res = await fetch(`${API_BASE_URL}/confirm-session`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to confirm counseling session');
  return data;
};