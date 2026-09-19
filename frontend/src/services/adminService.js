// frontend/src/services/adminService.js

const API_BASE_URL = '/api/admin';

// Helper to standardise authentication headers and safely extract token
const getAuthHeaders = () => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token') || userObj?.token || userObj?.data?.token || '';

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// 1. Fetch Staff Members (Teachers & Counselors)
export const fetchStaffMembers = async () => {
  const res = await fetch(`${API_BASE_URL}/staff`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch staff members');
  return data.staff || data;
};

// 2. Create Staff Member
export const createStaffMember = async (staffData) => {
  const res = await fetch(`${API_BASE_URL}/staff`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(staffData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create staff account');
  return data.staff || data;
};

// 3. Delete Staff Member
export const deleteStaffMember = async (id) => {
  const res = await fetch(`${API_BASE_URL}/staff/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to delete staff member');
  }
};

// 4. Fetch Overall Risk Analytics (Grouped by Department & Year of Study)
export const fetchOverallRiskAnalytics = async () => {
  const res = await fetch(`${API_BASE_URL}/risk-analytics`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch overall risk analytics');
  return data;
};

// 5. Fetch Filtered Student Roster for Admin
export const fetchAdminStudents = async (department = 'All', yearOfStudy = 'All') => {
  const queryParams = new URLSearchParams({ department, yearOfStudy }).toString();
  const res = await fetch(`${API_BASE_URL}/students?${queryParams}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch filtered student roster');
  return data;
};

// 6. Update Student Financial Relief Status (Admin)
export const updateFinancialReliefStatus = async (studentId, status, notes = '') => {
  const res = await fetch(`${API_BASE_URL}/financial-relief/update-status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentId, status, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update financial relief status');
  return data;
};

// 7. Download Institutional Summary Report (CSV / PDF)
export const downloadInstitutionReport = async (format = 'csv') => {
  const res = await fetch(`/api/reports/export?format=${format}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to export institution report');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `institution_risk_report_${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'csv'}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};