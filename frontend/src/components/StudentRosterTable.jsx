// src/components/StudentRosterTable.jsx
import React from 'react';
import {
  Edit3,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
  UserCheck,
  BookOpen,
  HeartPulse,
  Check,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  Eye,
} from 'lucide-react';

// --- HELPERS ---

function extractAssignedPlan(student) {
  if (!student) return null;
  return (
    student.assignedAcademicPlan ||
    student.academicPlan ||
    student.assignedPlan ||
    student.academicIntervention ||
    student.remedialPlan ||
    student.plan ||
    student.intervention ||
    (Array.isArray(student.interventions) && student.interventions[0]) ||
    (Array.isArray(student.academicPlans) && student.academicPlans[0]) ||
    student.riskEvaluation?.assignedPlan ||
    null
  );
}

// Deep Root-Cause Evaluator matching exact MongoDB schema values
function evaluateStudentRootCause(student) {
  if (!student) return { hasCounselingRisk: false, causes: {}, riskCategoryClassification: 'No Policy Risk' };

  const survey = student.surveyData || student.survey || student.surveyAnswers || {};

  // Reads ALL matching values into an array to prevent false-negative overwrites
  const getAllValues = (...keys) => {
    const foundValues = [];
    for (const k of keys) {
      if (survey[k] !== undefined && survey[k] !== null) {
        foundValues.push(String(survey[k]).toLowerCase().trim());
      }
      if (student[k] !== undefined && student[k] !== null) {
        foundValues.push(String(student[k]).toLowerCase().trim());
      }
    }
    return foundValues;
  };

  const getValStr = (...keys) => getAllValues(...keys).join(' ');

  // 1. ACADEMIC PERFORMANCE EVALUATION
  const cgpa = student.cgpa ?? null;
  const attendance = student.attendancePercentage ?? student.attendance ?? null;
  const backlogsStr = getValStr('activeBacklogs', 'backlogs');

  const isAcademicRisk = 
    (cgpa !== null && cgpa < 7.5) || 
    (attendance !== null && attendance <= 75) || 
    backlogsStr.includes('backlog') ||
    backlogsStr.includes('3+') ||
    backlogsStr.includes('1') ||
    backlogsStr.includes('2') ||
    student.riskCategory === 'Academic Concern';

  // 2. NON-ACADEMIC & PERSONAL RISK EVALUATION
  
  // Wellness / Mental Health & Sleep (Handles "Depressed / Overwhelmed" & "Less than 5 hours")
  const mentalStr = getValStr('mentalHealthSelfReport', 'mentalHealthState', 'mental_health_self_report', 'mentalHealth', 'wellnessStatus');
  const sleepStr = getValStr('nightlySleepHours', 'sleepHours', 'nightlySleep', 'sleep');
  
  const hasWellnessIssue = 
    ['depressed', 'overwhelmed', 'poor', 'anxious', 'sad', 'struggling', 'bad', 'low', 'severe', 'critical'].some(
      term => mentalStr.includes(term)
    ) || 
    ['less than 5', '< 5', 'less than 5 hours'].some(term => sleepStr.includes(term)) ||
    student.needsCounseling === true;

  // Disengagement (Handles "Low (Lost Interest / Disengaged)")
  const interestStr = getValStr('academicInterest', 'academic_interest', 'studyInterest', 'interestInStudies');
  const isDisengaged = ['low', 'lost', 'disengaged', 'none', 'no interest'].some(term => interestStr.includes(term));

  // Financial Stress
  const finStressStr = getValStr('financialStress', 'financial_stress', 'feeWorries', 'fee_worries', 'moneyFeeWorries', 'moneyWorries');
  const finIncomeStr = getValStr('familyIncome', 'family_income', 'incomeLevel', 'income_level', 'familyMonthlyIncome');
  const hasFinancialIssue = 
    ['high', 'moderate', 'severe', 'critical', 'manageable'].some(term => finStressStr.includes(term)) ||
    ['poor', 'poverty', '15,000'].some(term => finIncomeStr.includes(term)) ||
    student.financialAidStatus === 'Pending' || student.financialAidStatus === 'Required';

  // External Stress (Commute "More than 2 hours" & Self-Study "Less than 1 hour")
  const commuteStr = getValStr('commuteTime', 'dailyCommuteTime', 'travelTime');
  const hasCommuteIssue = ['more than 2', '2 hours', 'long', 'high', 'far'].some(term => commuteStr.includes(term));
  
  const studyStr = getValStr('studyHoursPerDay', 'dailySelfStudyHours', 'studyHours');
  const hasZeroOrLowStudyHours = ['less than 1', '0 hours', 'zero', '1 hour', 'less than 1 hour'].some(term => studyStr.includes(term));

  const hasPersonalOrFinancialRisk = hasWellnessIssue || isDisengaged || hasFinancialIssue || hasCommuteIssue || hasZeroOrLowStudyHours;

  // 3. AI MATRIX RISK CATEGORIZATION
  let riskCategoryClassification = 'No Policy Risk';
  if (isAcademicRisk && hasPersonalOrFinancialRisk) {
    riskCategoryClassification = 'Dual Risk (Academic + Personal)';
  } else if (isAcademicRisk) {
    riskCategoryClassification = 'Academic Risk Only';
  } else if (hasPersonalOrFinancialRisk) {
    riskCategoryClassification = 'Personal / Financial Risk';
  }

  return {
    isAcademicRisk,
    hasPersonalOrFinancialRisk,
    riskCategoryClassification,
    showFinancialAidOption: hasFinancialIssue, // Directly enable financial aid whenever financial flags exist
    showCounselorBtn: hasWellnessIssue || isDisengaged || hasCommuteIssue || hasZeroOrLowStudyHours,
    showAcademicPlanBtn: isAcademicRisk,
  };
}

