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
  assignAcademicPlan,
  assignCounselorToStudent,
  requestCollegeFund,
} from '../services/teacherService';
import TeacherStats from '../components/TeacherStats';
import StudentRosterTable from '../components/StudentRosterTable';
import RecordEntryModal from '../components/RecordEntryModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import AcademicPlanModal from '../components/AcademicPlanModal';
import CounselorAssignmentModal from '../components/CounselorAssignmentModal';
import StudentDetailModal from '../components/StudentDetailModal';
import GrantFinancialAidModal from '../components/GrantFinancialAidModal';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const TeacherDashboard = () => {
  const { user, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [evaluatingStudentId, setEvaluatingStudentId] = useState(null);

  // Filter State
  const [yearFilter, setYearFilter] = useState('All');

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAcademicPlanModalOpen, setIsAcademicPlanModalOpen] = useState(false);
  const [isCounselorModalOpen, setIsCounselorModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFinancialAidModalOpen, setIsFinancialAidModalOpen] = useState(false);
  
  const [selectedStudentForPlan, setSelectedStudentForPlan] = useState(null);
  const [selectedStudentForCounselor, setSelectedStudentForCounselor] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [selectedStudentForAid, setSelectedStudentForAid] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Fetch Class Roster & Synchronize Local Overrides
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTeacherClassData();
      let studentList = Array.isArray(response)
        ? response
        : response?.students || response?.data || [];

      // Read persistent local state overrides to retain custom assignments on reloads
      let localPlans = {};
      let localCounseling = {};
      try {
        localPlans = JSON.parse(localStorage.getItem('assigned_academic_plans') || '{}');
        localCounseling = JSON.parse(localStorage.getItem('assigned_counseling_sessions') || '{}');
      } catch (e) {
        localPlans = {};
        localCounseling = {};
      }

      // Merge API list with local cache state
      studentList = studentList.map((s) => {
        const id = s._id || s.id || s.studentId;
        const storedPlan = localPlans[id] || s.assignedAcademicPlan;
        const storedCounseling = localCounseling[id] || s.assignedCounselor;

        let updatedStudent = { ...s };

        if (storedPlan) {
          const formattedPlan = typeof storedPlan === 'string' 
            ? { planType: storedPlan, notes: '', title: storedPlan } 
            : { title: storedPlan.planType, ...storedPlan };

          updatedStudent = {
            ...updatedStudent,
            assignedAcademicPlan: formattedPlan,
            academicPlan: formattedPlan,
            plan: formattedPlan,
            academicIntervention: formattedPlan,
            actionTaken: `Plan Assigned: ${formattedPlan.planType || formattedPlan.title}`,
          };
        }

        if (storedCounseling) {
          updatedStudent = {
            ...updatedStudent,
            assignedCounselor: storedCounseling,
            counselingStatus: 'Referral Initiated',
            counselorAssigned: true,
          };
        }

        return updatedStudent;
      });

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
      await loadData();
      showFeedback('Academic details updated successfully.');
    } catch (err) {
      setError(`Failed to update academic record: ${err.message}`);
    }
  };

  // Trigger AI Risk Evaluation
  const handleEvaluateRisk = async (studentId) => {
    setEvaluatingStudentId(studentId);
    setError(null);
    try {
      const result = await triggerStudentRiskEvaluation(studentId);
      const assessmentData = result?.assessment || result?.data || result;

      setStudents((prevStudents) =>
        prevStudents.map((s) => {
          const isTarget = s._id === studentId || s.id === studentId || s.studentId === studentId;
          if (!isTarget) return s;

          return {
            ...s,
            riskLevel: assessmentData?.riskLevel || s.riskLevel,
            riskCategory: assessmentData?.riskCategory || s.riskCategory,
            primaryRiskCategory: assessmentData?.primaryRiskCategory || s.primaryRiskCategory,
            riskEvaluated: true,
            aiRecommendations: assessmentData?.aiRecommendations || s.aiRecommendations,
            recommendedActions: assessmentData?.recommendedActions || {
              ...(s.recommendedActions || {}),
              escalateToCounselor: assessmentData?.escalateToCounselor ?? true,
              assignCounselor: assessmentData?.assignCounselor ?? true,
              grantFinancialAid: assessmentData?.grantFinancialAid ?? false,
            },
            escalateToCounselor: assessmentData?.escalateToCounselor ?? true,
            assignCounselor: assessmentData?.assignCounselor ?? true,
          };
        })
      );

      await loadData();

      const cat = assessmentData?.riskCategory;
      if (cat && cat !== 'None') {
        showFeedback(`AI Risk Evaluation completed: ${assessmentData?.riskLevel || ''} (${cat}).`);
      } else {
        showFeedback('AI risk level evaluation updated successfully.');
      }
    } catch (err) {
      setError(`AI Evaluation Error: ${err.message}`);
    } finally {
      setEvaluatingStudentId(null);
    }
  };

  // Open Academic Support Plan Modal
  const handleOpenAcademicPlan = (student) => {
    setSelectedStudentForPlan(student);
    setIsAcademicPlanModalOpen(true);
  };

  // Submit Assigned Academic Support Plan
  const handleSaveAcademicPlan = async ({ studentId, planType, notes }) => {
    try {
      const targetId = studentId || selectedStudentForPlan?._id || selectedStudentForPlan?.id;

      if (typeof assignAcademicPlan === 'function') {
        await assignAcademicPlan(targetId, { planType, notes });
      }

      const updatedPlan = { planType, notes, title: planType };

      // Persistent localStorage Sync
      try {
        const localPlans = JSON.parse(localStorage.getItem('assigned_academic_plans') || '{}');
        localPlans[targetId] = updatedPlan;
        localStorage.setItem('assigned_academic_plans', JSON.stringify(localPlans));
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }

      // Optimistic state update
      setStudents((prevStudents) =>
        prevStudents.map((s) => {
          const isTarget = s._id === targetId || s.id === targetId || s.studentId === targetId;
          if (!isTarget) return s;

          return {
            ...s,
            assignedAcademicPlan: updatedPlan,
            academicPlan: updatedPlan,
            plan: updatedPlan,
            academicIntervention: updatedPlan,
            actionTaken: `Plan Assigned: ${planType}`,
          };
        })
      );

      showFeedback(`Academic plan successfully assigned to ${selectedStudentForPlan?.name || 'student'}.`);
      setIsAcademicPlanModalOpen(false);
    } catch (err) {
      setError(`Failed to assign plan: ${err.message}`);
    }
  };

  // Open Student Detail Panel
  const handleOpenDetailModal = (student) => {
    setSelectedStudentForDetail(student);
    setIsDetailModalOpen(true);
  };

  // Open Financial Aid / College Fund Modal
  const handleOpenFinancialAidModal = (student) => {
    setSelectedStudentForAid(student);
    setIsFinancialAidModalOpen(true);
  };

  // Submit Emergency Financial Aid / College Fund Grant
  const handleSaveFinancialAid = async (studentId, { amount, reason }) => {
    try {
      await requestCollegeFund(studentId, { amount, reason });
      await loadData();
      showFeedback(`Emergency College Fund request recorded. Status marked as "Pending Institutional Support".`);
      setIsFinancialAidModalOpen(false);

      if (selectedStudentForDetail && (selectedStudentForDetail._id === studentId || selectedStudentForDetail.id === studentId)) {
        setSelectedStudentForDetail((prev) => ({
          ...prev,
          financialAidStatus: 'Pending Institutional Support',
          collegeFinancialAid: { ...(prev?.collegeFinancialAid || {}), status: 'Pending Institutional Support' },
        }));
      }
    } catch (err) {
      setError(`Failed to request college fund: ${err.message}`);
    }
  };

  // Open Counselor Assignment Modal
  const handleOpenCounselorModal = (student) => {
    setSelectedStudentForCounselor(student);
    setIsCounselorModalOpen(true);
  };

  // Counselor Assignment Success Callback
  const handleCounselorAssignSuccess = async ({ studentId, counselor }) => {
    await loadData();
    showFeedback(`Counselor ${counselor?.name || 'Faculty Counselor'} successfully assigned. Counseling log created.`);
    setIsCounselorModalOpen(false);
    if (selectedStudentForDetail && (selectedStudentForDetail._id === studentId || selectedStudentForDetail.id === studentId)) {
      setSelectedStudentForDetail((prev) => ({
        ...prev,
        assignedCounselor: counselor?._id || counselor?.id,
        counselorAssigned: true,
      }));
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

  // Change Password
  const handleChangePassword = async (passwordData) => {
    await changeTeacherPassword(passwordData);
    showFeedback('Password changed successfully.');
  };

  // Filter Roster by Year of Study
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

        {/* Year Filter Control */}
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
            onAcademicIntervention={handleOpenAcademicPlan}
            onAssignPlan={handleOpenAcademicPlan}
            onAssignCounselor={handleOpenCounselorModal}
            onOpenDetailModal={handleOpenDetailModal}
            onGrantFinancialAid={handleOpenFinancialAidModal}
          />
        </div>
      </main>

      {/* Student Detail Panel */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onOpenCounselorModal={(s) => {
          setSelectedStudentForCounselor(s);
          setIsCounselorModalOpen(true);
        }}
        onOpenAcademicPlanModal={(s) => {
          setSelectedStudentForPlan(s);
          setIsAcademicPlanModalOpen(true);
        }}
        onEvaluateRisk={handleEvaluateRisk}
        onUpdateSuccess={loadData}
      />

      {/* Academic Record Entry Modal */}
      <RecordEntryModal
        isOpen={isRecordModalOpen}
        student={selectedStudent}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
      />

      {/* Academic Support Plan Modal */}
      <AcademicPlanModal
        student={selectedStudentForPlan}
        isOpen={isAcademicPlanModalOpen}
        onClose={() => setIsAcademicPlanModalOpen(false)}
        onSubmitPlan={handleSaveAcademicPlan}
      />

      {/* Counselor Assignment Modal (Dynamic directory from /api/counselors) */}
      <CounselorAssignmentModal
        student={selectedStudentForCounselor}
        isOpen={isCounselorModalOpen}
        onClose={() => setIsCounselorModalOpen(false)}
        onAssignSuccess={handleCounselorAssignSuccess}
      />

      {/* College Emergency Fund / Financial Aid Modal */}
      {isFinancialAidModalOpen && (
        <GrantFinancialAidModal
          student={selectedStudentForAid}
          onClose={() => setIsFinancialAidModalOpen(false)}
          onSubmit={handleSaveFinancialAid}
        />
      )}

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