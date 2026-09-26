// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
  DollarSign,
  Download,
  Loader2,
  FileText,
  Check,
  Eye,
} from 'lucide-react';
import {
  fetchStaffMembers,
  createStaffMember,
  deleteStaffMember,
  fetchOverallRiskAnalytics,
  fetchAdminStudents,
  updateFinancialReliefStatus,
  downloadInstitutionReport,
} from '../services/adminService';
import { changePassword } from '../services/authService';
import AdminStats from '../components/AdminStats';
import StaffTable from '../components/StaffTable';
import AddStaffModal from '../components/AddStaffModal';
import StudentRosterTable from '../components/StudentRosterTable';
import RiskAnalyticsCharts from '../components/RiskAnalyticsCharts';
import ChangePasswordModal from '../components/ChangePasswordModal';
import StudentDetailModal from '../components/StudentDetailModal';

const DEPARTMENTS = ['All', 'Computer Science', 'Business', 'Mathematics', 'English', 'Architecture', 'Commerce'];
const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // Primary View Toggle: 'staff' | 'analytics' | 'financial'
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
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Financial Relief & Reports State
  const [updatingReliefId, setUpdatingReliefId] = useState(null);
  const [exportingReport, setExportingReport] = useState(false);

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
      setSelectedStudentForDetail((prev) => {
        if (!prev) return null;
        const fresh = (studentsRes.students || []).find(
          (s) => (s._id || s.id || s.studentId) === (prev._id || prev.id || prev.studentId)
        );
        return fresh || prev;
      });
    } catch (err) {
      console.error('Error loading student analytics:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    loadStudentAnalytics();
  }, []);

  useEffect(() => {
    if (viewMode === 'analytics' || viewMode === 'financial') {
      loadStudentAnalytics();
    }
  }, [viewMode, selectedDept, selectedYear]);

  /**
   * Helper: Aggregates student roster metrics if backend analytics omit departments
   * with 0 High-Risk students (e.g. Architecture, Business).
   */
  const mergedAnalytics = useMemo(() => {
    const copy = JSON.parse(JSON.stringify(analytics || {}));

    if (students && students.length > 0) {
      students.forEach((student) => {
        const dept = student.department || 'Unassigned';
        const year = student.year || student.yearOfStudy || 'General';

        if (!copy[dept]) {
          copy[dept] = {};
        }

        if (!copy[dept][year]) {
          copy[dept][year] = {
            total: 0,
            highRisk: 0,
            mediumRisk: 0,
            lowRisk: 0,
            unevaluated: 0,
          };
        }

        // If backend analytics did not include this student count already
        // calculate from live roster
        const risk = (student.riskLevel || student.risk || '').toLowerCase();
        const currentStats = copy[dept][year];

        // Ensure totals are not zero when student records exist
        if (currentStats.total === 0) {
          if (risk.includes('high')) currentStats.highRisk += 1;
          else if (risk.includes('medium') || risk.includes('moderate')) currentStats.mediumRisk += 1;
          else if (risk.includes('low') || risk.includes('safe') || risk.includes('normal')) currentStats.lowRisk += 1;
          else currentStats.unevaluated += 1;

          currentStats.total += 1;
        }
      });
    }

    return copy;
  }, [analytics, students]);

  const financialRequests = useMemo(() => {
    return students.filter((s) => {
      const status = (s.financial_relief_status || '').toUpperCase();
      return (
        ['REQUESTED', 'DOCUMENTS_REQUIRED', 'APPROVED', 'DISBURSED', 'REJECTED'].includes(status) ||
        s.financialAidStatus === 'Pending Institutional Support' ||
        s.collegeFinancialAid?.status === 'Pending Institutional Support'
      );
    });
  }, [students]);

  const pendingReliefCount = useMemo(() => {
    return financialRequests.filter((s) => {
      const status = (s.financial_relief_status || '').toUpperCase();
      return (
        status === 'REQUESTED' ||
        status === 'DOCUMENTS_REQUIRED' ||
        s.financialAidStatus === 'Pending Institutional Support'
      );
    }).length;
  }, [financialRequests]);

  const handleUpdateReliefStatus = async (studentId, status, studentName) => {
    setUpdatingReliefId(studentId);
    try {
      await updateFinancialReliefStatus(studentId, status, `Admin updated financial relief status to ${status}`);
      await loadStudentAnalytics();
      showFeedback(`Financial relief status for ${studentName || 'student'} updated to "${status}".`);
    } catch (err) {
      showFeedback(`Error updating status: ${err.message}`);
    } finally {
      setUpdatingReliefId(null);
    }
  };

  const handleDownloadReport = async () => {
    setExportingReport(true);
    try {
      await downloadInstitutionReport('csv');
      showFeedback('Institution Risk Report downloaded successfully (CSV).');
    } catch (err) {
      showFeedback(`Failed to download report: ${err.message}`);
    } finally {
      setExportingReport(false);
    }
  };

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

  const handleOpenDetailModal = (student) => {
    setSelectedStudentForDetail(student);
    setIsDetailModalOpen(true);
  };

  const teacherCount = staffList.filter((s) => s.role === 'Teacher').length;
  const counselorCount = staffList.filter((s) => s.role === 'Counselor').length;

  // Multi-Role Intervention Resolution Tracking Stats
  const counselingStats = useMemo(() => {
    let totalAssigned = 0;
    let completed = 0;
    (students || []).forEach((s) => {
      const hasCounselor = s.assigned_counselor_id || s.assignedCounselor || s.counseling_session;
      if (hasCounselor) {
        totalAssigned += 1;
        if (s.counseling_session?.status === 'COMPLETED') {
          completed += 1;
        }
      }
    });
    return { completed, total: totalAssigned };
  }, [students]);

  const academicPlanStats = useMemo(() => {
    let totalAssigned = 0;
    let completed = 0;
    (students || []).forEach((s) => {
      const plan = s.academic_remedial_plan;
      const status = (plan?.status || (s.assignedAcademicPlan ? 'IN_PROGRESS' : '')).toUpperCase();
      if (status && status !== 'NOT_REQUIRED') {
        totalAssigned += 1;
        if (status === 'COMPLETED') {
          completed += 1;
        }
      }
    });
    return { completed, total: totalAssigned };
  }, [students]);

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
          {/* Download Institution Reports Button */}
          <button
            onClick={handleDownloadReport}
            disabled={exportingReport}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            title="Download full institutional student dropout risk CSV report"
          >
            {exportingReport ? (
              <Loader2 size={16} className="animate-spin text-emerald-400" />
            ) : (
              <Download size={16} className="text-emerald-400" />
            )}
            <span>{exportingReport ? 'Generating...' : 'Download Reports'}</span>
          </button>

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
      <div className="max-w-7xl mx-auto mb-6 flex items-center gap-3 border-b border-slate-800 pb-4 flex-wrap">
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
          {counselingStats.total > 0 && (
            <span
              className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-500/40"
              title="Completed Counseling Sessions"
            >
              Sessions: {counselingStats.completed}/{counselingStats.total}
            </span>
          )}
          {academicPlanStats.total > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-500/40"
              title="Resolved Academic Plans"
            >
              Plans: {academicPlanStats.completed}/{academicPlanStats.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setViewMode('financial')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            viewMode === 'financial'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <DollarSign size={18} /> Pending Financial Relief Requests
          {pendingReliefCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
              {pendingReliefCount}
            </span>
          )}
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
            {/* MULTI-ROLE INTERVENTION GOVERNANCE & RESOLUTION KPI BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Counseling Sessions Resolved Badge */}
              <div className="bg-slate-900 border border-purple-500/30 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block">
                    Counseling Case Resolution
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">
                      {counselingStats.completed}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
                      / {counselingStats.total} Sessions Resolved
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${counselingStats.total > 0 ? (counselingStats.completed / counselingStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <HeartHandshake size={22} />
                </div>
              </div>

              {/* Academic Remedial Plans Resolved Badge */}
              <div className="bg-slate-900 border border-blue-500/30 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block">
                    Remedial Plans Resolved
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">
                      {academicPlanStats.completed}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
                      / {academicPlanStats.total} Plans Completed
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${academicPlanStats.total > 0 ? (academicPlanStats.completed / academicPlanStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <GraduationCap size={22} />
                </div>
              </div>

              {/* Pending Financial Relief Requests Badge */}
              <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">
                    Pending Financial Aid
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-amber-300">
                      {pendingReliefCount}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
                      / {financialRequests.length} Applications
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${financialRequests.length > 0 ? ((financialRequests.length - pendingReliefCount) / financialRequests.length) * 100 : 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <DollarSign size={22} />
                </div>
              </div>

              {/* Faculty & Staff Active Oversight Badge */}
              <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">
                    Staff Oversight
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">
                      {staffList.length}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
                      Active Educators
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 truncate">
                    {teacherCount} Teachers • {counselorCount} Counselors
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users size={22} />
                </div>
              </div>
            </div>

            {/* VISUAL RISK ANALYTICS CHARTS */}
            <RiskAnalyticsCharts analytics={mergedAnalytics} />

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
                    {Object.keys(mergedAnalytics).length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-slate-500 italic">
                          No risk analytics data available.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(mergedAnalytics).flatMap(([dept, years]) =>
                        Object.entries(years).map(([year, stats]) => (
                          <tr key={`${dept}-${year}`} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-semibold text-slate-200">{dept}</td>
                            <td className="p-3 text-indigo-400 font-medium">{year}</td>
                            <td className="p-3 font-bold text-white">{stats.total ?? 0}</td>
                            <td className="p-3 text-red-400 font-semibold">{stats.highRisk ?? 0}</td>
                            <td className="p-3 text-amber-400 font-semibold">{stats.mediumRisk ?? 0}</td>
                            <td className="p-3 text-emerald-400 font-semibold">{stats.lowRisk ?? 0}</td>
                            <td className="p-3 text-slate-400">{stats.unevaluated ?? 0}</td>
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
                onOpenDetailModal={handleOpenDetailModal}
              />
            </section>
          </div>
        )}

        {/* MODE 3: PENDING FINANCIAL RELIEF REQUESTS */}
        {viewMode === 'financial' && (
          <div className="space-y-6">
            {/* Financial Relief Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="text-xs text-slate-400 font-semibold uppercase">Total Aid Applications</div>
                <div className="text-2xl font-bold text-white mt-1">{financialRequests.length}</div>
              </div>
              <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-xl">
                <div className="text-xs text-amber-400 font-semibold uppercase">Pending Requests</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">
                  {financialRequests.filter(s => (s.financial_relief_status || '').toUpperCase() === 'REQUESTED' || s.financialAidStatus === 'Pending Institutional Support').length}
                </div>
              </div>
              <div className="bg-slate-900 border border-purple-500/30 p-5 rounded-xl">
                <div className="text-xs text-purple-400 font-semibold uppercase">Documents Required</div>
                <div className="text-2xl font-bold text-purple-300 mt-1">
                  {financialRequests.filter(s => (s.financial_relief_status || '').toUpperCase() === 'DOCUMENTS_REQUIRED').length}
                </div>
              </div>
              <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-xl">
                <div className="text-xs text-emerald-400 font-semibold uppercase">Approved / Disbursed</div>
                <div className="text-2xl font-bold text-emerald-300 mt-1">
                  {financialRequests.filter(s => ['APPROVED', 'DISBURSED'].includes((s.financial_relief_status || '').toUpperCase())).length}
                </div>
              </div>
            </div>

            {/* Financial Requests Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <DollarSign size={20} />
                  <h2 className="text-lg font-bold text-white">Pending Financial Relief Requests & Verification</h2>
                </div>
                <span className="text-xs text-slate-400">
                  Showing <strong className="text-white">{financialRequests.length}</strong> relief cases
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-3">Student</th>
                      <th className="p-3">Dept / Year</th>
                      <th className="p-3">Relief Status</th>
                      <th className="p-3">Proof Documents</th>
                      <th className="p-3 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {financialRequests.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500 italic text-xs">
                          No active or pending financial relief requests found. When teachers request college funds for students, they will appear here.
                        </td>
                      </tr>
                    ) : (
                      financialRequests.map((student) => {
                        const sId = student._id || student.id;
                        const rawStatus = (student.financial_relief_status || (student.financialAidStatus === 'Pending Institutional Support' ? 'REQUESTED' : 'NONE')).toUpperCase();
                        const isUpdating = updatingReliefId === sId;
                        const docs = student.financial_documents || [];

                        return (
                          <tr key={sId} className="hover:bg-slate-800/40 transition">
                            <td className="p-3">
                              <div className="font-bold text-white">{student.name}</div>
                              <div className="text-xs text-slate-400">{student.studentId || student.rollNo || 'STU'} • {student.email}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-xs text-slate-300">{student.department || 'General'}</div>
                              <div className="text-xs text-indigo-400">{student.yearOfStudy || student.year || '1st Year'}</div>
                            </td>
                            <td className="p-3">
                              <span className={`inline-block px-3 py-1 text-xs rounded-full font-bold border ${
                                rawStatus === 'REQUESTED'
                                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 animate-pulse'
                                  : rawStatus === 'DOCUMENTS_REQUIRED'
                                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                                  : rawStatus === 'APPROVED' || rawStatus === 'DISBURSED'
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                  : 'bg-red-950/60 text-red-300 border-red-500/40'
                              }`}>
                                {rawStatus}
                              </span>
                            </td>
                            <td className="p-3">
                              {docs.length === 0 ? (
                                <span className="text-xs text-slate-500 italic">No files uploaded</span>
                              ) : (
                                <div className="space-y-1">
                                  {docs.map((doc, dIdx) => (
                                    <a
                                      key={dIdx}
                                      href={doc.fileData || doc.url || '#'}
                                      download={doc.filename || `document_${dIdx + 1}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium bg-slate-950/50 px-2 py-1 rounded border border-slate-800 hover:border-indigo-500/50"
                                      title={`Uploaded ${doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}`}
                                    >
                                      <FileText size={12} className="shrink-0" />
                                      <span className="max-w-[150px] truncate">{doc.filename || 'Proof Document'}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                {/* Request Documents */}
                                {rawStatus !== 'DOCUMENTS_REQUIRED' && rawStatus !== 'DISBURSED' && (
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateReliefStatus(sId, 'DOCUMENTS_REQUIRED', student.name)}
                                    className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-700/50 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50"
                                  >
                                    Request Documents
                                  </button>
                                )}

                                {/* Approve & Disburse */}
                                {rawStatus !== 'DISBURSED' && (
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateReliefStatus(sId, 'DISBURSED', student.name)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                                  >
                                    <Check size={13} />
                                    Approve & Disburse Funds
                                  </button>
                                )}

                                {/* Reject Request */}
                                {rawStatus !== 'REJECTED' && (
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateReliefStatus(sId, 'REJECTED', student.name)}
                                    className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-700/50 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50"
                                  >
                                    Reject Request
                                  </button>
                                )}

                                {/* Details & Audit Log */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetailModal(student)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <Eye size={13} />
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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

      {/* Student Details & Audit History Modal */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStudentForDetail(null);
        }}
        onUpdateSuccess={() => {
          loadStudentAnalytics();
        }}
      />
    </div>
  );
}