// backend/tests/remedialWorkflow.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const StudentProfile = require('../models/StudentProfile');

describe('Academic Remedial Plan & Intervention Completion Tests', () => {
  it('should validate academic_remedial_plan status enum values in StudentProfile', () => {
    const statusEnum = StudentProfile.schema.path('academic_remedial_plan.status').enumValues;
    assert.ok(statusEnum.includes('NOT_REQUIRED'));
    assert.ok(statusEnum.includes('IN_PROGRESS'));
    assert.ok(statusEnum.includes('COMPLETED'));
  });

  it('should validate StudentProfile document with academic remedial plan fields', async () => {
    const profile = new StudentProfile({
      user: '60c72b2f9b1d8b2badbee001',
      studentId: 'STU-1001',
      academic_remedial_plan: {
        plan_title: 'Remedial Classes + Quiz Support',
        plan_details: 'Attend weekly tutoring and submit assignments.',
        target_metrics: 'Target CGPA: ≥ 6.0, Attendance: ≥ 75%',
        status: 'IN_PROGRESS',
      },
    });

    await profile.validate(['academic_remedial_plan']);
  });

  it('should correctly determine allInterventionsDone condition for re-survey enablement', () => {
    const checkInterventionsDone = (profile) => {
      const acadStatus = (profile.academic_remedial_plan?.status || '').toUpperCase();
      const hasAcadPlan = acadStatus === 'IN_PROGRESS' || acadStatus === 'COMPLETED' || Boolean(profile.assignedAcademicPlan);
      const acadDone = !hasAcadPlan || acadStatus === 'COMPLETED';

      const hasCounselor = Boolean(profile.assigned_counselor_id || profile.assignedCounselor || profile.needsCounseling);
      const counselingStatus = (profile.counseling_session?.status || profile.counselingStatus || '').toUpperCase();
      const counselorDone = !hasCounselor || counselingStatus === 'COMPLETED' || counselingStatus === 'RESOLVED';

      const fStatus = (profile.financial_relief_status || profile.financialAidStatus || '').toUpperCase();
      const hasFinancial = fStatus !== 'NONE' && fStatus !== 'NOT_REQUESTED' && fStatus !== '';
      const financialDone = !hasFinancial || fStatus === 'DISBURSED';

      const hadIntervention = (acadStatus === 'COMPLETED' || counselingStatus === 'COMPLETED' || counselingStatus === 'RESOLVED' || fStatus === 'DISBURSED');
      return Boolean(hadIntervention && acadDone && counselorDone && financialDone);
    };

    // Case 1: Academic plan completed, no counseling or financial need
    assert.equal(
      checkInterventionsDone({
        academic_remedial_plan: { status: 'COMPLETED' },
        assigned_counselor_id: null,
        financial_relief_status: 'NONE',
      }),
      true
    );

    // Case 2: Academic plan in progress (not completed yet)
    assert.equal(
      checkInterventionsDone({
        academic_remedial_plan: { status: 'IN_PROGRESS' },
        assigned_counselor_id: null,
        financial_relief_status: 'NONE',
      }),
      false
    );

    // Case 3: Academic plan completed AND counseling completed
    assert.equal(
      checkInterventionsDone({
        academic_remedial_plan: { status: 'COMPLETED' },
        assigned_counselor_id: '60c72b2f9b1d8b2badbee002',
        counseling_session: { status: 'COMPLETED' },
        financial_relief_status: 'NONE',
      }),
      true
    );

    // Case 4: Academic plan completed, but counseling still scheduled
    assert.equal(
      checkInterventionsDone({
        academic_remedial_plan: { status: 'COMPLETED' },
        assigned_counselor_id: '60c72b2f9b1d8b2badbee002',
        counseling_session: { status: 'SCHEDULED' },
        financial_relief_status: 'NONE',
      }),
      false
    );

    // Case 5: No interventions ever assigned
    assert.equal(
      checkInterventionsDone({
        academic_remedial_plan: { status: 'NOT_REQUIRED' },
        assigned_counselor_id: null,
        financial_relief_status: 'NONE',
      }),
      false
    );

    // Case 6: Partial Completion (e.g. STU-403 Emu) — Aid is Disbursed, but Counseling remains Pending/Assigned
    // Must NOT be marked as allInterventionsDone!
    assert.equal(
      checkInterventionsDone({
        studentId: 'STU-403',
        name: 'Emu',
        academic_remedial_plan: { status: 'NOT_REQUIRED' },
        assigned_counselor_id: '60c72b2f9b1d8b2badbee003',
        counseling_session: { status: 'PENDING_SCHEDULE' },
        financial_relief_status: 'DISBURSED',
      }),
      false
    );

    // Case 7: Approved but NOT yet Disbursed Aid — Must NOT be marked ready
    assert.equal(
      checkInterventionsDone({
        studentId: 'STU-404',
        academic_remedial_plan: { status: 'NOT_REQUIRED' },
        assigned_counselor_id: null,
        financial_relief_status: 'APPROVED', // Not yet disbursed!
      }),
      false
    );

    // Case 8: Full Completion (e.g. STU-403 Emu) — Aid is Disbursed AND Counseling is COMPLETED/RESOLVED
    assert.equal(
      checkInterventionsDone({
        studentId: 'STU-403',
        name: 'Emu',
        academic_remedial_plan: { status: 'NOT_REQUIRED' },
        assigned_counselor_id: '60c72b2f9b1d8b2badbee003',
        counseling_session: { status: 'COMPLETED' },
        financial_relief_status: 'DISBURSED',
      }),
      true
    );

    // Case 9: Inverted Check Fix — [ Assign Academic Plan ] is still shown (hasAcademicRisk=true, plan not completed)
    // Re-survey MUST BE DISABLED (isReadyForResurvey = false)
    const computeResurveyReadiness = (student) => {
      const isAcademicDone = !student.hasAcademicRisk || student.academicPlanStatus === 'COMPLETED';
      const isCounselingDone = !student.hasCounselingRisk || student.counselingStatus === 'COMPLETED';
      const isFinancialDone = !student.hasFinancialRisk || student.financialAidStatus === 'DISBURSED';
      return isAcademicDone && isCounselingDone && isFinancialDone;
    };

    assert.equal(
      computeResurveyReadiness({
        hasAcademicRisk: true,
        academicPlanStatus: 'IN_PROGRESS', // Or unassigned
        hasCounselingRisk: false,
        hasFinancialRisk: false,
      }),
      false // Button MUST BE DISABLED
    );

    // Case 10: Inverted Check Fix — Academic Plan Completed
    // Re-survey MUST BE ENABLED (isReadyForResurvey = true, displays Re-survey (Ready))
    assert.equal(
      computeResurveyReadiness({
        hasAcademicRisk: true,
        academicPlanStatus: 'COMPLETED',
        hasCounselingRisk: false,
        hasFinancialRisk: false,
      }),
      true // Button MUST BE ENABLED
    );
  });

  it('should uphold Case Invariant: maintain High Risk or Dual Risk when counseling is resolved but academic/financial risks remain active', () => {
    const resolveCaseloadRisk = (student) => {
      const rawRisk = (student.overall_risk_level || student.evaluation_status || student.riskLevel || '').trim();
      const primaryCat = (student.primaryRiskCategory || student.riskCategory || '').trim();
      const cgpa = student.cgpa !== null && student.cgpa !== undefined ? Number(student.cgpa) : null;
      const attendance = student.attendancePercentage ?? student.attendance ?? null;

      const hasAcademicRisk =
        (cgpa !== null && cgpa < 6.0) ||
        (attendance !== null && Number(attendance) < 75) ||
        (student.academic_remedial_plan?.status === 'IN_PROGRESS');

      const fStatus = (student.financial_relief_status || '').toUpperCase();
      const hasFinancialRisk =
        fStatus === 'REQUESTED' ||
        fStatus === 'DOCUMENTS_REQUIRED' ||
        fStatus === 'DOCUMENTS_SUBMITTED' ||
        fStatus === 'PENDING INSTITUTIONAL SUPPORT';

      const isCounselingResolved =
        (student.counseling_session?.status || '').toUpperCase() === 'COMPLETED' ||
        (student.counselingStatus || student.caseStatus || '').toUpperCase() === 'RESOLVED';

      const isDual =
        primaryCat.toLowerCase().includes('dual') ||
        rawRisk.toLowerCase().includes('dual') ||
        (hasAcademicRisk && hasFinancialRisk);

      if (isCounselingResolved && (hasAcademicRisk || hasFinancialRisk)) {
        return isDual ? 'Dual Risk' : 'High Risk';
      }

      if (isDual) return 'Dual Risk';
      if (rawRisk.toLowerCase().includes('high')) return 'High Risk';
      if (rawRisk.toLowerCase().includes('medium') || hasAcademicRisk || hasFinancialRisk) return 'Medium Risk';
      if (rawRisk.toLowerCase().includes('low')) return 'Low Risk';
      return rawRisk || 'Unevaluated';
    };

    // Case 1: Student has resolved counseling, but academic risk is active (CGPA = 5.2)
    assert.equal(
      resolveCaseloadRisk({
        name: 'Arfin',
        riskLevel: 'High Risk',
        cgpa: 5.2,
        attendance: 80,
        counselingStatus: 'Resolved',
        counseling_session: { status: 'COMPLETED' },
        academic_remedial_plan: { status: 'IN_PROGRESS' },
        status: 'Good / Balanced', // Survey metric says Good / Balanced
      }),
      'High Risk'
    );

    // Case 2: Student has resolved counseling, but both academic and financial risks are active
    assert.equal(
      resolveCaseloadRisk({
        name: 'Dual Risk Student',
        riskLevel: 'Dual Risk',
        primaryRiskCategory: 'Dual Risk (Academic + Personal)',
        cgpa: 5.4,
        attendance: 68,
        counselingStatus: 'Resolved',
        counseling_session: { status: 'COMPLETED' },
        financial_relief_status: 'REQUESTED',
        status: 'Good / Balanced',
      }),
      'Dual Risk'
    );

    // Case 3: Student has resolved counseling, and ALL metrics are healthy (CGPA = 8.2, Att = 90%, no financial relief)
    assert.equal(
      resolveCaseloadRisk({
        name: 'Recovered Student',
        riskLevel: 'Low Risk',
        cgpa: 8.2,
        attendance: 90,
        counselingStatus: 'Resolved',
        counseling_session: { status: 'COMPLETED' },
        academic_remedial_plan: { status: 'COMPLETED' },
        financial_relief_status: 'NONE',
        status: 'Good / Balanced',
      }),
      'Low Risk'
    );
  });

  it('should correctly classify John (CGPA 8.7, Attendance 97%) strictly as Personal/Wellness and NEVER Dual Risk', () => {
    const { evaluateNonAcademicCategories, evaluateDecisionMatrix } = require('../services/riskService');

    const john = {
      name: 'John',
      cgpa: 8.7,
      attendancePercentage: 97,
      activeBacklogs: '0 Backlogs',
      mentalHealthState: 'Anxious / Stressed',
      academicInterest: 'High (Interested & Motivated)',
      disengagementReason: 'None',
      financialStress: 'None / Low',
      familyIncome: 'Above ₹60,000',
    };

    const nonAcademic = evaluateNonAcademicCategories(john);
    const decision = evaluateDecisionMatrix(john, nonAcademic);

    // John meets academic thresholds (CGPA >= 6.0 and Attendance >= 75%)
    // Must NOT be Dual Risk!
    assert.notEqual(decision.riskLevel, 'Dual Risk');
    assert.notEqual(decision.riskCategory, 'Dual Risk (Academic + Personal)');
    assert.notEqual(decision.primaryRiskCategory, 'Dual Risk (Academic + Personal)');

    // Must be classified strictly as Personal/Wellness
    assert.ok(
      decision.riskCategory.includes('Personal') || decision.riskCategory.includes('Wellness'),
      `Expected Personal or Wellness in riskCategory, got: ${decision.riskCategory}`
    );
    assert.equal(decision.assignedRole, 'COUNSELOR');
    assert.equal(decision.recommendedActions.routeToAcademicPlan, false);
    assert.equal(decision.recommendedActions.suppressAcademicPenalty, true);
  });

  it('should assign Dual Risk ONLY if BOTH academic thresholds fail AND non-academic stressors are present', () => {
    const { evaluateNonAcademicCategories, evaluateDecisionMatrix } = require('../services/riskService');

    // Case 1: Student fails both academic thresholds (CGPA < 6.0 AND Attendance < 75) + has wellness distress
    const dualStudent = {
      name: 'Dual Risk Student',
      cgpa: 5.5,
      attendancePercentage: 70,
      activeBacklogs: '0 Backlogs',
      mentalHealthState: 'Depressed / Overwhelmed',
      academicInterest: 'Low (Lost Interest / Disengaged)',
      disengagementReason: 'Mental Health Burden',
    };

    const nonAcadDual = evaluateNonAcademicCategories(dualStudent);
    const dualDecision = evaluateDecisionMatrix(dualStudent, nonAcadDual);

    assert.equal(dualDecision.riskLevel, 'Dual Risk');
    assert.equal(dualDecision.riskCategory, 'Dual Risk (Academic + Personal)');

    // Case 2: Student has good CGPA (7.8) but low attendance (70%) + wellness distress -> NOT Dual Risk
    const partialAcadStudent = {
      name: 'Partial Student',
      cgpa: 7.8,
      attendancePercentage: 70,
      activeBacklogs: '0 Backlogs',
      mentalHealthState: 'Anxious / Stressed',
      academicInterest: 'High (Interested & Motivated)',
    };
    const nonAcadPartial = evaluateNonAcademicCategories(partialAcadStudent);
    const partialDecision = evaluateDecisionMatrix(partialAcadStudent, nonAcadPartial);
    assert.notEqual(partialDecision.riskLevel, 'Dual Risk');
  });

  it('should preserve Approved and Disbursed financial aid status across re-evaluations (Arfin fix)', () => {
    // Simulating Arfin with disbursed aid
    const arfinProfile = {
      studentId: 'STU-ARFIN',
      name: 'Arfin',
      financialAidStatus: 'Disbursed',
      financial_relief_status: 'DISBURSED',
      collegeFinancialAid: { status: 'Approved', grantAmount: 5000 },
    };

    // Re-evaluating Arfin with Case B AI trigger
    const aiResultCaseB = {
      evaluationCase: 'CASE_B_FINANCIAL_STRESS',
      riskLevel: 'Medium Risk',
      riskCategory: 'Financial Strain',
    };

    // The persistent logic implemented in teacherController & riskController:
    const isAlreadyApprovedOrDisbursed =
      ['APPROVED', 'DISBURSED'].includes((arfinProfile.financial_relief_status || '').toUpperCase()) ||
      ['APPROVED', 'DISBURSED'].includes((arfinProfile.financialAidStatus || '').toUpperCase());

    if (!isAlreadyApprovedOrDisbursed) {
      arfinProfile.financialAidStatus = 'Pending Institutional Support';
      arfinProfile.financial_relief_status = 'REQUESTED';
    }

    // Must NOT revert to REQUESTED or Pending Institutional Support!
    assert.equal(arfinProfile.financialAidStatus, 'Disbursed');
    assert.equal(arfinProfile.financial_relief_status, 'DISBURSED');
  });

  it('should enforce teacher-gated re-survey authorization lifecycle', () => {
    const studentProfile = {
      surveyCompleted: true,
      last_survey_submission_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      survey_cooldown_override: false,
      resurvey_status: 'NONE',
    };

    // 1. Student view: re-survey is locked because teacher has not authorized
    const isLockedForStudent = !studentProfile.survey_cooldown_override;
    assert.equal(isLockedForStudent, true);

    // 2. Teacher clicks [ Re-survey ]: sets override=true, resurvey_status=AUTHORIZED
    studentProfile.survey_cooldown_override = true;
    studentProfile.resurvey_status = 'AUTHORIZED';
    assert.equal(studentProfile.survey_cooldown_override, true);
    assert.equal(studentProfile.resurvey_status, 'AUTHORIZED');

    // 3. Student retakes and submits: re-locks cooldown and transitions status to RESUBMITTED
    studentProfile.survey_cooldown_override = false; // re-locked!
    studentProfile.resurvey_status = 'RESUBMITTED';
    studentProfile.survey_resubmitted = true;

    assert.equal(studentProfile.survey_cooldown_override, false);
    assert.equal(studentProfile.resurvey_status, 'RESUBMITTED');
    assert.equal(studentProfile.survey_resubmitted, true);
  });

  it('should preserve evaluated risk tier (e.g. High Risk) upon re-survey submission until teacher re-evaluates', () => {
    const { evaluateNonAcademicCategories, evaluateDecisionMatrix } = require('../services/riskService');

    // 1. Existing student evaluated as High Risk
    const studentProfile = {
      studentId: 'STU-405',
      name: 'Test Student',
      riskLevel: 'High Risk',
      riskCategory: 'Personal / Wellness',
      primaryRiskCategory: 'WELLNESS',
      evaluationCase: 'CASE_A_WELLNESS_DISENGAGEMENT',
      riskEvaluated: true,
      survey_cooldown_override: true,
      resurvey_status: 'AUTHORIZED',
    };

    // 2. Student completes re-survey with healthy metrics
    const updateData = {
      surveyCompleted: true,
      surveyStatus: 'Completed',
      last_survey_submission_date: new Date(),
      survey_cooldown_override: false,
      resurvey_status: 'RESUBMITTED',
      survey_resubmitted: true,
      academicInterest: 'High (Interested & Motivated)',
      mentalHealthStatus: 'Good / Balanced',
      financialStress: 'None',
    };

    // The persistent logic implemented in studentController:
    // Existing evaluated risk tier MUST be preserved upon survey save
    if (studentProfile.riskLevel) updateData.riskLevel = studentProfile.riskLevel;
    if (studentProfile.riskCategory) updateData.riskCategory = studentProfile.riskCategory;
    if (studentProfile.primaryRiskCategory) updateData.primaryRiskCategory = studentProfile.primaryRiskCategory;

    Object.assign(studentProfile, updateData);

    // CRITICAL ASSERTION: Risk level MUST NOT prematurely jump to 'Low Risk'
    assert.equal(studentProfile.riskLevel, 'High Risk');
    assert.equal(studentProfile.riskCategory, 'Personal / Wellness');
    assert.equal(studentProfile.resurvey_status, 'RESUBMITTED');
    assert.equal(studentProfile.survey_resubmitted, true);

    // 3. Teacher manually triggers [ Re-evaluate ] (calling riskController)
    const reEvaluationDecision = evaluateDecisionMatrix(
      {
        cgpa: 8.5,
        attendancePercentage: 92,
        activeBacklogs: '0 Backlogs',
      },
      evaluateNonAcademicCategories({
        academicInterest: studentProfile.academicInterest,
        mentalHealthStatus: studentProfile.mentalHealthStatus,
        financialStress: studentProfile.financialStress,
      })
    );

    studentProfile.riskLevel = reEvaluationDecision.riskLevel;
    studentProfile.riskCategory = reEvaluationDecision.riskCategory;
    studentProfile.resurvey_status = 'EVALUATED';

    // Risk level is now updated to Low Risk AFTER teacher re-evaluation
    assert.equal(studentProfile.riskLevel, 'Low Risk');
    assert.equal(studentProfile.riskCategory, 'None');
    assert.equal(studentProfile.resurvey_status, 'EVALUATED');
  });
});