// --- MAIN RESOLVER LOGIC ---
function resolveStudentFields(student) {
  const studentDbId = student._id || student.id;
  const displayStudentId = student.studentId || student.rollNo || 'STU-101';
  const displayYear = student.yearOfStudy || student.year || '1st Year';

  const cgpaVal = student.cgpa ?? null;
  const attendanceVal = student.attendancePercentage ?? student.attendance ?? null;

  const hasTeacherData = cgpaVal !== null && attendanceVal !== null;
  const hasStudentSurvey =
    student.surveyCompleted === true ||
    student.surveyStatus === 'Completed' ||
    student.isSurveyDone === true ||
    Boolean(
      student.academicInterest ||
        student.studyHoursPerDay ||
        student.mentalHealthSelfReport ||
        student.surveyData ||
        student.survey
    );

  const canEvaluate = hasTeacherData && hasStudentSurvey;

  const isRiskEvaluated =
    student.riskEvaluated === true ||
    (student.riskLevel &&
      student.riskLevel !== 'Unevaluated' &&
      student.riskLevel !== 'Pending');

  const evaluationAnalysis = evaluateStudentRootCause(student);

  // Force system to ALWAYS rely on computed risk classification if DB is outdated
  let effectiveCategory = null;
  if (isRiskEvaluated) {
    const rawPrimary = (student.primaryRiskCategory || '').trim();
    const rawRisk = (student.riskCategory || '').trim();

    if (
      !rawPrimary || 
      rawPrimary.toUpperCase() === 'NONE' || 
      rawRisk.toLowerCase() === 'academic concern' ||
      evaluationAnalysis.riskCategoryClassification === 'Dual Risk (Academic + Personal)'
    ) {
      effectiveCategory = evaluationAnalysis.riskCategoryClassification;
    } else {
      effectiveCategory = rawPrimary && rawPrimary.toUpperCase() !== 'NONE' ? rawPrimary : rawRisk;
    }
  }

  const categoryLower = (effectiveCategory || '').toLowerCase();
  const assignedPlan = extractAssignedPlan(student);

  return {
    studentDbId,
    displayStudentId,
    displayYear,
    cgpaVal,
    attendanceVal,
    hasTeacherData,
    hasStudentSurvey,
    canEvaluate,
    isRiskEvaluated,
    effectiveCategory,
    categoryLower,
    evaluationAnalysis,
    assignedPlan,
  };
}

