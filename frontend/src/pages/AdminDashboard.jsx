// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  HeartHandshake,
  BarChart3,
  Filter,
  KeyRound,
} from 'lucide-react';
import {
  fetchStaffMembers,
  createStaffMember,
  deleteStaffMember,
  fetchOverallRiskAnalytics,
  fetchAdminStudents,
} from '../services/adminService';
import { changePassword } from '../services/authService';
import AdminStats from '../components/AdminStats';
import StaffTable from '../components/StaffTable';
import AddStaffModal from '../components/AddStaffModal';
import StudentRosterTable from '../components/StudentRosterTable';
import RiskAnalyticsCharts from '../components/RiskAnalyticsCharts';
import ChangePasswordModal from '../components/ChangePasswordModal';

const DEPARTMENTS = ['All', 'Computer Science', 'Business', 'Mathematics', 'English', 'Architecture', 'Commerce'];
const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // Primary View Toggle: 'staff' | 'analytics'
  const [viewMode, setViewMode] = useState('staff');

  // Staff State
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState(null);

  // Modals & Feedback
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Staff Directory Tabs: 'all' | 'teachers' | 'counselors'
  const [activeStaffTab, setActiveStaffTab] = useState('all');
  const [staffDeptFilter, setStaffDeptFilter] = useState('All');

  // Student Risk & Analytics State
  const [analytics, setAnalytics] = useState({});
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  // Load Staff Directory
  const loadStaff = async () => {
    setStaffLoading(true);
    setStaffError(null);
    try {
      const data = await fetchStaffMembers();
      setStaffList(data);
    } catch (err) {
      setStaffError(err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  // Load Analytics & Student Roster
  const loadStudentAnalytics = async () => {
    setStudentsLoading(true);
    try {
      const [analyticsRes, studentsRes] = await Promise.all([
        fetchOverallRiskAnalytics(),
        fetchAdminStudents(selectedDept, selectedYear),
      ]);
      setAnalytics(analyticsRes.analytics || {});
      setStudents(studentsRes.students || []);
    } catch (err) {
      console.error('Error loading student analytics:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (viewMode === 'analytics') {
      loadStudentAnalytics();
    }
  }, [viewMode, selectedDept, selectedYear]);

  const showFeedback = (msg) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleAddStaff = async (staffData) => {
    try {
      const created = await createStaffMember({
        name: staffData.name,
        email: staffData.email,
        role: staffData.role,
        department: staffData.department,
        password: staffData.initialPassword,
      });
      setStaffList((prev) => [created, ...prev]);
      showFeedback(`${staffData.role} ${staffData.name} created successfully.`);
    } catch (err) {
      setStaffError(`Failed to create staff member: ${err.message}`);
    }
  };

  const handleDeleteStaff = async (id, name, role) => {
    if (!window.confirm(`Are you sure you want to remove ${role} ${name}?`)) return;
    try {
      await deleteStaffMember(id);
      setStaffList((prev) => prev.filter((s) => (s._id || s.id) !== id));
      showFeedback(`${role} ${name} removed from the system.`);
    } catch (err) {
      alert(`Error deleting staff: ${err.message}`);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (passwords) => {
    try {
      await changePassword(passwords);
      showFeedback('Password updated successfully.');
      setIsPasswordModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to update password');
    }
  };

  // Filter staff based on selected directory tab and department filter
  const filteredStaff = staffList.filter((s) => {
    const matchesTab =
      activeStaffTab === 'all'
        ? true
        : activeStaffTab === 'teachers'
        ? s.role === 'Teacher'
        : s.role === 'Counselor';

    const matchesDept = staffDeptFilter === 'All' || s.department === staffDeptFilter;
    return matchesTab && matchesDept;
  });

  const teacherCount = staffList.filter((s) => s.role === 'Teacher').length;
  const counselorCount = staffList.filter((s) => s.role === 'Counselor').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-purple-400" />
            System Administration Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <span className="text-purple-300 font-medium">{user?.name || 'Administrator'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'staff' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              <UserPlus size={16} />
              Add Staff Member
            </button>
          )}

          {/* Change Password Button */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <KeyRound size={16} className="text-purple-400" />
            Change Password
          </button>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Mode Toggle Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
        <button
          onClick={() => setViewMode('staff')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            viewMode === 'staff'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users size={18} /> Staff Management
        </button>

        <button
          onClick={() => setViewMode('analytics')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            viewMode === 'analytics'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 size={18} /> Student Risk & Department Analytics
        </button>
      </div>

      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 size={16} className="text-purple-400" />
          {actionFeedback}
        </div>
      )}

      {/* Error Feedback */}
      {staffError && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {staffError}
          </div>
          <button onClick={loadStaff} className="underline text-xs hover:text-white cursor-pointer">
            Retry
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto space-y-6">
        {/* MODE 1: STAFF MANAGEMENT */}
        {viewMode === 'staff' && (
          <>
            <AdminStats
              totalCount={staffList.length}
              teacherCount={teacherCount}
              counselorCount={counselorCount}
            />

            {/* Directory Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => {
                  setActiveStaffTab('all');
                  setStaffDeptFilter('All');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeStaffTab === 'all'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Users size={16} /> All Staff ({staffList.length})
              </button>

              <button
                onClick={() => {
                  setActiveStaffTab('teachers');
                  setStaffDeptFilter('All');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeStaffTab === 'teachers'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <GraduationCap size={16} /> Teachers ({teacherCount})
              </button>

              <button
                onClick={() => {
                  setActiveStaffTab('counselors');
                  setStaffDeptFilter('All');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeStaffTab === 'counselors'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <HeartHandshake size={16} /> Counselors ({counselorCount})
              </button>
            </div>

            {/* Directory View Table */}
            <StaffTable
              filteredStaff={filteredStaff}
              loading={staffLoading}
              activeTab={activeStaffTab}
              deptFilter={staffDeptFilter}
              setDeptFilter={setStaffDeptFilter}
              onRefresh={loadStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          </>
        )}

        {/* MODE 2: STUDENT RISK ANALYTICS & DEPARTMENT ROSTER */}
        {viewMode === 'analytics' && (
          <div className="space-y-8">
            {/* VISUAL RISK ANALYTICS CHARTS */}
            <RiskAnalyticsCharts analytics={analytics} />

            {/* OVERALL RISK MATRIX (BY DEPARTMENT & YEAR) */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-indigo-400" size={20} />
                <h2 className="text-lg font-bold text-white">Overall Department & Year-Wise Risk Breakdown</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-3">Department</th>
                      <th className="p-3">Year of Study</th>
                      <th className="p-3">Total</th>
                      <th className="p-3 text-red-400">High Risk</th>
                      <th className="p-3 text-amber-400">Medium Risk</th>
                      <th className="p-3 text-emerald-400">Low Risk</th>
                      <th className="p-3 text-slate-400">Unevaluated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {Object.keys(analytics).length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-slate-500 italic">
                          No risk analytics data available.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(analytics).flatMap(([dept, years]) =>
                        Object.entries(years).map(([year, stats]) => (
                          <tr key={`${dept}-${year}`} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-semibold text-slate-200">{dept}</td>
                            <td className="p-3 text-indigo-400 font-medium">{year}</td>
                            <td className="p-3 font-bold text-white">{stats.total}</td>
                            <td className="p-3 text-red-400 font-semibold">{stats.highRisk}</td>
                            <td className="p-3 text-amber-400 font-semibold">{stats.mediumRisk}</td>
                            <td className="p-3 text-emerald-400 font-semibold">{stats.lowRisk}</td>
                            <td className="p-3 text-slate-400">{stats.unevaluated}</td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* READ-ONLY FILTERED STUDENT ROSTER VIEW */}
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Filter size={16} className="text-indigo-400" />
                  Filter Students by Department & Year:
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Department Filter */}
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        Department: {dept}
                      </option>
                    ))}
                  </select>

                  {/* Year Filter */}
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        Year: {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <StudentRosterTable
                students={students}
                loading={studentsLoading}
                showActions={false}
              />
            </section>
          </div>
        )}
      </main>

      {/* Provision Staff Account Modal */}
      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStaffAdded={handleAddStaff}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
}