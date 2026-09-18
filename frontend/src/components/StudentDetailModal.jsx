// frontend/src/components/StudentDetailModal.jsx
import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Heart,
  DollarSign,
  AlertTriangle,
  UserCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  Send,
  Loader2,
  TrendingUp,
  FileText,
  History,
  Activity,
  Layers,
  MapPin,
  Briefcase,
  Moon,
  Info,
} from 'lucide-react';
import { requestCollegeFund } from '../services/teacherService';

export function StudentDetailsModal({
  student,
  isOpen,
  onClose,
  onOpenCounselorModal,
  onOpenAcademicPlanModal,
  onEvaluateRisk,
  onUpdateSuccess,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'survey' | 'audit' | 'actions'
  const [fundAmount, setFundAmount] = useState('5000');
  const [fundReason, setFundReason] = useState('Tuition & Academic Relief Support');
  const [fundNotes, setFundNotes] = useState('');
  const [isSubmittingFund, setIsSubmittingFund] = useState(false);
  const [fundFeedback, setFundFeedback] = useState(null);

  if (!isOpen || !student) return null;

  const studentId = student._id || student.id || student.studentId;
  const survey = student.surveyData || {};

  const cgpa = student.cgpa !== null && student.cgpa !== undefined ? student.cgpa : 'N/A';
  const attendance = student.attendancePercentage ?? student.attendance ?? 'N/A';
  const backlogs = student.activeBacklogs || survey.activeBacklogs || '0 Backlogs';
  const mentalHealth = student.mentalHealthSelfReport || student.mentalHealthState || survey.mentalHealthState || 'Good / Balanced';
  const financialStress = student.financialStress || student.moneyFeeWorries || survey.moneyFeeWorries || 'Moderate (Manageable)';
  const academicInterest = student.academicInterest || survey.academicInterest || 'High (Interested & Motivated)';
  const abilityToStudy = student.abilityToStudy || survey.abilityToStudy || 'Full (Good Environment & Focus)';
  const disengagementReason = student.disengagementReason || survey.disengagementReason || 'None';
  const sleepHours = student.sleepHoursPerNight || survey.nightlySleepHours || '5 - 6 hours';
  const familyIncome = student.familyIncome || survey.familyMonthlyIncome || 'Standard';
  const livingSituation = student.livingSituation || survey.livingSituation || 'Campus Hostel';
  const commuteTime = student.commuteTime || survey.dailyCommuteTime || 'Less than 30 mins';
  const partTimeJob = student.partTimeJob || survey.partTimeWork || 'No Job';
  const studyHours = student.studyHoursPerDay || survey.dailySelfStudyHours || '1 - 2 hours';

  const addictions = student.addictions || student.impactFactors || survey.impactFactors || ['None of the Above'];
  const addictionsDisplay = Array.isArray(addictions) ? addictions.join(', ') : String(addictions);

  const nonAcademicRisk = student.nonAcademicRisk || {};
  const evaluationCase = student.evaluationCase || 'NONE';
  const evaluationSource = student.evaluation_source || 'AUTOMATED_AI';

  const isCaseA = evaluationCase === 'CASE_A_WELLNESS_DISENGAGEMENT' || student.recommendedActions?.suppressAcademicPenalty;
  const isCaseB = evaluationCase === 'CASE_B_FINANCIAL_STRESS';
  const isCaseC = evaluationCase === 'CASE_C_PURE_ACADEMIC';

  const isPendingInstitutionalSupport =
    student.financialAidStatus === 'Pending Institutional Support' ||
    student.financial_relief_status === 'REQUESTED' ||
    student.collegeFinancialAid?.status === 'Pending Institutional Support';

  const interventionLogs = Array.isArray(student.intervention_logs) && student.intervention_logs.length > 0
    ? student.intervention_logs
    : [];

  const qualitativeNotes = Array.isArray(student.qualitativeNotes) ? student.qualitativeNotes : [];

  const handleCollegeFundSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingFund(true);
    setFundFeedback(null);
    try {
      await requestCollegeFund(studentId, {
        amount: Number(fundAmount) || 5000,
        reason: fundReason,
        notes: fundNotes,
      });

      setFundFeedback('Emergency College Fund request submitted. Status marked as "Pending Institutional Support".');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setFundFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmittingFund(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      const d = new Date(dateVal);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return String(dateVal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-[#080c14] flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-white">{student.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {student.studentId || 'STU-101'}
                </span>
                {student.riskLevel && student.riskLevel !== 'Unevaluated' && (
                  <span
                    className={`text-xs px-3 py-0.5 rounded-full font-semibold border ${
                      String(student.riskLevel).toLowerCase().includes('high')
                        ? 'bg-red-950/60 text-red-400 border-red-500/40'
                        : String(student.riskLevel).toLowerCase().includes('medium')
                        ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {student.riskLevel}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-950/50 text-indigo-300 border border-indigo-800/40">
                  Source: {evaluationSource}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {student.department || 'Computer Science'} • {student.yearOfStudy || '1st Year'} • {student.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-800 bg-[#080c14] px-6 pt-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity size={14} />
            <span>Academic & AI Evaluation Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('survey')}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'survey'
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>Survey Breakdown (Exact Answers)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={14} />
            <span>Intervention Audit History</span>
            {interventionLogs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px]">
                {interventionLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'actions'
                ? 'border-indigo-500 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign size={14} />
            <span>Emergency Relief & Support Actions</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* TAB 1: ACADEMIC OVERVIEW & AI RISK EVALUATION LOGS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* DECISION MATRIX STATUS BANNER */}
              {isCaseA && (
                <div className="bg-purple-950/30 border border-purple-800/50 rounded-xl p-4 flex items-start gap-3.5">
                  <Heart className="text-purple-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-purple-300">
                      Case A: Non-Academic Disengagement & Wellness Protocol (Strict Isolation Active)
                    </h4>
                    <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                      Student exhibits distress, anxiety, or motivational disengagement. <strong>Academic penalty plans are strictly suppressed</strong> to protect student welfare. Primary action: Redirect immediately to supportive counseling.
                    </p>
                  </div>
                </div>
              )}

              {isCaseB && (
                <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 flex items-start gap-3.5">
                  <DollarSign className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">
                      Case B: High Study Interest with Verified Financial Stress
                    </h4>
                    <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                      Student is motivated to study, but performance/attendance is dropping due to verified fee or financial stress. <strong>Institutional Financial Aid workflow is active</strong> to prevent dropouts.
                    </p>
                  </div>
                </div>
              )}

              {isCaseC && (
                <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 flex items-start gap-3.5">
                  <GraduationCap className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">
                      Case C: Pure Academic Challenge
                    </h4>
                    <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                      Student's issues are strictly related to subject difficulty, attendance gaps, or failing marks without emotional distress. Routed directly to the Academic Plan Module for CGPA recovery.
                    </p>
                  </div>
                </div>
              )}

              {/* TWO MAIN CARDS: ARCHITECTURAL BOUNDARY */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. ACADEMIC OVERVIEW (STRICTLY ACADEMIC) */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-amber-400">
                      <BookOpen size={18} />
                      <h3 className="font-bold text-sm text-white">Academic Overview (Metrics & Trends)</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                      Pure Academic Metrics
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Cumulative CGPA</span>
                      <span className="text-base font-bold text-white">{cgpa}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Scale: 0.0 - 10.0</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Class Attendance</span>
                      <span className="text-base font-bold text-white">{attendance}%</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {Number(attendance) >= 75 ? 'Meets threshold (≥75%)' : 'Below threshold (<75%)'}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Active Backlogs</span>
                      <span className="text-sm font-semibold text-slate-200">{backlogs}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Assignments Track</span>
                      <span className="text-sm font-semibold text-slate-200">
                        {student.assignmentsSubmitted || 0} / {student.assignmentsTotal || 0}
                      </span>
                    </div>
                  </div>

                  {/* Active Academic Track */}
                  <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-300 flex items-center justify-between">
                      <span>Current Academic Support Track:</span>
                      <span className="text-amber-400 font-medium">
                        {student.assignedAcademicPlan?.title || student.assignedAcademicPlan?.planType || student.assignedAcademicPlan || 'Standard Monitoring'}
                      </span>
                    </div>
                    {student.academicInterventionPlan?.studySchedule && (
                      <p className="text-slate-400 text-[11px]">
                        Schedule: {student.academicInterventionPlan.studySchedule}
                      </p>
                    )}
                    {isCaseA && (
                      <p className="text-purple-300 text-[11px] italic">
                        Academic penalties suppressed while student is undergoing supportive counseling.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAcademicPlanModal && onOpenAcademicPlanModal(student)}
                    disabled={isCaseA}
                    className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-2 ${
                      isCaseA
                        ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-amber-950/40 text-amber-300 border-amber-700/50 hover:bg-amber-900/50 cursor-pointer'
                    }`}
                  >
                    <BookOpen size={14} />
                    {isCaseA ? 'Academic Plan Suppressed (Counseling Priority)' : 'Configure Academic Remedial Plan'}
                  </button>
                </div>

                {/* 2. NON-ACADEMIC RISK EVALUATION LOGS */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Heart size={18} />
                      <h3 className="font-bold text-sm text-white">Non-Academic Risk Criteria Logs</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                      AI Diagnostic Log
                    </span>
                  </div>

                  {/* 3 Categories Breakdown */}
                  <div className="space-y-2.5 text-xs">
                    {/* 1. Wellness / Mental Health */}
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Heart size={13} className="text-rose-400" />
                          1. Wellness & Mental Health
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Status: <span className="text-rose-300 font-medium">{mentalHealth}</span> • Sleep: {sleepHours}
                        </div>
                        {nonAcademicRisk?.wellness?.details && (
                          <div className="text-[10px] text-slate-500 mt-1 italic">
                            {nonAcademicRisk.wellness.details}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 font-bold shrink-0">
                        {nonAcademicRisk?.wellness?.level || 'Active'} ({nonAcademicRisk?.wellness?.score || 0}%)
                      </span>
                    </div>

                    {/* 2. Academic Disengagement / Disinterest */}
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-indigo-400" />
                          2. Academic Disengagement / Disinterest
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Interest: <span className="text-indigo-300 font-medium">{academicInterest}</span>
                          {disengagementReason !== 'None' && (
                            <span> • Root: <span className="text-amber-300">{disengagementReason}</span></span>
                          )}
                        </div>
                        {nonAcademicRisk?.disengagement?.details && (
                          <div className="text-[10px] text-slate-500 mt-1 italic">
                            {nonAcademicRisk.disengagement.details}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-300 font-bold shrink-0">
                        {nonAcademicRisk?.disengagement?.level || 'Active'} ({nonAcademicRisk?.disengagement?.score || 0}%)
                      </span>
                    </div>

                    {/* 3. Financial / External Stressors */}
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <DollarSign size={13} className="text-emerald-400" />
                          3. Financial & External Stressors
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Stress: <span className="text-emerald-300 font-medium">{financialStress}</span> • Income: {familyIncome}
                        </div>
                        {nonAcademicRisk?.financial?.details && (
                          <div className="text-[10px] text-slate-500 mt-1 italic">
                            {nonAcademicRisk.financial.details}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-300 font-bold shrink-0">
                        {nonAcademicRisk?.financial?.level || 'Active'} ({nonAcademicRisk?.financial?.score || 0}%)
                      </span>
                    </div>
                  </div>

                  {/* Counselor Assignment Trigger */}
                  <button
                    type="button"
                    onClick={() => onOpenCounselorModal && onOpenCounselorModal(student)}
                    className="w-full py-2 px-3 bg-purple-950/40 text-purple-300 border border-purple-700/50 hover:bg-purple-900/50 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <UserCheck size={14} />
                    {student.assignedCounselor || student.assigned_counselor_id
                      ? 'Reassign / Log Additional Counseling'
                      : 'Assign Registered Counselor (/api/counselors)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SURVEY BREAKDOWN (EXACT ANSWERS SUBMITTED IN SELF-ASSESSMENT) */}
          {activeTab === 'survey' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                  <FileText size={18} />
                  <h3 className="font-bold text-sm text-white">Student Self-Assessment Survey Breakdown</h3>
                </div>
                <span className="text-xs text-slate-400">
                  Status:{' '}
                  <strong className="text-emerald-400">
                    {student.surveyCompleted ? 'Submitted & Verified' : 'Pending Submission'}
                  </strong>
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Exact responses submitted by the student during the comprehensive lifestyle, mental wellness, and academic self-assessment survey.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Academic Study Motivation & Interest</span>
                  <p className="text-sm font-semibold text-white">{academicInterest}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Study Environment & Focus Ability</span>
                  <p className="text-sm font-semibold text-white">{abilityToStudy}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Disengagement Root Cause</span>
                  <p className="text-sm font-semibold text-amber-300">{disengagementReason}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Self-Reported Mental Health & Emotional Wellbeing</span>
                  <p className="text-sm font-semibold text-rose-300">{mentalHealth}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Fee & Financial Anxiety</span>
                  <p className="text-sm font-semibold text-emerald-300">{financialStress}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Estimated Monthly Family Income Bracket</span>
                  <p className="text-sm font-semibold text-white">{familyIncome}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Average Nightly Sleep</span>
                  <p className="text-sm font-semibold text-white">{sleepHours}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Daily Self-Study Hours</span>
                  <p className="text-sm font-semibold text-white">{studyHours}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Living Arrangement / Residence</span>
                  <p className="text-sm font-semibold text-white">{livingSituation}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Daily Commute Time</span>
                  <p className="text-sm font-semibold text-white">{commuteTime}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Part-Time Employment Burden</span>
                  <p className="text-sm font-semibold text-white">{partTimeJob}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Impact Factors / Potential Addictions</span>
                  <p className="text-sm font-semibold text-white">{addictionsDisplay}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERVENTION AUDIT HISTORY (CHRONOLOGICAL TIMELINE) */}
          {activeTab === 'audit' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                  <History size={18} />
                  <h3 className="font-bold text-sm text-white">Intervention Audit History & Action Logs</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {interventionLogs.length} Logged Entries
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Complete verifiable audit trail of faculty assignments, institutional relief requests, and counseling intervention logs.
              </p>

              {interventionLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 italic text-xs">
                  No intervention logs recorded yet. Action events (such as Assigning a Counselor or Requesting a College Fund) will automatically append timestamped entries here.
                </div>
              ) : (
                <div className="relative border-l-2 border-indigo-900/60 ml-4 space-y-6 pt-2">
                  {interventionLogs.map((log, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline marker */}
                      <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </span>

                      <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800/90 shadow-sm space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-indigo-400" />
                            {log.action}
                          </h5>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(log.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {log.notes || 'Action logged in student intervention audit.'}
                        </p>

                        <div className="text-[10px] text-slate-500 pt-1">
                          Performed By: <span className="text-indigo-300 font-medium">{log.performed_by || 'Staff'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Also render any qualitativeNotes */}
              {qualitativeNotes.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">Staff Notes & Case Observations</h4>
                  <div className="space-y-2">
                    {qualitativeNotes.map((note, idx) => (
                      <div key={idx} className="bg-slate-950/40 p-2.5 rounded border border-slate-800/60 text-xs">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-300">{note.authorRole || 'Teacher'}:</span>
                          <span className="font-mono">{formatDate(note.createdAt)}</span>
                        </div>
                        <p className="text-slate-300">{note.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVE RELIEF & COLLEGE FUND ACTIONS */}
          {activeTab === 'actions' && (
            <div className="bg-linear-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <DollarSign size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white">College Emergency Relief Fund Portal</h3>
                    <p className="text-[11px] text-slate-400">
                      Emergency tuition and living expense grant request action
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Relief Status:</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold border ${
                      isPendingInstitutionalSupport
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {student.financial_relief_status || student.financialAidStatus || 'NONE'}
                  </span>
                </div>
              </div>

              {fundFeedback && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{fundFeedback}</span>
                </div>
              )}

              <form onSubmit={handleCollegeFundSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Requested Fund Amount (₹ / $)</label>
                  <input
                    type="number"
                    required
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Support Category</label>
                  <input
                    type="text"
                    required
                    value={fundReason}
                    onChange={(e) => setFundReason(e.target.value)}
                    placeholder="e.g. Tuition fee grant / Book allowance"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Administrative Notes</label>
                  <input
                    type="text"
                    value={fundNotes}
                    onChange={(e) => setFundNotes(e.target.value)}
                    placeholder="e.g. Student has high interest, fee barrier verified"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingFund}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isSubmittingFund ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Submitting Relief Request...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Submit College Fund Request & Append Audit Log
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#080c14] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onEvaluateRisk && onEvaluateRisk(studentId)}
            className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles size={14} />
            Re-evaluate Non-Academic AI Risk
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentDetailsModal;