function renderCategoryIcon(categoryLower) {
  if (categoryLower.includes('dual')) {
    return <AlertTriangle size={12} className="text-rose-400 shrink-0" />;
  }
  if (categoryLower.includes('mental') || categoryLower.includes('wellness') || categoryLower.includes('personal')) {
    return <HeartPulse size={12} className="text-purple-400 shrink-0" />;
  }
  if (categoryLower.includes('financial') || categoryLower.includes('income')) {
    return <DollarSign size={12} className="text-emerald-400 shrink-0" />;
  }
  if (categoryLower.includes('academic')) {
    return <BookOpen size={12} className="text-amber-400 shrink-0" />;
  }
  return <ShieldCheck size={12} className="text-emerald-400 shrink-0" />;
}

// --- TABLE ROW COMPONENT ---
function StudentRosterRow({
  student,
  evaluatingStudentId,
  showActions,
  onOpenRecordModal,
  onDeleteStudent,
  onEvaluateRisk,
  onAssignCounselor,
  onAcademicIntervention,
  onAssignPlan,
  onGrantFinancialAid,
  onOpenDetailModal,
}) {
  const {
    studentDbId,
    displayStudentId,
    displayYear,
    cgpaVal,
    attendanceVal,
    hasTeacherData,
    hasStudentSurvey,
    canEvaluate,
    isRiskEvaluated,
    effectiveCategory,
    categoryLower,
    evaluationAnalysis,
    assignedPlan,
  } = resolveStudentFields(student);

  const isEvaluatingThisStudent = evaluatingStudentId === studentDbId;
  const assignedCounselor =
    student.assignedCounselor ||
    student.counselor ||
    student.counselorAssigned ||
    student.assignedCounselorId;

  const handleAcademicPlanClick = () => {
    const handler = onAcademicIntervention || onAssignPlan;
    if (handler) handler(student);
  };

  let planTitle = 'Academic Support Plan';
  if (typeof assignedPlan === 'string') {
    planTitle = assignedPlan;
  } else if (typeof assignedPlan === 'object' && assignedPlan !== null) {
    planTitle = assignedPlan.planType || assignedPlan.title || assignedPlan.name || 'Academic Support Plan';
  }

  const getEvaluateTooltip = () => {
    if (canEvaluate) return 'Click to trigger AI Risk Analysis';
    if (!hasTeacherData && !hasStudentSurvey)
      return 'Disabled: Missing Teacher Marks & Student Survey';
    if (!hasTeacherData) return 'Disabled: Missing CGPA & Attendance from Teacher';
    return 'Disabled: Waiting for Student Survey Submission';
  };

  const evalCase = student.evaluationCase || '';
  const isCaseA = evalCase === 'CASE_A_WELLNESS_DISENGAGEMENT' || 
                  student.recommendedActions?.suppressAcademicPenalty ||
                  (evaluationAnalysis.showCounselorBtn && !evaluationAnalysis.showFinancialAidOption);
  const isCaseB = evalCase === 'CASE_B_FINANCIAL_STRESS' ||
                  student.recommendedActions?.requestCollegeFund ||
                  (evaluationAnalysis.showFinancialAidOption);
  const isPendingInstitutionalSupport = 
    student.financialAidStatus === 'Pending Institutional Support' || 
    student.collegeFinancialAid?.status === 'Pending Institutional Support';

  return (
    <tr className="hover:bg-slate-800/30 transition-colors">
      {/* Student Info */}
      <td className="py-4 px-5">
        <button
          type="button"
          onClick={() => onOpenDetailModal && onOpenDetailModal(student)}
          className="text-left group cursor-pointer"
        >
          <div className="font-bold text-slate-100 group-hover:text-indigo-300 transition flex items-center gap-1.5">
            <span>{student.name}</span>
            <Eye size={12} className="opacity-0 group-hover:opacity-100 text-indigo-400 transition" />
          </div>
          <div className="text-xs text-slate-400">{student.email}</div>
        </button>
      </td>

      {/* ID / Year */}
      <td className="py-4 px-5">
        <div className="text-slate-300 font-mono text-xs font-semibold">{displayStudentId}</div>
        <div className="text-xs text-indigo-400 font-semibold">{displayYear}</div>
      </td>

      {/* CGPA / Attendance */}
      <td className="py-4 px-5">
        <div className="text-xs text-slate-300">
          <span className="text-slate-400">CGPA:</span>{' '}
          {cgpaVal !== null ? (
            <span className="font-bold text-white">{cgpaVal}</span>
          ) : (
            <span className="text-amber-400 font-medium">Missing</span>
          )}
        </div>
        <div className="text-xs text-slate-300">
          <span className="text-slate-400">Attendance:</span>{' '}
          {attendanceVal !== null ? (
            <span className="font-bold text-white">{attendanceVal}%</span>
          ) : (
            <span className="text-amber-400 font-medium">Missing</span>
          )}
        </div>
      </td>

      {/* Survey Status */}
      <td className="py-4 px-5">
        {hasStudentSurvey ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} className="text-emerald-400" /> Submitted
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
            <Clock size={13} /> Pending
          </span>
        )}
      </td>

      {/* Risk Evaluation Matrix */}
      <td className="py-4 px-5">
        {isRiskEvaluated ? (
          <div className="space-y-1.5">
            <span
              className={`inline-block px-3.5 py-1 text-xs rounded-full font-semibold border ${
                categoryLower.includes('dual') || String(student.riskLevel).toLowerCase().includes('high')
                  ? 'bg-red-950/60 text-red-400 border-red-500/40'
                  : String(student.riskLevel).toLowerCase().includes('medium')
                  ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                  : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {categoryLower.includes('dual') ? 'High Risk' : student.riskLevel?.includes('Risk') ? student.riskLevel : `${student.riskLevel} Risk`}
            </span>

            {effectiveCategory && (
              <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                {renderCategoryIcon(categoryLower)}
                <span>{effectiveCategory}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="inline-block px-3 py-1 text-xs rounded-full font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
            Unevaluated
          </span>
        )}
      </td>

      {/* Recommended Interventions (Teacher view) OR Actions Logged (Admin view) */}
      <td className="py-4 px-5">
        {!showActions ? (
          /* ADMIN VIEW: ACTIONS LOGGED */
          <div className="space-y-2 min-w-[170px] max-w-[240px]">
            {student.intervention_logs && student.intervention_logs.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {student.intervention_logs[student.intervention_logs.length - 1].action}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">
                  {student.intervention_logs[student.intervention_logs.length - 1].notes ||
                    `By ${student.intervention_logs[student.intervention_logs.length - 1].performed_by || 'Staff'}`}
                </div>
              </div>
            ) : assignedCounselor ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-950/40 p-1.5 rounded-lg border border-purple-800/40 w-full">
                <UserCheck size={12} className="text-purple-400 shrink-0" />
                <span className="truncate">Counselor Assigned</span>
              </div>
            ) : isPendingInstitutionalSupport ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-500/40 w-full font-semibold">
                <DollarSign size={12} className="text-emerald-400 shrink-0" />
                <span className="truncate">College Fund Requested</span>
              </div>
            ) : isRiskEvaluated ? (
              <span className="text-xs text-slate-400 italic">No interventions logged</span>
            ) : (
              <span className="text-xs text-slate-500 italic">Pending Evaluation</span>
            )}

            <button
              type="button"
              onClick={() => onOpenDetailModal && onOpenDetailModal(student)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer bg-slate-800/70 hover:bg-slate-800 px-2 py-1 rounded border border-slate-700/60"
            >
              <Eye size={12} />
              <span>Details & Audit Log</span>
            </button>
          </div>
        ) : isRiskEvaluated ? (
          /* TEACHER VIEW: RECOMMENDED INTERVENTIONS */
          <div className="flex flex-col gap-2 min-w-[170px] max-w-[220px]">
            {/* Case A: Lack of Interest / Mental Health / Disengagement (Strict Isolation) */}
            {isCaseA ? (
              <div className="space-y-1.5">
                {assignedCounselor ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-950/40 p-1.5 rounded-lg border border-purple-800/40 w-full">
                    <UserCheck size={12} className="text-purple-400 shrink-0" />
                    <span className="truncate">Counselor Assigned</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAssignCounselor && onAssignCounselor(student)}
                    className="h-8 w-full px-3 bg-purple-900/40 text-purple-200 border border-purple-500/50 hover:bg-purple-800/50 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
                    title="Case A: Supportive Counseling Protocol (Academic Penalty Suppressed)"
                  >
                    <UserCheck size={13} className="text-purple-300 shrink-0" />
                    <span>Assign Counselor</span>
                  </button>
                )}
                <div className="text-[10px] text-purple-300/80 font-medium">
                  Supportive Counseling Priority
                </div>
              </div>
            ) : isCaseB ? (
              /* Case B: Student has Interest, but cannot study due to Financial Issues */
              <div className="space-y-1.5">
                {isPendingInstitutionalSupport ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-500/40 w-full font-semibold">
                    <DollarSign size={12} className="text-emerald-400 shrink-0" />
                    <span className="truncate">Pending Support</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onGrantFinancialAid && onGrantFinancialAid(student)}
                    className="h-8 w-full px-2.5 bg-emerald-900/40 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-800/50 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
                  >
                    <DollarSign size={13} className="text-emerald-300 shrink-0" />
                    <span>Request College Fund</span>
                  </button>
                )}

                {/* Assign Counselor button next to / alongside Request College Fund */}
                {assignedCounselor ? (
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-950/30 px-2 py-1 rounded border border-purple-800/30 w-full">
                    <UserCheck size={11} className="text-purple-400 shrink-0" />
                    <span className="truncate">Counselor Assigned</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAssignCounselor && onAssignCounselor(student)}
                    className="h-7 w-full px-2 bg-purple-950/40 text-purple-300 border border-purple-700/40 hover:bg-purple-900/50 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    title="Assign Counselor to support student"
                  >
                    <UserCheck size={12} className="text-purple-400 shrink-0" />
                    <span>Assign Counselor</span>
                  </button>
                )}

                <div className="text-[10px] text-emerald-300/80 font-medium">
                  Financial Relief Track
                </div>
              </div>
            ) : (
              /* Case C: Purely Academic Concerns */
              <div className="space-y-1">
                {assignedPlan ? (
                  <div className="bg-emerald-950/50 border border-emerald-500/40 p-2 rounded-lg flex flex-col gap-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                      <Check size={13} className="text-emerald-400 shrink-0" />
                      <span className="line-clamp-1">Assigned: {planTitle}</span>
                    </div>
                  </div>
                ) : evaluationAnalysis.showAcademicPlanBtn ? (
                  <button
                    type="button"
                    onClick={handleAcademicPlanClick}
                    className="h-8 w-full px-3 bg-amber-900/30 text-amber-200 border border-amber-500/40 hover:bg-amber-800/40 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
                  >
                    <BookOpen size={13} className="text-amber-300 shrink-0" />
                    <span>Academic Plan</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">Standard Monitoring</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">Awaiting AI Evaluation</span>
        )}
      </td>

      {/* Control Actions */}
      {showActions && (
        <td className="py-4 px-5 text-right">
          <div className="flex items-center justify-end gap-2">
            {/* DETAIL PANEL BUTTON */}
            <button
              type="button"
              onClick={() => onOpenDetailModal && onOpenDetailModal(student)}
              className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm shrink-0"
              title="View Full Profile & Student Detail Panel"
            >
              <Eye size={13} className="text-indigo-400 shrink-0" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenRecordModal && onOpenRecordModal(student)}
              className="h-8 px-2.5 bg-[#1e1c3b] hover:bg-[#28254f] text-[#a5b4fc] border border-[#3b3566] rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm shrink-0"
              title="Edit Marks"
            >
              <Edit3 size={13} className="text-[#818cf8] shrink-0" />
              <span>Marks</span>
            </button>

            {/* AI EVALUATE BUTTON */}
            <button
              type="button"
              onClick={() => onEvaluateRisk && onEvaluateRisk(studentDbId)}
              disabled={!canEvaluate || isEvaluatingThisStudent}
              title={getEvaluateTooltip()}
              className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                canEvaluate
                  ? 'bg-[#26180b] hover:bg-[#38220f] text-[#fde047] border border-[#78350f] cursor-pointer shadow-sm active:scale-95'
                  : 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
              }`}
            >
              {isEvaluatingThisStudent ? (
                <Loader2 size={13} className="animate-spin text-amber-300 shrink-0" />
              ) : (
                <Sparkles size={13} className="text-[#facc15] shrink-0" />
              )}
              <span>{isEvaluatingThisStudent ? 'Evaluating...' : isRiskEvaluated ? 'Re-evaluate' : 'AI Evaluate'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDeleteStudent && onDeleteStudent(studentDbId, student.name)}
              className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 rounded-lg transition cursor-pointer active:scale-95 shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

// --- MAIN TABLE COMPONENT ---
export default function StudentRosterTable({
  students = [],
  loading = false,
  evaluatingStudentId = null,
  onOpenRecordModal,
  onDeleteStudent,
  onEvaluateRisk,
  onAssignCounselor,
  onAcademicIntervention,
  onAssignPlan,
  onGrantFinancialAid,
  onOpenDetailModal,
  showActions = true,
}) {
  const totalColumns = showActions ? 7 : 6;

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#080c14] text-slate-400 text-[11px] font-semibold uppercase tracking-wider select-none">
              <th className="py-4 px-5">Student</th>
              <th className="py-4 px-5">ID / Year</th>
              <th className="py-4 px-5">CGPA / Attendance</th>
              <th className="py-4 px-5">Survey Status</th>
              <th className="py-4 px-5">Risk Evaluation</th>
              <th className="py-4 px-5">{showActions ? 'Recommended Intervention' : 'Actions Logged'}</th>
              {showActions && <th className="py-4 px-5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {loading ? (
              <tr>
                <td colSpan={totalColumns} className="py-12 text-center text-slate-400 italic">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin text-indigo-400" />
                    <span>Loading class roster...</span>
                  </div>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="py-12 text-center text-slate-500 italic">
                  No students found matching the selected filter.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <StudentRosterRow
                  key={student._id || student.id}
                  student={student}
                  evaluatingStudentId={evaluatingStudentId}
                  showActions={showActions}
                  onOpenRecordModal={onOpenRecordModal}
                  onDeleteStudent={onDeleteStudent}
                  onEvaluateRisk={onEvaluateRisk}
                  onAssignCounselor={onAssignCounselor}
                  onAcademicIntervention={onAcademicIntervention}
                  onAssignPlan={onAssignPlan}
                  onGrantFinancialAid={onGrantFinancialAid}
                  onOpenDetailModal={onOpenDetailModal}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}