// backend/tests/riskEvaluation.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  evaluateNonAcademicCategories,
  evaluateDecisionMatrix,
  evaluateFallbackRules,
} = require('../services/riskService');
const {
  generateAcademicPlan,
  extractPureAcademicMetrics,
} = require('../services/academicPlanService');

describe('Student Risk Evaluation & Action System — Unit Tests', () => {

  // =========================================================================
  // 1. NON-ACADEMIC CATEGORY EVALUATION TESTS
  // =========================================================================
  describe('Non-Academic Risk Criteria Mapping', () => {
    it('should map student factors strictly to Wellness, Disengagement, and Financial categories', () => {
      const studentData = {
        mentalHealthState: 'Anxious / Stressed',
        nightlySleepHours: 'Less than 5 hours',
        academicInterest: 'Low (Lost Interest)',
        disengagementReason: 'Mental Health Burden',
        financialStress: 'High (Severe Fee Worries)',
        familyMonthlyIncome: 'Below ₹15,000',
      };

      const categories = evaluateNonAcademicCategories(studentData);

      assert.ok(categories.wellness, 'Wellness category must exist');
      assert.ok(categories.disengagement, 'Disengagement category must exist');
      assert.ok(categories.financial, 'Financial category must exist');

      assert.equal(categories.wellness.level, 'High');
      assert.equal(categories.disengagement.level, 'High');
      assert.equal(categories.disengagement.rootCause, 'Mental Health Burden');
      assert.equal(categories.financial.level, 'High');
    });
  });

  // =========================================================================
  // 2. CASE A: LACK OF INTEREST / MENTAL HEALTH / DISENGAGEMENT
  // =========================================================================
  describe('Case A: Disinterest & Mental Health Workflow', () => {
    it('should trigger Counselor Assignment and strictly isolate from academic penalties for mental health distress', () => {
      const caseAStudent = {
        cgpa: 5.2,
        attendancePercentage: 68,
        mentalHealthState: 'Depressed / Overwhelmed',
        nightlySleepHours: 'Less than 5 hours',
        academicInterest: 'Low (Lost Interest / Disengaged)',
        disengagementReason: 'Mental Health Burden',
        financialStress: 'None / Low',
      };

      const nonAcademic = evaluateNonAcademicCategories(caseAStudent);
      const decision = evaluateDecisionMatrix(caseAStudent, nonAcademic);

      assert.equal(
        decision.evaluationCase,
        'CASE_A_WELLNESS_DISENGAGEMENT',
        'Should classify under Case A'
      );
      assert.equal(
        decision.assignedRole,
        'COUNSELOR',
        'Case A must route to COUNSELOR'
      );
      assert.ok(
        ['WELLNESS', 'DISENGAGEMENT'].includes(decision.primaryRiskCategory),
        'Primary category must be WELLNESS or DISENGAGEMENT'
      );

      // Trigger Actions
      assert.equal(
        decision.recommendedActions.assignCounselor,
        true,
        'Must recommend Counselor Assignment'
      );
      assert.equal(
        decision.recommendedActions.createCounselingLog,
        true,
        'Must flag creation of Counseling Log'
      );

      // Strict Isolation: Do NOT trigger an academic penalty plan
      assert.equal(
        decision.recommendedActions.suppressAcademicPenalty,
        true,
        'Strict Isolation: Must suppress academic penalty plan'
      );
      assert.equal(
        decision.recommendedActions.routeToAcademicPlan,
        false,
        'Must NOT route to academic penalty plan while student has emotional distress'
      );
      assert.equal(
        decision.recommendedActions.enableRemedialQuiz,
        false,
        'Must NOT impose remedial quizzes as penalty for mental health distress'
      );
    });

    it('should trigger Counselor Assignment for pure study disinterest / low motivation', () => {
      const disinterestedStudent = {
        cgpa: 6.8,
        attendancePercentage: 78,
        academicInterest: 'Low (Lost Interest / Disengaged)',
        disengagementReason: 'Low Study Interest',
        mentalHealthState: 'Good / Balanced',
        financialStress: 'None',
      };

      const nonAcademic = evaluateNonAcademicCategories(disinterestedStudent);
      const decision = evaluateDecisionMatrix(disinterestedStudent, nonAcademic);

      assert.equal(decision.evaluationCase, 'CASE_A_WELLNESS_DISENGAGEMENT');
      assert.equal(decision.assignedRole, 'COUNSELOR');
      assert.equal(decision.recommendedActions.assignCounselor, true);
      assert.equal(decision.recommendedActions.suppressAcademicPenalty, true);
      assert.equal(decision.recommendedActions.routeToAcademicPlan, false);
    });
  });

  // =========================================================================
  // 3. CASE B: STUDENT HAS INTEREST, BUT CANNOT STUDY DUE TO FINANCIAL ISSUES
  // =========================================================================
  describe('Case B: Financial Hardship with Study Motivation Workflow', () => {
    it('should trigger College Fund Request and mark status as Pending Institutional Support', () => {
      const caseBStudent = {
        cgpa: 5.8,
        attendancePercentage: 70, // Dropping performance due to work/fees
        academicInterest: 'High (Interested & Motivated)',
        disengagementReason: 'None',
        financialStress: 'Critical (Severe Fee Worries / Inability to pay tuition)',
        familyMonthlyIncome: 'Below ₹15,000',
        mentalHealthState: 'Good / Balanced',
      };

      const nonAcademic = evaluateNonAcademicCategories(caseBStudent);
      const decision = evaluateDecisionMatrix(caseBStudent, nonAcademic);

      assert.equal(
        decision.evaluationCase,
        'CASE_B_FINANCIAL_STRESS',
        'Should classify under Case B'
      );
      assert.equal(
        decision.assignedRole,
        'FINANCIAL_AID',
        'Must route to FINANCIAL_AID'
      );
      assert.equal(
        decision.primaryRiskCategory,
        'FINANCIAL',
        'Primary category must be FINANCIAL'
      );

      // Trigger Actions
      assert.equal(
        decision.recommendedActions.requestCollegeFund,
        true,
        'Must trigger College Fund Allocation request'
      );
      assert.equal(
        decision.recommendedActions.grantFinancialAid,
        true,
        'Must enable financial aid grant workflow'
      );
      assert.equal(
        decision.recommendedActions.markPendingInstitutionalSupport,
        true,
        'Must mark student as Pending Institutional Support'
      );

      // Isolation: Does not punish with academic penalty
      assert.equal(
        decision.recommendedActions.routeToAcademicPlan,
        false,
        'Should not impose academic penalties when drop is driven by tuition inability'
      );
    });

    it('should handle students who want to study but report Financial Stress as disengagement reason', () => {
      const financialBarrierStudent = {
        cgpa: 6.0,
        attendancePercentage: 65,
        academicInterest: 'Moderate (Wants to study)',
        disengagementReason: 'Financial Stress',
        financialStress: 'High',
        mentalHealthState: 'Good',
      };

      const nonAcademic = evaluateNonAcademicCategories(financialBarrierStudent);
      const decision = evaluateDecisionMatrix(financialBarrierStudent, nonAcademic);

      assert.equal(decision.evaluationCase, 'CASE_B_FINANCIAL_STRESS');
      assert.equal(decision.assignedRole, 'FINANCIAL_AID');
      assert.equal(decision.recommendedActions.requestCollegeFund, true);
      assert.equal(decision.recommendedActions.markPendingInstitutionalSupport, true);
    });
  });

  // =========================================================================
  // 4. CASE C: MIXED / PURELY ACADEMIC ISSUES
  // =========================================================================
  describe('Case C: Pure Academic Issues Workflow', () => {
    it('should route directly to Academic Plan Module for pure academic and backlog difficulties', () => {
      const pureAcademicStudent = {
        cgpa: 4.8,
        attendancePercentage: 68,
        activeBacklogs: '2 Backlogs',
        academicInterest: 'High (Interested & Motivated)',
        disengagementReason: 'None',
        mentalHealthState: 'Good / Balanced',
        financialStress: 'None / Low',
        familyMonthlyIncome: 'Above ₹60,000',
      };

      const nonAcademic = evaluateNonAcademicCategories(pureAcademicStudent);
      const decision = evaluateDecisionMatrix(pureAcademicStudent, nonAcademic);

      assert.equal(
        decision.evaluationCase,
        'CASE_C_PURE_ACADEMIC',
        'Should classify under Case C'
      );
      assert.equal(
        decision.assignedRole,
        'TEACHER',
        'Pure academic issues must route to TEACHER'
      );
      assert.equal(
        decision.primaryRiskCategory,
        'ACADEMIC',
        'Primary category must be ACADEMIC'
      );

      // Trigger Actions
      assert.equal(
        decision.recommendedActions.routeToAcademicPlan,
        true,
        'Must route directly to Academic Plan Module'
      );
      assert.equal(
        decision.recommendedActions.enableRemedialQuiz,
        true,
        'Must enable remedial quiz practice'
      );
      assert.equal(
        decision.recommendedActions.matchPeerTutor,
        true,
        'Must recommend peer tutor match'
      );
      assert.equal(
        decision.recommendedActions.assignCounselor,
        false,
        'Should NOT escalate to counselor for pure academic challenge'
      );
      assert.equal(
        decision.recommendedActions.requestCollegeFund,
        false,
        'Should NOT request financial relief for pure academic challenge'
      );
    });
  });

  // =========================================================================
  // 5. ACADEMIC PLAN MODULE ISOLATION (STRICTLY ACADEMIC)
  // =========================================================================
  describe('Academic Plan Module (Strictly Academic)', () => {
    it('should calculate study schedules and remedial classes based strictly on CGPA, attendance, and backlogs', () => {
      const academicData = {
        cgpa: 4.2,
        attendancePercentage: 65,
        activeBacklogs: '3 Backlogs',
        assignmentsSubmitted: 3,
        assignmentsTotal: 10,
        // Non-academic fields that MUST NOT alter academic logic
        mentalHealthState: 'Depressed / Overwhelmed',
        financialStress: 'Severe',
      };

      const plan = generateAcademicPlan(academicData);

      assert.equal(plan.isAcademicPlan, true);
      assert.equal(plan.planType, 'Intensive Academic Remediation');
      assert.ok(
        plan.studySchedule.includes('4 - 5 hours/day'),
        'Study schedule must reflect intensive need'
      );
      assert.ok(
        plan.remedialClasses.some((r) => r.includes('3 backlog')),
        'Must schedule remedial track for 3 backlogs'
      );
      assert.ok(
        plan.remedialClasses.some((r) => r.includes('Compensatory Attendance')),
        'Must schedule compensatory attendance for < 75%'
      );
      assert.ok(
        plan.remedialClasses.some((r) => r.includes('Assignment Catch-Up')),
        'Must schedule clinic for low assignment ratio'
      );
    });

    it('extractPureAcademicMetrics should strip out non-academic fields', () => {
      const contaminatedData = {
        cgpa: 7.8,
        attendancePercentage: 88,
        activeBacklogs: '0 Backlogs',
        assignmentsSubmitted: 5,
        assignmentsTotal: 5,
        emotionalDistress: 'High',
        financialDistress: 'Critical',
        trauma: 'Severe',
      };

      const cleaned = extractPureAcademicMetrics(contaminatedData);

      assert.equal(cleaned.cgpa, 7.8);
      assert.equal(cleaned.attendancePercentage, 88);
      assert.equal(cleaned.activeBacklogs, '0 Backlogs');
      assert.equal(cleaned.emotionalDistress, undefined);
      assert.equal(cleaned.financialDistress, undefined);
      assert.equal(cleaned.trauma, undefined);
    });
  });
});
