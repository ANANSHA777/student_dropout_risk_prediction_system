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

      const hasCounselor = Boolean(profile.assigned_counselor_id || profile.assignedCounselor);
      const counselingStatus = (profile.counseling_session?.status || '').toUpperCase();
      const counselorDone = !hasCounselor || counselingStatus === 'COMPLETED';

      const fStatus = (profile.financial_relief_status || '').toUpperCase();
      const hasFinancial = fStatus !== 'NONE' && fStatus !== '';
      const financialDone = !hasFinancial || fStatus === 'APPROVED' || fStatus === 'DISBURSED';

      const hadIntervention = (acadStatus === 'COMPLETED' || counselingStatus === 'COMPLETED' || fStatus === 'APPROVED' || fStatus === 'DISBURSED');
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
});
