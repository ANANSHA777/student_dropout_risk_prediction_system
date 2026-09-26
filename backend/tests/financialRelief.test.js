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
    ];

    for (const tc of testCases) {
      const doc = new StudentProfile({
        user: '507f1f77bcf86cd799439011',
        studentId: 'STU-TEST',
        department: 'Computer Science',
        yearOfStudy: '1st Year',
        financial_relief_status: tc.relief,
        financialAidStatus: tc.aid,
      });

      await doc.validate();
      assert.ok(true, `Validation passed for relief: ${tc.relief}, aid: ${tc.aid}`);
    }
  });
});
