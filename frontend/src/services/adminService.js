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