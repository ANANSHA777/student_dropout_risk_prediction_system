// frontend/src/components/StudentDetailModal.jsx
import React, { useState, useEffect } from 'react';
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
  XCircle,
  Download,
} from 'lucide-react';
import { requestCollegeFund } from '../services/teacherService';
import { updateFinancialReliefStatus } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

export function StudentDetailsModal({
  student,
  isOpen,
  onClose,
  onOpenCounselorModal,
  onOpenAcademicPlanModal,
  onEvaluateRisk,
  onUpdateSuccess,
  role,
  initialTab = 'overview',
}) {
  const { user } = useAuth();
  const effectiveRole = (role || user?.role || 'Teacher').toLowerCase();
  const isCounselor = effectiveRole === 'counselor';
  const isTeacher = effectiveRole === 'teacher';
  const isAdmin = effectiveRole === 'admin';

  const [activeTab, setActiveTab] = useState(initialTab || 'overview'); // 'overview' | 'survey' | 'audit' | 'actions'
  const [fundAmount, setFundAmount] = useState('5000');
  const [fundReason, setFundReason] = useState('Tuition & Academic Relief Support');
  const [fundNotes, setFundNotes] = useState('');
  const [isSubmittingFund, setIsSubmittingFund] = useState(false);
  const [fundFeedback, setFundFeedback] = useState(null);

  // Admin Approval Hub states
  const [adminReliefNotes, setAdminReliefNotes] = useState('');
  const [isAdminUpdatingRelief, setIsAdminUpdatingRelief] = useState(false);
  const [localReliefStatus, setLocalReliefStatus] = useState(
    student?.financial_relief_status || student?.financialAidStatus || 'NONE'
  );
  const [localLogs, setLocalLogs] = useState(student?.intervention_logs || []);

  useEffect(() => {
    if (student) {
      setLocalReliefStatus(student.financial_relief_status || student.financialAidStatus || 'NONE');
      setLocalLogs(student.intervention_logs || []);
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [student, initialTab, isOpen]);

  if (!isOpen || !student) return null;

  const studentId = student._id || student.id || student.studentId;
  const survey = student.surveyData || {};

  const cgpa = student.cgpa !== null && student.cgpa !== undefined ? student.cgpa : 'N/A';
  const attendance = student.attendancePercentage ?? student.attendance ?? 'N/A';
  const backlogs = student.activeBacklogs || survey.activeBacklogs || '0 Backlogs';
  const rawMentalHealth = student.mentalHealthSelfReport || student.mentalHealthState || survey.mentalHealthState || 'Good / Balanced';
  const hasMentalHealthFlag = ['depressed', 'overwhelmed', 'poor', 'anxious', 'sad', 'struggling', 'bad', 'low', 'severe', 'critical'].some(
    term => String(rawMentalHealth).toLowerCase().includes(term)
  ) || student.needsCounseling === true;

  const displayMentalHealth = isCounselor
    ? rawMentalHealth
    : isAdmin
    ? (hasMentalHealthFlag ? 'Non-Academic Risk: Wellness Flagged (Counselor Access Only)' : 'Wellness: No Flags Recorded')
    : hasMentalHealthFlag
    ? 'Non-Academic Risk: Wellness Flagged'
    : 'Wellness: Stable / No Flags';

  const financialStress = student.financialStress || student.moneyFeeWorries || survey.moneyFeeWorries || 'Moderate (Manageable)';
  const academicInterest = student.academicInterest || survey.academicInterest || 'High (Interested & Motivated)';
  const abilityToStudy = student.abilityToStudy || survey.abilityToStudy || 'Full (Good Environment & Focus)';
  
  const rawDisengagement = student.disengagementReason || survey.disengagementReason || 'None';
  const hasDisengagementFlag = rawDisengagement && !['none', 'n/a', 'no'].includes(rawDisengagement.toLowerCase().trim());
  const displayDisengagement = isCounselor
    ? rawDisengagement
    : hasDisengagementFlag
    ? 'Academic Disengagement Flagged'
    : 'None';

  const sleepHours = student.sleepHoursPerNight || survey.nightlySleepHours || '5 - 6 hours';
  const displaySleepHours = isCounselor ? sleepHours : '[Confidential / Masked]';
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

  // Low Academic Metrics Check: Unsuppress academic remedial planning if CGPA < 6.0 or Attendance < 75%
  const hasLowAcademicMetrics = (cgpa !== 'N/A' && Number(cgpa) < 6.0) || (attendance !== 'N/A' && Number(attendance) < 75);
  const suppressAcademicPlan = isCaseA && !hasLowAcademicMetrics;

  // Strict Financial Relief Eligibility Gating:
  // ONLY available if financial_stress == "HIGH" OR familyIncome <= "Below ₹30,000"
  // For financially stable students (e.g. Arshin: income > ₹60k, moderate anxiety), HIDE / GATE relief
  const finStressStr = String(financialStress || '').toLowerCase();
  const finIncomeStr = String(familyIncome || '').toLowerCase();
  const isHighFinancialStress = ['high', 'severe', 'critical'].some(term => finStressStr.includes(term));
  const isLowIncome = ['below 30', 'below ₹30,000', 'below 30,000', '< 30000', '< 30,000', 'poor', 'poverty', '15,000'].some(term => finIncomeStr.includes(term));
  const isHighIncome = ['above 60', 'above ₹60,000', 'above 60,000', '> 60000', '> 60,000', 'above 1,00,000', 'above 100000'].some(term => finIncomeStr.includes(term));
  const hasExistingReliefRequest = ['REQUESTED', 'DOCUMENTS_REQUIRED', 'APPROVED', 'DISBURSED'].includes((localReliefStatus || '').toUpperCase());

  const isFinanciallyEligible = (isHighFinancialStress || isLowIncome || hasExistingReliefRequest) && !(isHighIncome && !isHighFinancialStress);

  const isPendingInstitutionalSupport =
    localReliefStatus === 'Pending Institutional Support' ||
    localReliefStatus === 'REQUESTED' ||
    student.financialAidStatus === 'Pending Institutional Support' ||
    student.financial_relief_status === 'REQUESTED' ||
    student.collegeFinancialAid?.status === 'Pending Institutional Support';

  const interventionLogs = Array.isArray(localLogs) && localLogs.length > 0
    ? localLogs
    : [];

  const qualitativeNotes = Array.isArray(student.qualitativeNotes) ? student.qualitativeNotes : [];

  const fundLog = (localLogs || [])
    .slice()
    .reverse()
    .find((l) => {
      const act = (l.action || '').toLowerCase();
      return act.includes('fund') || act.includes('aid') || act.includes('relief');
    });

  const rawRequestedAmount =
    student.collegeFinancialAid?.grantAmount ||
    student.collegeFinancialAid?.amount ||
    student.requestedFundAmount ||
    5000;
  const requestedAmountFormatted = Number(rawRequestedAmount).toLocaleString();

  const requestedCategory =
    student.collegeFinancialAid?.reason ||
    student.collegeFinancialAid?.category ||
    student.requestedFundReason ||
    'Tuition & Academic Relief Support';

  const requestedNotes =
    student.collegeFinancialAid?.notes ||
    fundLog?.notes ||
    'Faculty initiated institutional emergency fund application to prevent student dropout.';

  const requestedBy = fundLog?.performed_by || 'Department Faculty / Teacher';
  const requestedDate = student.collegeFinancialAid?.appliedAt || fundLog?.timestamp || student.updatedAt;
  const financialDocs = Array.isArray(student.financial_documents) ? student.financial_documents : [];

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

      setLocalReliefStatus('REQUESTED');
      const newEntry = {
        action: 'Requested Emergency College Fund',
        performed_by: user?.name || 'Faculty / Teacher',
        timestamp: new Date().toISOString(),
        notes: fundNotes || `Applied for ₹${Number(fundAmount) || 5000} institutional grant: ${fundReason}`,
      };
      setLocalLogs((prev) => [newEntry, ...prev]);
      setFundFeedback('Emergency College Fund request submitted. Status marked as "REQUESTED".');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setFundFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmittingFund(false);
    }
  };

  const handleAdminReliefAction = async (newStatus) => {
    setIsAdminUpdatingRelief(true);
    setFundFeedback(null);
    try {
      const res = await updateFinancialReliefStatus(studentId, newStatus, adminReliefNotes);
      setLocalReliefStatus(newStatus);
      const actionLabel =
        newStatus === 'APPROVED'
          ? 'College Fund Approved by Admin'
          : newStatus === 'DISBURSED'
          ? 'College Fund Disbursed'
          : newStatus === 'REJECTED'
          ? 'College Fund Rejected by Admin'
          : 'Financial Relief: Documents Required';
      const newEntry = {
        action: actionLabel,
        performed_by: user?.name || 'Administrator',
        timestamp: new Date().toISOString(),
        notes: adminReliefNotes || (res?.profile?.intervention_logs?.slice(-1)[0]?.notes) || `Financial relief status updated to ${newStatus}`,
      };
      setLocalLogs((prev) => [newEntry, ...prev]);
      setFundFeedback(`Financial relief status successfully updated to "${newStatus}".`);
      setAdminReliefNotes('');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setFundFeedback(`Error updating status: ${err.message}`);
    } finally {
      setIsAdminUpdatingRelief(false);
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

                  <div className="grid grid-cols-3 gap-3 text-xs">
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
                  </div>

                  {/* Active Academic Track */}
                  <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-300 flex items-center justify-between">
                      <span>Current Academic Support Track:</span>
                      <span className="text-amber-400 font-medium">
                        {student.academic_remedial_plan?.plan_title || student.assignedAcademicPlan?.title || student.assignedAcademicPlan?.planType || student.assignedAcademicPlan || 'Standard Monitoring'}
                      </span>
                    </div>
                    {student.academic_remedial_plan?.target_metrics && (
                      <p className="text-amber-300 text-[11px]">
                        Target: {student.academic_remedial_plan.target_metrics}
                      </p>
                    )}
                    {student.academicInterventionPlan?.studySchedule && (
                      <p className="text-slate-400 text-[11px]">
                        Schedule: {student.academicInterventionPlan.studySchedule}
                      </p>
                    )}
                    {isCaseA && !hasLowAcademicMetrics && (
                      <p className="text-purple-300 text-[11px] italic">
                        Academic penalties suppressed while student is undergoing supportive counseling.
                      </p>
                    )}
                    {isCaseA && hasLowAcademicMetrics && (
                      <p className="text-amber-300 text-[11px] font-medium">
                        Notice: Academic remedial plan active due to low metrics (CGPA &lt; 6.0 or Attendance &lt; 75%) alongside supportive counseling.
                      </p>
                    )}
                  </div>

                  {!isAdmin && !isCounselor && (
                    <button
                      type="button"
                      onClick={() => onOpenAcademicPlanModal && onOpenAcademicPlanModal(student)}
                      disabled={suppressAcademicPlan}
                      className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-2 ${
                        suppressAcademicPlan
                          ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-amber-950/40 text-amber-300 border-amber-700/50 hover:bg-amber-900/50 cursor-pointer'
                      }`}
                    >
                      <BookOpen size={14} />
                      {suppressAcademicPlan
                        ? 'Academic Plan Suppressed (Counseling Priority)'
                        : hasLowAcademicMetrics && isCaseA
                        ? 'Configure Academic Remedial Plan (Low Metrics Override)'
                        : 'Configure Academic Remedial Plan'}
                    </button>
                  )}
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
                          Status: <span className="text-rose-300 font-medium">{displayMentalHealth}</span> • Sleep: {displaySleepHours}
                        </div>
                        {nonAcademicRisk?.wellness?.details && isCounselor && (
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
                          {hasDisengagementFlag && (
                            <span> • Root: <span className="text-amber-300">{displayDisengagement}</span></span>
                          )}
                        </div>
                        {nonAcademicRisk?.disengagement?.details && isCounselor && (
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

                  {/* Counselor Assignment Trigger (Hidden for Admin) */}
                  {!isAdmin && (
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
                  )}
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

              {!isCounselor && (
                <div className="p-3 bg-slate-950/80 border border-indigo-950 rounded-lg text-[11px] text-indigo-300 flex items-center gap-2">
                  <Info size={14} className="shrink-0 text-indigo-400" />
                  <span>Privacy Protection Active: Confidential mental health disclosures and clinical metrics are masked for non-counselor roles.</span>
                </div>
              )}

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
                  <p className="text-sm font-semibold text-amber-300">{displayDisengagement}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px] font-medium">Self-Reported Mental Health & Emotional Wellbeing</span>
                  <p className="text-sm font-semibold text-rose-300">{displayMentalHealth}</p>
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
                  <p className="text-sm font-semibold text-white">{displaySleepHours}</p>
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

              {/* OFFICIAL MULTI-ROLE INTERVENTION STATUS TRACKERS */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={15} className="text-indigo-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Official Multi-Role Intervention Status Trackers
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Institutional Governance Overview</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. Counseling Session Tracker */}
                  {(() => {
                    const cSession = student.counseling_session || {};
                    const cStatus = cSession.status || (student.assigned_counselor_id ? 'PENDING_SCHEDULE' : 'NOT_ASSIGNED');
                    const isCompleted = cStatus === 'COMPLETED';
                    const isConfirmed = cStatus === 'CONFIRMED_BY_STUDENT';
                    const isScheduled = cStatus === 'SCHEDULED';
                    const isPending = cStatus === 'PENDING_SCHEDULE';

                    const statusBadgeClass = isCompleted
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : isConfirmed
                      ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                      : isScheduled
                      ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                      : isPending
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700';

                    const statusText = isCompleted
                      ? 'Session Completed & Resolved'
                      : isConfirmed
                      ? 'Attendance Confirmed'
                      : isScheduled
                      ? 'Session Scheduled'
                      : isPending
                      ? 'Assigned • Pending Schedule'
                      : 'No Counselor Assigned';

                    const displayCounselorNotes = isAdmin
                      ? '[Confidential Counselor Clinical Note — Masked for Privacy]'
                      : cSession.completion_notes || cSession.notes;

                    return (
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1.5">
                            <Heart size={12} className="text-purple-400" />
                            Counseling Track
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusBadgeClass}`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-300">
                          {cSession.date ? (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Date & Time:</span>
                              <span className="text-slate-200 font-medium">{cSession.date} at {cSession.time || 'TBD'}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">
                              {student.assigned_counselor_id ? 'Counselor assigned, awaiting slot' : 'No counselor session booked'}
                            </div>
                          )}
                          {isCompleted && cSession.completed_at && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Completed:</span>
                              <span className="text-emerald-400 font-mono text-[10px]">{formatDate(cSession.completed_at)}</span>
                            </div>
                          )}
                          {displayCounselorNotes && (
                            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/60 line-clamp-2">
                              "{displayCounselorNotes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. Academic Remedial Plan Tracker */}
                  {(() => {
                    const acadPlan = student.academic_remedial_plan || {};
                    const aStatus = acadPlan.status || 'NOT_REQUIRED';
                    const isPlanInProgress = aStatus === 'IN_PROGRESS';
                    const isPlanCompleted = aStatus === 'COMPLETED';

                    const planBadgeClass = isPlanCompleted
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : isPlanInProgress
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700';

                    const planStatusText = isPlanCompleted
                      ? 'Plan Resolved & Completed'
                      : isPlanInProgress
                      ? 'Remedial Plan In Progress'
                      : 'Not Required';

                    return (
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-blue-300 flex items-center gap-1.5">
                            <BookOpen size={12} className="text-blue-400" />
                            Academic Plan Track
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${planBadgeClass}`}>
                            {planStatusText}
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-300">
                          {acadPlan.plan_title ? (
                            <>
                              <div className="font-semibold text-white truncate text-[11px]">
                                {acadPlan.plan_title}
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Assigned By:</span>
                                <span className="text-slate-200">{acadPlan.assigned_by_teacher_name || 'Faculty'}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Target Metrics:</span>
                                <span className="text-indigo-300 truncate max-w-[140px]">{acadPlan.target_metrics || 'Improve Grades'}</span>
                              </div>
                              {isPlanCompleted && acadPlan.completed_at && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">Completed:</span>
                                  <span className="text-emerald-400 font-mono text-[10px]">{formatDate(acadPlan.completed_at)}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">
                              Standard curriculum; no active remedial plan assigned
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Financial Relief Tracker */}
                  {(() => {
                    const normalizedStatus = (localReliefStatus || student.financial_relief_status || 'NONE').toUpperCase();
                    const isRequested = ['REQUESTED', 'PENDING INSTITUTIONAL SUPPORT', 'PENDING'].includes(normalizedStatus);
                    const isDocs = normalizedStatus === 'DOCUMENTS_REQUIRED';
                    const isApproved = ['APPROVED', 'DISBURSED'].includes(normalizedStatus);
                    const isRejected = normalizedStatus === 'REJECTED';

                    const relBadgeClass = isApproved
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : isRequested || isDocs
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : isRejected
                      ? 'bg-red-950/80 text-red-300 border-red-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700';

                    const relStatusText = isApproved
                      ? 'Relief Approved / Disbursed'
                      : isDocs
                      ? 'Documents Required'
                      : isRequested
                      ? 'Pending Admin Review'
                      : isRejected
                      ? 'Request Declined'
                      : 'No Relief Requested';

                    return (
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                            <DollarSign size={12} className="text-emerald-400" />
                            Financial Relief Track
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${relBadgeClass}`}>
                            {relStatusText}
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-300">
                          {normalizedStatus !== 'NONE' ? (
                            <>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Grant Amount:</span>
                                <span className="text-emerald-400 font-bold">₹{requestedAmountFormatted}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Category:</span>
                                <span className="text-slate-200 truncate max-w-[140px]">{requestedCategory}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Requested:</span>
                                <span className="text-slate-400 font-mono text-[10px]">{formatDate(requestedDate)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">
                              No financial relief or grant applications submitted
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {interventionLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 italic text-xs">
                  No intervention logs recorded yet. Action events (such as Assigning a Counselor or Requesting a College Fund) will automatically append timestamped entries here.
                </div>
              ) : (
                <div className="relative border-l-2 border-indigo-900/60 ml-4 space-y-6 pt-2">
                  {interventionLogs.map((log, idx) => {
                    const isPrivateCounselorLog = isAdmin && (
                      (log.performed_by || '').toLowerCase().includes('counselor') ||
                      (log.action || '').toLowerCase().includes('counseling')
                    );
                    const displayLogNotes = isPrivateCounselorLog
                      ? '[Confidential Counselor Clinical Note — Masked for Privacy]'
                      : log.notes || 'Action logged in student intervention audit.';

                    return (
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
                            {displayLogNotes}
                          </p>

                          <div className="text-[10px] text-slate-500 pt-1">
                            Performed By: <span className="text-indigo-300 font-medium">{log.performed_by || 'Staff'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Also render any qualitativeNotes */}
              {qualitativeNotes.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">Staff Notes & Case Observations</h4>
                  <div className="space-y-2">
                    {qualitativeNotes.map((note, idx) => {
                      const isCounselorNote = (note.authorRole || '').toLowerCase() === 'counselor';
                      const noteContent = isAdmin && isCounselorNote
                        ? '[Confidential Counselor Clinical Note — Masked for Privacy]'
                        : note.note;

                      return (
                        <div key={idx} className="bg-slate-950/40 p-2.5 rounded border border-slate-800/60 text-xs">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span className="font-semibold text-slate-300">{note.authorRole || 'Teacher'}:</span>
                            <span className="font-mono">{formatDate(note.createdAt)}</span>
                          </div>
                          <p className="text-slate-300">{noteContent}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVE RELIEF & COLLEGE FUND ACTIONS */}
          {activeTab === 'actions' && (() => {
            const normalizedStatus = (localReliefStatus || 'NONE').toUpperCase();
            const isRequestedStatus =
              normalizedStatus === 'REQUESTED' ||
              normalizedStatus === 'PENDING INSTITUTIONAL SUPPORT' ||
              normalizedStatus === 'PENDING' ||
              normalizedStatus === 'PENDING REVIEW';

            return (
              <div className="bg-linear-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-3">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <DollarSign size={20} />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {isAdmin ? 'Institutional Financial Relief Approval Hub' : 'College Emergency Relief Fund Portal'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {isAdmin
                          ? 'Administrative evaluation, document verification & funding disbursement'
                          : 'Emergency tuition and living expense grant request action'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Relief Status:</span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold border ${
                        isRequestedStatus
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                          : normalizedStatus === 'DOCUMENTS_REQUIRED'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          : normalizedStatus === 'APPROVED' || normalizedStatus === 'DISBURSED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : normalizedStatus === 'REJECTED'
                          ? 'bg-red-950/80 text-red-300 border-red-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {normalizedStatus}
                    </span>
                  </div>
                </div>

                {fundFeedback && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>{fundFeedback}</span>
                  </div>
                )}

                {isAdmin ? (
                  /* ADMIN APPROVAL HUB */
                  <div className="space-y-5">
                    {isRequestedStatus ? (
                      /* CASE 1: REQUESTED -> SHOW DETAILS & ADMIN ACTION BUTTONS */
                      <div className="space-y-4">
                        {/* Request Details Card */}
                        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <FileText size={14} className="text-amber-400" />
                              Pending Faculty Relief Request Details
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Submitted: {formatDate(requestedDate)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                              <span className="text-slate-500 block text-[11px]">Requested Grant Amount</span>
                              <span className="text-base font-bold text-emerald-400">
                                ₹{requestedAmountFormatted}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Emergency College Aid</span>
                            </div>

                            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                              <span className="text-slate-500 block text-[11px]">Support Category</span>
                              <span className="text-sm font-semibold text-white truncate block">
                                {requestedCategory}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Institutional Quota</span>
                            </div>

                            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                              <span className="text-slate-500 block text-[11px]">Requested By Faculty</span>
                              <span className="text-sm font-semibold text-slate-200 truncate block">
                                {requestedBy}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Department Advocate</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
                            <span className="text-slate-500 block text-[11px] font-semibold mb-1">
                              Faculty Case Justification & Notes:
                            </span>
                            <p className="text-slate-300 leading-relaxed italic">
                              "{requestedNotes}"
                            </p>
                          </div>
                        </div>

                        {/* Uploaded Verification Documents (if any) */}
                        {financialDocs.length > 0 && (
                          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2">
                            <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <FileText size={13} className="text-indigo-400" />
                              Uploaded Proof & Verification Documents ({financialDocs.length})
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {financialDocs.map((doc, dIdx) => (
                                <a
                                  key={dIdx}
                                  href={doc.fileData || doc.url || '#'}
                                  download={doc.filename || `document_${dIdx + 1}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition"
                                >
                                  <FileText size={12} />
                                  <span className="max-w-[180px] truncate">{doc.filename || 'Proof Document'}</span>
                                  <Download size={11} className="text-slate-500 ml-1" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Admin Decision Remarks Note Field */}
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1 text-xs">
                            Administrative Decision Remarks (Optional note appended to student audit trail)
                          </label>
                          <input
                            type="text"
                            value={adminReliefNotes}
                            onChange={(e) => setAdminReliefNotes(e.target.value)}
                            placeholder="e.g., Verified fee receipt and income status. Disbursed from student relief fund."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 text-xs"
                          />
                        </div>

                        {/* 3 Explicit Admin Action Buttons */}
                        <div className="flex items-center justify-end gap-3 flex-wrap pt-2 border-t border-slate-800">
                          {/* 1. Reject Request */}
                          <button
                            type="button"
                            disabled={isAdminUpdatingRelief}
                            onClick={() => handleAdminReliefAction('REJECTED')}
                            className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-700/60 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject Request
                          </button>

                          {/* 2. Request Verification Documents */}
                          <button
                            type="button"
                            disabled={isAdminUpdatingRelief}
                            onClick={() => handleAdminReliefAction('DOCUMENTS_REQUIRED')}
                            className="px-4 py-2 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-700/60 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <FileText size={14} />
                            Request Verification Documents
                          </button>

                          {/* 3. Approve & Disburse Funds */}
                          <button
                            type="button"
                            disabled={isAdminUpdatingRelief}
                            onClick={() => handleAdminReliefAction('DISBURSED')}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {isAdminUpdatingRelief ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Approve & Disburse Funds
                          </button>
                        </div>
                      </div>
                    ) : normalizedStatus === 'DOCUMENTS_REQUIRED' ? (
                      /* CASE 2: DOCUMENTS REQUIRED */
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                            <AlertTriangle size={15} />
                            <span>Awaiting Verification Documents from Student</span>
                          </div>
                          <p className="text-xs text-amber-200/80">
                            The student has been prompted on their portal to submit financial proof documents (income certificate, fee statements). You can approve disbursement immediately if satisfied or reject the claim.
                          </p>
                        </div>

                        {/* Request Details Card */}
                        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                              <span className="text-slate-500 block text-[11px]">Requested Grant Amount</span>
                              <span className="text-base font-bold text-emerald-400">₹{requestedAmountFormatted}</span>
                            </div>
                            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                              <span className="text-slate-500 block text-[11px]">Support Category</span>
                              <span className="text-sm font-semibold text-white">{requestedCategory}</span>
                            </div>
                            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                              <span className="text-slate-500 block text-[11px]">Faculty Advocate</span>
                              <span className="text-sm font-semibold text-slate-200">{requestedBy}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
                            <span className="text-slate-500 block text-[11px] font-semibold mb-1">Faculty Notes:</span>
                            <p className="text-slate-300 italic">"{requestedNotes}"</p>
                          </div>
                        </div>

                        {/* Uploaded Documents */}
                        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2">
                          <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <FileText size={13} className="text-indigo-400" />
                            Student Uploaded Proof Documents ({financialDocs.length})
                          </h5>
                          {financialDocs.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">
                              Student has not uploaded proof files yet.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {financialDocs.map((doc, dIdx) => (
                                <a
                                  key={dIdx}
                                  href={doc.fileData || doc.url || '#'}
                                  download={doc.filename || `document_${dIdx + 1}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition"
                                >
                                  <FileText size={12} />
                                  <span className="max-w-[180px] truncate">{doc.filename || 'Proof Document'}</span>
                                  <Download size={11} className="text-slate-500 ml-1" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Decision Remarks */}
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1 text-xs">
                            Administrative Decision Remarks (Optional)
                          </label>
                          <input
                            type="text"
                            value={adminReliefNotes}
                            onChange={(e) => setAdminReliefNotes(e.target.value)}
                            placeholder="Remarks for approval or rejection..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 text-xs"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 flex-wrap pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            disabled={isAdminUpdatingRelief}
                            onClick={() => handleAdminReliefAction('REJECTED')}
                            className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-700/60 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject Request
                          </button>

                          <button
                            type="button"
                            disabled={isAdminUpdatingRelief}
                            onClick={() => handleAdminReliefAction('DISBURSED')}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {isAdminUpdatingRelief ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Approve & Disburse Funds
                          </button>
                        </div>
                      </div>
                    ) : normalizedStatus === 'APPROVED' || normalizedStatus === 'DISBURSED' ? (
                      /* CASE 3: APPROVED / DISBURSED */
                      <div className="bg-slate-950/80 rounded-xl border border-emerald-800/40 p-5 space-y-4">
                        <div className="flex items-center gap-3 text-emerald-400">
                          <CheckCircle2 size={24} />
                          <div>
                            <h4 className="text-sm font-bold text-white">Emergency Relief Grant Approved & Disbursed</h4>
                            <p className="text-xs text-emerald-300/80">
                              Institutional funds have been allocated to the student's account to ensure study continuation.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[11px]">Disbursed Amount</span>
                            <span className="text-base font-bold text-emerald-400">₹{requestedAmountFormatted}</span>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[11px]">Category</span>
                            <span className="text-sm font-semibold text-white">{requestedCategory}</span>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[11px]">Relief Record</span>
                            <span className="text-sm font-semibold text-slate-200">Institutional Grant Active</span>
                          </div>
                        </div>
                      </div>
                    ) : normalizedStatus === 'REJECTED' ? (
                      /* CASE 4: REJECTED */
                      <div className="bg-slate-950/80 rounded-xl border border-red-800/40 p-5 space-y-4">
                        <div className="flex items-center gap-3 text-red-400">
                          <XCircle size={24} />
                          <div>
                            <h4 className="text-sm font-bold text-white">Emergency Relief Request Rejected</h4>
                            <p className="text-xs text-red-300/80">
                              This application was reviewed and declined by administrative leadership.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* CASE 5: NONE */
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                        <DollarSign size={28} className="mx-auto text-slate-500" />
                        <h4 className="text-sm font-semibold text-slate-300">No Emergency Relief Request Active</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Department faculty have not submitted an institutional relief fund request for this student. When faculty submit a request, administrative review options will be displayed here.
                        </p>
                      </div>
                    )}
                  </div>
                ) : isCounselor ? (
                  /* COUNSELOR READ-ONLY VIEW */
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center space-y-2">
                    <DollarSign size={24} className="mx-auto text-slate-400" />
                    <h4 className="text-xs font-bold text-slate-300">Financial Relief Status: {normalizedStatus}</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      College relief fund requests are initiated by teaching faculty and approved by administrative leadership. Counselors have read-only visibility for student holistic context.
                    </p>
                  </div>
                ) : !isFinanciallyEligible && normalizedStatus === 'NONE' ? (
                  /* INELIGIBILITY NOTICE FOR TEACHER */
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700/80 mx-auto flex items-center justify-center text-slate-400">
                      <DollarSign size={22} className="text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">
                        Student Ineligible for Emergency Relief Fund
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                        Survey metrics indicate student family income ({familyIncome}) and financial stress level ({financialStress}) do not qualify for hardship relief grants. Institutional emergency relief is reserved for students facing severe economic hardship (High financial stress or Family income ≤ ₹30,000/mo).
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                      <span>Family Income: <strong className="text-slate-300">{familyIncome}</strong></span>
                      <span>•</span>
                      <span>Financial Stress: <strong className="text-slate-300">{financialStress}</strong></span>
                    </div>
                  </div>
                ) : normalizedStatus !== 'NONE' ? (
                  /* TEACHER VIEW WHEN REQUEST ALREADY EXISTS */
                  <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileText size={14} className="text-indigo-400" />
                        Submitted Emergency Relief Request
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Submitted: {formatDate(requestedDate)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[11px]">Requested Grant</span>
                        <span className="text-base font-bold text-emerald-400">₹{requestedAmountFormatted}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[11px]">Category</span>
                        <span className="text-sm font-semibold text-white">{requestedCategory}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[11px]">Status</span>
                        <span className="text-sm font-semibold text-amber-300">{normalizedStatus}</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-500 block text-[11px] font-semibold mb-1">Faculty Case Justification:</span>
                      <p className="text-slate-300 italic">"{requestedNotes}"</p>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isRequestedStatus
                        ? 'This request is pending administrative review. College leadership can approve and disburse funds directly from the Admin Portal.'
                        : normalizedStatus === 'DOCUMENTS_REQUIRED'
                        ? 'Administrative leadership has requested income/fee verification documents from the student.'
                        : ['APPROVED', 'DISBURSED'].includes(normalizedStatus)
                        ? 'Emergency relief grant has been approved and disbursed to the student account.'
                        : 'Emergency relief request was reviewed and closed.'}
                    </p>
                  </div>
                ) : (
                  /* TEACHER SUBMISSION FORM */
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
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t border-slate-800 bg-[#080c14] flex items-center ${isAdmin ? 'justify-end' : 'justify-between'}`}>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => onEvaluateRisk && onEvaluateRisk(studentId)}
              className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles size={14} />
              Re-evaluate Non-Academic AI Risk
            </button>
          )}

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

