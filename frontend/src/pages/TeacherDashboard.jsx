// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, CheckCircle2, AlertCircle, KeyRound, Calendar } from 'lucide-react';
import {
  fetchTeacherClassData,
  updateStudentAcademicRecord,
  triggerStudentRiskEvaluation,
  deleteStudent,
  changeTeacherPassword,
} from '../services/teacherService';
import TeacherStats from '../components/TeacherStats';
import StudentRosterTable from '../components/StudentRosterTable';
import RecordEntryModal from '../components/RecordEntryModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const TeacherDashboard = () => {
  const { user, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [evaluatingStudentId, setEvaluatingStudentId] = useState(null);

  // Year of Study Filter State
  const [yearFilter, setYearFilter] = useState('All');

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTeacherClassData();
      const studentList = Array.isArray(response)
        ? response
        : response?.students || response?.data || [];
      setStudents(studentList);
    } catch (err) {
      setError(err.message || 'Failed to load class data.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Open Academic Details Entry Modal
  const handleOpenRecordModal = (student) => {
    setSelectedStudent(student);
    setIsRecordModalOpen(true);
  };

  // Save Academic Record ONLY
  const handleSaveRecord = async (studentId, recordData) => {
    try {
      await updateStudentAcademicRecord(studentId, recordData);
      await loadData(); // Refresh list to display updated CGPA & Attendance
      showFeedback('Academic details updated successfully.');
    } catch (err) {
      setError(`Failed to update academic record: ${err.message}`);
    }
  };

  // Trigger AI Risk Evaluation (Updates database record and reloads data)
  const handleEvaluateRisk = async (studentId) => {
    setEvaluatingStudentId(studentId);
    setError(null);
    try {
      const result = await triggerStudentRiskEvaluation(studentId);
      await loadData();
      
      const cat = result?.riskCategory || result?.data?.riskCategory;
      if (cat && cat !== 'None') {
        showFeedback(`AI Risk Evaluation completed: ${result?.riskLevel || ''} Risk (${cat}).`);
      } else {
        showFeedback('AI risk level evaluation updated successfully.');
      }
    } catch (err) {
      setError(`AI Evaluation Error: ${err.message}`);
    } finally {
      setEvaluatingStudentId(null);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (studentId, studentName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete student "${studentName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteStudent(studentId);
      await loadData();
      showFeedback(`Student "${studentName}" deleted successfully.`);
    } catch (err) {
      setError(`Failed to delete student: ${err.message}`);
    }
  };

  // Change Teacher Password
  const handleChangePassword = async (passwordData) => {
    await changeTeacherPassword(passwordData);
    showFeedback('Password changed successfully.');
  };

  // Filter students based on selected Year of Study
  const filteredStudents = useMemo(() => {
    if (yearFilter === 'All') return students;

    const normalizedFilter = yearFilter.trim().toLowerCase();
    return students.filter((student) => {
      const studentYear = (student.yearOfStudy || student.year || '').trim().toLowerCase();
      return studentYear === normalizedFilter;
    });
  }, [students, yearFilter]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-indigo-400" />
            Teacher Academic Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <span className="text-indigo-300 font-medium">{user?.name || 'Faculty Member'}</span>
            {user?.department && (
              <span className="text-slate-500 font-normal"> • {user.department} Dept</span>
            )}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-indigo-300 px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <KeyRound size={16} />
            Change Password
          </button>
          <button
            onClick={logout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={16} className="text-red-400" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {feedback && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 size={16} className="text-indigo-400" />
          {feedback}
        </div>
      )}

      {/* Error Feedback */}
      {error && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
          <button onClick={loadData} className="underline text-xs hover:text-white cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-6">
        <TeacherStats students={students} />

        {/* Year of Study Filter Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Calendar size={16} className="text-indigo-400" />
              Filter Class Roster by Year of Study:
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Years ({students.length})</option>
              {YEAR_OPTIONS.map((year) => {
                const count = students.filter(
                  (s) => (s.yearOfStudy || s.year || '').trim().toLowerCase() === year.toLowerCase()
                ).length;
                return (
                  <option key={year} value={year}>
                    {year} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <StudentRosterTable
            students={filteredStudents}
            loading={loading}
            evaluatingStudentId={evaluatingStudentId}
            onOpenRecordModal={handleOpenRecordModal}
            onDeleteStudent={handleDeleteStudent}
            onEvaluateRisk={handleEvaluateRisk}
          />
        </div>
      </main>

      {/* Academic Record Entry Modal */}
      <RecordEntryModal
        isOpen={isRecordModalOpen}
        student={selectedStudent}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};

export default TeacherDashboard;