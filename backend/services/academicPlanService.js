// backend/services/academicPlanService.js

/**
 * Academic Plan Module (Strictly Academic)
 * - Handles pure academic metrics only: CGPA, attendance percentages, subject backlogs, and assignment completion.
 * - Generates study schedules, remedial classes, and academic intervention plans.
 * - MUST NOT evaluate or process non-academic or emotional distress root causes.
 */

/**
 * Validates and isolates inputs to ensure no emotional/wellness/financial factors are processed.
 * @param {Object} rawInput 
 * @returns {Object} Cleaned academic-only metrics
 */
function extractPureAcademicMetrics(rawInput = {}) {
  const cgpa = rawInput.cgpa ?? rawInput.latestMarks ?? null;
  const attendancePercentage = rawInput.attendancePercentage ?? rawInput.attendance ?? null;
  const activeBacklogs = rawInput.activeBacklogs ?? '0 Backlogs';
  const assignmentsSubmitted = Number(rawInput.assignmentsSubmitted || 0);
  const assignmentsTotal = Number(rawInput.assignmentsTotal || 0);

  return {
    cgpa: cgpa !== null && cgpa !== undefined ? Number(cgpa) : null,
    attendancePercentage: attendancePercentage !== null && attendancePercentage !== undefined ? Number(attendancePercentage) : null,
    activeBacklogs: String(activeBacklogs),
    assignmentsSubmitted,
    assignmentsTotal,
  };
}

/**
 * Generates an academic intervention plan based strictly on academic metrics.
 * @param {Object} inputMetrics 
 * @returns {Object} Structured academic recovery plan
 */
exports.generateAcademicPlan = (inputMetrics = {}) => {
  const metrics = extractPureAcademicMetrics(inputMetrics);
  const { cgpa, attendancePercentage, activeBacklogs, assignmentsSubmitted, assignmentsTotal } = metrics;

  const backlogCount = parseInt(String(activeBacklogs).match(/\d+/)?.[0] || '0', 10);
  const assignmentRatio = assignmentsTotal > 0 ? assignmentsSubmitted / assignmentsTotal : 1.0;

  let planType = 'Standard Academic Schedule';
  let studyHoursRecommended = '2 - 3 hours/day';
  const remedialClasses = [];
  const cgpaRecoveryMilestones = [];
  let backlogTracking = '0 Backlogs — Standard Progression';

  // 1. Backlog Tracking Strategy
  if (backlogCount > 0) {
    backlogTracking = `Clear ${backlogCount} pending backlog(s) via accelerated weekend revision modules.`;
    remedialClasses.push(`Remedial Problem-Solving Track for ${backlogCount} backlog subject(s)`);
  }

  // 2. CGPA Recovery Milestones & Remedial Classes
  if (cgpa !== null && cgpa < 5.0) {
    planType = 'Intensive Academic Remediation';
    studyHoursRecommended = '4 - 5 hours/day (Structured Study Schedule)';
    remedialClasses.push('Core Foundations Remedial Workshop');
    remedialClasses.push('Daily Supervised Study Hall');
    cgpaRecoveryMilestones.push('Target Midterm CGPA: 6.0');
    cgpaRecoveryMilestones.push('Weekly Diagnostic Progress Quizzes');
  } else if (cgpa !== null && cgpa < 6.5) {
    planType = 'Targeted Academic Support';
    studyHoursRecommended = '3 - 4 hours/day';
    remedialClasses.push('Bi-weekly Faculty Doubt-Clearing Sessions');
    cgpaRecoveryMilestones.push('Target Semester CGPA: 7.0');
  } else {
    cgpaRecoveryMilestones.push('Maintain Target CGPA: >= 7.5');
  }

  // 3. Attendance Gaps
  if (attendancePercentage !== null && attendancePercentage < 75) {
    remedialClasses.push('Compensatory Attendance Lectures & Lab Hours');
  }

  // 4. Assignment Completion
  if (assignmentRatio < 0.7) {
    remedialClasses.push('Assignment Catch-Up Clinic with Peer Mentor');
  }

  if (remedialClasses.length === 0) {
    remedialClasses.push('Advanced Elective Prep & Honors Seminar');
    cgpaRecoveryMilestones.push("Target Dean's List Academic Standing (CGPA >= 8.5)");
  }

  const studySchedule = `Allocated ${studyHoursRecommended}. Focus: 60% Core Modules, 40% Practical/Quiz Review.`;

  return {
    isAcademicPlan: true,
    module: 'Academic Plan Module (Strictly Academic)',
    planType,
    studySchedule,
    remedialClasses,
    backlogTracking,
    cgpaRecoveryMilestones,
    generatedAt: new Date().toISOString(),
    metricsUsed: {
      cgpa,
      attendancePercentage,
      activeBacklogs: backlogCount,
      assignmentRatio: Math.round(assignmentRatio * 100) + '%',
    },
  };
};

exports.extractPureAcademicMetrics = extractPureAcademicMetrics;
