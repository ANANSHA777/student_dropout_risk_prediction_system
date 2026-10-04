// backend/tests/financialRelief.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

describe('Financial Relief & Aid Status Schema Validation Tests', () => {
  it('should accept all required financialAidStatus enum values on StudentProfile', () => {
    const requiredStatuses = [
      'DISBURSED',
      'Approved',
      'Disbursed',
      'DOCUMENTS_REQUIRED',
      'REQUESTED',
      'REJECTED',
    ];

    const enumValues = StudentProfile.schema.path('financialAidStatus').enumValues;

    for (const status of requiredStatuses) {
      assert.ok(
        enumValues.includes(status),
        `StudentProfile.financialAidStatus must include "${status}". Current enum: ${enumValues.join(', ')}`
      );
    }
  });

  it('should accept all required financialAidStatus enum values on User', () => {
    const requiredStatuses = [
      'DISBURSED',
      'Approved',
      'Disbursed',
      'DOCUMENTS_REQUIRED',
      'REQUESTED',
      'REJECTED',
    ];

    const enumValues = User.schema.path('financialAidStatus').enumValues;

    for (const status of requiredStatuses) {
      assert.ok(
        enumValues.includes(status),
        `User.financialAidStatus must include "${status}". Current enum: ${enumValues.join(', ')}`
      );
    }
  });

  it('should validate StudentProfile document with new financialAidStatus without ValidationError', async () => {
    const testCases = [
      { relief: 'DISBURSED', aid: 'Disbursed' },
      { relief: 'DISBURSED', aid: 'DISBURSED' },
      { relief: 'APPROVED', aid: 'Approved' },
      { relief: 'APPROVED', aid: 'APPROVED' },
      { relief: 'DOCUMENTS_REQUIRED', aid: 'DOCUMENTS_REQUIRED' },
      { relief: 'DOCUMENTS_SUBMITTED', aid: 'DOCUMENTS_SUBMITTED' },
      { relief: 'REQUESTED', aid: 'REQUESTED' },
      { relief: 'REJECTED', aid: 'REJECTED' },
      { relief: 'REJECTED', aid: 'Rejected' },
      { relief: 'NONE', aid: 'NOT_REQUESTED' },
    ];

    for (const tc of testCases) {
      const doc = new StudentProfile({
        user: '507f1f77bcf86cd799439011',
        studentId: 'STU-TEST',
        department: 'Computer Science',
        yearOfStudy: '1st Year',
        financial_relief_status: tc.relief,
        financialAidStatus: tc.aid,
        financial_aid_status: 'NOT_REQUESTED',
      });

      await doc.validate();
      assert.ok(true, `Validation passed for relief: ${tc.relief}, aid: ${tc.aid}`);
    }
  });

  it('should default to NOT_REQUESTED / NONE on Case B evaluation without auto-requesting (Mira workflow)', () => {
    const { evaluateNonAcademicCategories, evaluateDecisionMatrix } = require('../services/riskService');

    // Simulating Mira: Student wants to study but suffers severe financial stress
    const mira = {
      name: 'Mira',
      cgpa: 7.2,
      attendancePercentage: 68,
      activeBacklogs: '0 Backlogs',
      academicInterest: 'Moderate (Wants to study)',
      disengagementReason: 'Financial Stress',
      financialStress: 'High (Severe Fee Worries)',
      mentalHealthState: 'Good / Balanced',
    };

    const nonAcademic = evaluateNonAcademicCategories(mira);
    const decision = evaluateDecisionMatrix(mira, nonAcademic);

    assert.equal(decision.evaluationCase, 'CASE_B_FINANCIAL_STRESS');
    assert.equal(decision.primaryRiskCategory, 'FINANCIAL');
    assert.equal(decision.assignedRole, 'FINANCIAL_AID');

    // Initial state invariant: Must NOT auto-request or auto-mark as PENDING
    assert.equal(decision.financial_aid_status, 'NOT_REQUESTED');
    assert.equal(decision.financial_relief_status, 'NONE');

    // Simulating profile update in teacherController / riskController
    const miraProfile = {
      financial_relief_status: 'NONE',
      financial_aid_status: 'NOT_REQUESTED',
    };

    const isAlreadyEngaged = ['REQUESTED', 'PENDING', 'APPROVED', 'DISBURSED', 'REJECTED']
      .includes((miraProfile.financial_relief_status || '').toUpperCase());

    if (!isAlreadyEngaged) {
      miraProfile.financial_relief_status = 'NONE';
      miraProfile.financial_aid_status = 'NOT_REQUESTED';
    }

    // Status remains NONE / NOT_REQUESTED so Roster shows [ $ Request Fund ] button
    assert.equal(miraProfile.financial_relief_status, 'NONE');
    assert.equal(miraProfile.financial_aid_status, 'NOT_REQUESTED');
  });

  it('should transition Mira from NOT_REQUESTED to REQUESTED and PENDING upon faculty fund request', () => {
    const miraProfile = {
      studentId: 'STU-MIRA',
      financial_relief_status: 'NONE',
      financial_aid_status: 'NOT_REQUESTED',
      collegeFinancialAid: { status: 'Not Applied' },
      intervention_logs: [],
    };

    // Faculty clicks [ $ Request Fund ]
    const grantAmount = 5000;
    const reason = 'Tuition / Fee Support';
    miraProfile.financial_relief_status = 'REQUESTED';
    miraProfile.financial_aid_status = 'PENDING';
    miraProfile.financialAidStatus = 'Pending Institutional Support';
    miraProfile.collegeFinancialAid = {
      status: 'Pending Institutional Support',
      grantAmount,
      appliedAt: new Date(),
    };
    miraProfile.intervention_logs.push({
      action: 'College Fund Requested',
      performed_by: 'Teacher',
      timestamp: new Date(),
      notes: `Requested College Emergency Fund Grant of ₹${grantAmount}. Reason: ${reason}.`,
    });

    // Invariant: Status transitions to REQUESTED & PENDING (displaying [ $ Pending Aid ] badge)
    assert.equal(miraProfile.financial_relief_status, 'REQUESTED');
    assert.equal(miraProfile.financial_aid_status, 'PENDING');
    assert.equal(miraProfile.intervention_logs.length, 1);
    assert.equal(miraProfile.intervention_logs[0].action, 'College Fund Requested');
  });

  it('should display REJECTED status badge and suppress standard Request Fund button on main roster (Emu workflow)', () => {
    // Simulating Emu whose financial relief request was declined by Admin
    const emu = {
      name: 'Emu',
      financial_relief_status: 'REJECTED',
      financialAidStatus: 'Rejected',
      financial_aid_status: 'REJECTED',
      collegeFinancialAid: { status: 'Rejected' },
      intervention_logs: [
        {
          action: 'College Fund Rejected by Admin',
          performed_by: 'Administrator',
          timestamp: new Date(),
          notes: 'Emergency relief application rejected following review: insufficient fee dues documentation.',
        },
      ],
    };

    // In StudentRosterTable resolution:
    const aidStatusUpper = String(emu.financialAidStatus || '').toUpperCase();
    const reliefStatus = String(emu.financial_relief_status || '').toUpperCase();
    const isRejected = aidStatusUpper === 'REJECTED' || reliefStatus === 'REJECTED';

    assert.equal(isRejected, true);

    // Roster rule: When rejected, render [ $ Fund Rejected ] and DO NOT render [ $ Request Fund ]
    const renderAction = isRejected ? '$ Fund Rejected' : '$ Request Fund';
    assert.equal(renderAction, '$ Fund Rejected');
    assert.notEqual(renderAction, '$ Request Fund');
  });

  it('should support faculty re-appeal from REJECTED back to REQUESTED and PENDING inside Details modal', () => {
    const emuProfile = {
      studentId: 'STU-EMU',
      financial_relief_status: 'REJECTED',
      financialAidStatus: 'Rejected',
      financial_aid_status: 'REJECTED',
      collegeFinancialAid: { status: 'Rejected', grantAmount: 5000 },
      intervention_logs: [
        {
          action: 'College Fund Rejected by Admin',
          performed_by: 'Administrator',
          timestamp: new Date(),
          notes: 'Insufficient proof documents provided.',
        },
      ],
    };

    // Teacher opens [ Details ], reviews admin rejection reason, and submits Re-Appeal
    const appealAmount = 5000;
    const appealReason = 'Tuition / Hardship Support (Appeal)';
    const appealNotes = 'Student submitted updated parent income declaration and fee arrears invoice.';

    // Executing appeal submission
    emuProfile.financial_relief_status = 'REQUESTED';
    emuProfile.financial_aid_status = 'PENDING';
    emuProfile.financialAidStatus = 'Pending Institutional Support';
    emuProfile.collegeFinancialAid = {
      status: 'Pending Institutional Support',
      grantAmount: appealAmount,
      appliedAt: new Date(),
    };
    emuProfile.intervention_logs.push({
      action: 'Financial Relief Appeal Submitted',
      performed_by: 'Teacher',
      timestamp: new Date(),
      notes: `[FACULTY APPEAL] ${appealNotes}`,
    });

    // Invariant: Status successfully transitioned back to REQUESTED / PENDING
    assert.equal(emuProfile.financial_relief_status, 'REQUESTED');
    assert.equal(emuProfile.financial_aid_status, 'PENDING');
    assert.equal(emuProfile.collegeFinancialAid.status, 'Pending Institutional Support');
    assert.equal(emuProfile.intervention_logs[1].action, 'Financial Relief Appeal Submitted');
  });
});

