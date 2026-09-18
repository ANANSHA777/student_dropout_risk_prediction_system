// backend/controllers/teacherController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CounselingSession = require('../models/CounselingSession');
const { evaluateStudentRiskWithGemini } = require('../services/riskService');

// @desc    Enroll / Create a new Student account & profile
// @route   POST /api/teacher/students
// @access  Private (Teacher, Admin)
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, initialPassword, studentId, department, yearOfStudy } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const assignedDept = department ? department.trim() : 'Computer Science';
    const assignedStudentId = studentId ? studentId.trim() : '';
    const assignedYear = yearOfStudy ? yearOfStudy.trim() : '1st Year';

    // 1. Create User Document
    const user = await User.create({
      name: name ? name.trim() : '',
      email: normalizedEmail,
      password: password || initialPassword || 'Student123!',
      role: 'Student',
      studentId: assignedStudentId,
      department: assignedDept,
      yearOfStudy: assignedYear,
      cgpa: null,
      attendance: null,
      riskLevel: null, // Unevaluated by default
      surveyCompleted: false,
    });

    // 2. Create Student Profile Document
    const profile = await StudentProfile.create({
      user: user._id,
      studentId: assignedStudentId || `STU-${user._id.toString().slice(-4)}`,
      department: assignedDept,
      yearOfStudy: assignedYear,
      cgpa: null,
      attendancePercentage: null,
      riskLevel: null,
      surveyCompleted: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      student: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: profile.studentId,
        department: profile.department,
        yearOfStudy: profile.yearOfStudy,
        cgpa: null,
        attendance: null,
        surveyCompleted: false,
        canEvaluate: false,
        riskLevel: null,
      },
    });
  } catch (error) {
    console.error('Error in createStudent:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error enrolling student',
      error: error.message,
    });
  }
};

// @desc    Fetch students belonging strictly to the teacher's department
// @route   GET /api/teacher/students
// @access  Private (Teacher, Admin)
exports.getTeacherStudents = async (req, res) => {
  try {
    // Build query: Filter by teacher's department unless user is Admin
    const query = { role: 'Student' };
    if (req.user?.role === 'Teacher' && req.user?.department) {
      query.department = req.user.department;
    }

    const users = await User.find(query).select('-password').lean();

    const userIds = users.map((u) => u._id);
    const profiles = await StudentProfile.find({ user: { $in: userIds } }).lean();

    const profileMap = new Map();
    profiles.forEach((p) => {
      if (p.user) profileMap.set(p.user.toString(), p);
    });

    const combinedStudents = users.map((user) => {
      const profile = profileMap.get(user._id.toString()) || {};

      const resolvedCgpa = profile.cgpa ?? user.cgpa ?? null;
      const resolvedAttendance = profile.attendancePercentage ?? profile.attendance ?? user.attendance ?? null;
      const isSurveyDone = Boolean(profile.surveyCompleted || user.surveyCompleted);

      // Evaluation button is enabled ONLY when CGPA, Attendance, AND Survey are present
      const canEvaluate = resolvedCgpa !== null && resolvedAttendance !== null && isSurveyDone === true;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: profile.studentId || user.studentId || '',
        department: profile.department || user.department || 'Computer Science',
        yearOfStudy: profile.yearOfStudy || user.yearOfStudy || '1st Year',
        cgpa: resolvedCgpa,
        attendance: resolvedAttendance,
        attendancePercentage: resolvedAttendance,
        surveyCompleted: isSurveyDone,
        canEvaluate, // Used by frontend to toggle AI Evaluation Button
        riskLevel: profile.riskLevel || user.riskLevel || null,
        riskCategory: profile.riskCategory || 'None',
        primaryRiskCategory: profile.primaryRiskCategory || 'NONE',
        assignedRole: profile.assignedRole || 'TEACHER',
        evaluationCase: profile.evaluationCase || 'NONE',
        nonAcademicRisk: profile.nonAcademicRisk || {},
        recommendedActions: profile.recommendedActions || {},
        financialAidStatus: profile.financialAidStatus || 'Paid',
        collegeFinancialAid: profile.collegeFinancialAid || {},
        assignedCounselor: profile.assignedCounselor || profile.assigned_counselor_id || null,
        assigned_counselor_id: profile.assigned_counselor_id || profile.assignedCounselor || null,
        financial_relief_status: profile.financial_relief_status || (profile.financialAidStatus === 'Pending Institutional Support' ? 'REQUESTED' : 'NONE'),
        evaluation_source: profile.evaluation_source || 'AUTOMATED_AI',
        intervention_logs: profile.intervention_logs || [],
        counselingStatus: profile.counselingStatus || 'Active Review',
        assignedAcademicPlan: profile.assignedAcademicPlan || profile.academicPlan || null,
        academicPlan: profile.academicPlan || profile.assignedAcademicPlan || null,
        academicInterventionPlan: profile.academicInterventionPlan || null,
        aiRecommendations: profile.aiRecommendations || [],
        qualitativeNotes: profile.qualitativeNotes || [],
        surveyData: profile.surveyData || {},
      };
    });

    return res.status(200).json({
      success: true,
      count: combinedStudents.length,
      students: combinedStudents,
    });
  } catch (error) {
    console.error('Error in getTeacherStudents:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error fetching department students',
      error: error.message,
    });
  }
};

// @desc    Update ONLY student CGPA and attendance (Without altering Risk Level)
// @route   POST /api/teacher/students/:id/marks
// @access  Private (Teacher, Admin)
exports.updateStudentMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { cgpa, marks, attendance, attendancePercentage, teacherNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student User ID' });
    }

    // 1. Check Student User existence
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student user not found' });
    }

    // 2. Parse CGPA & Attendance values
    let valCgpa = null;
    if (cgpa !== undefined && cgpa !== null && cgpa !== '') {
      valCgpa = Number(cgpa);
    } else if (marks !== undefined && marks !== null && marks !== '') {
      const numMarks = Number(marks);
      valCgpa = numMarks > 10 ? Math.min(10, Math.max(0, (numMarks / 100) * 10)) : numMarks;
    }

    let valAttendance = null;
    const rawAttendance = attendancePercentage ?? attendance;
    if (rawAttendance !== undefined && rawAttendance !== null && rawAttendance !== '') {
      valAttendance = Number(rawAttendance);
    }

    // 3. Save directly to User Document
    if (valCgpa !== null && !isNaN(valCgpa)) user.cgpa = valCgpa;
    if (valAttendance !== null && !isNaN(valAttendance)) user.attendance = valAttendance;
    await user.save();

    // 4. Update or Upsert StudentProfile Document
    const updatePayload = {};
    if (valCgpa !== null && !isNaN(valCgpa)) updatePayload.cgpa = valCgpa;
    if (valAttendance !== null && !isNaN(valAttendance)) {
      updatePayload.attendancePercentage = valAttendance;
      updatePayload.attendance = valAttendance;
    }

    const pushPayload = {};
    if (teacherNotes && typeof teacherNotes === 'string' && teacherNotes.trim().length > 0) {
      pushPayload.qualitativeNotes = {
        authorRole: 'Teacher',
        note: teacherNotes.trim(),
        category: 'Academic',
        createdAt: new Date(),
      };
    }

    const updateQuery = { $set: updatePayload };
    if (Object.keys(pushPayload).length > 0) {
      updateQuery.$push = pushPayload;
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { user: user._id },
      updateQuery,
      { new: true, upsert: true, setDefaultsOnInsert: false }
    );

    // Compute readiness status
    const isSurveyDone = Boolean(profile.surveyCompleted || user.surveyCompleted);
    const canEvaluate = profile.cgpa !== null && profile.attendancePercentage !== null && isSurveyDone;

    return res.status(200).json({
      success: true,
      message: 'Student academic record updated successfully',
      student: {
        _id: user._id,
        cgpa: profile.cgpa,
        attendance: profile.attendancePercentage,
        canEvaluate,
        riskLevel: profile.riskLevel || user.riskLevel || null,
      },
    });
  } catch (error) {
    console.error('CRITICAL ERROR in updateStudentMarks:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating student marks',
    });
  }
};

// @desc    Get list of all registered counselors for assignment dropdown with active case counts
// @route   GET /api/teacher/counselors
// @access  Private (Teacher, Admin)
exports.getRegisteredCounselors = async (req, res) => {
  try {
    const counselors = await User.find({ role: 'Counselor' })
      .select('_id name email department phone')
      .lean();

    const counselorIds = counselors.map((c) => c._id);

    // Calculate active assigned cases from StudentProfile
    const profileCounts = await StudentProfile.aggregate([
      {
        $match: {
          $or: [
            { assigned_counselor_id: { $in: counselorIds } },
            { assignedCounselor: { $in: counselorIds } },
          ],
          counselingStatus: { $ne: 'Resolved' },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$assigned_counselor_id', '$assignedCounselor'] },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate active sessions from CounselingSession
    let sessionCounts = [];
    if (CounselingSession) {
      sessionCounts = await CounselingSession.aggregate([
        {
          $match: {
            counselor: { $in: counselorIds },
            status: { $nin: ['Resolved', 'Cancelled', 'Completed'] },
          },
        },
        {
          $group: {
            _id: '$counselor',
            count: { $sum: 1 },
          },
        },
      ]);
    }

    const countMap = new Map();
    profileCounts.forEach((p) => {
      if (p._id) countMap.set(p._id.toString(), p.count);
    });
    sessionCounts.forEach((s) => {
      if (s._id) {
        const idStr = s._id.toString();
        const existing = countMap.get(idStr) || 0;
        countMap.set(idStr, Math.max(existing, s.count));
      }
    });

    const enrichedCounselors = counselors.map((c) => {
      const activeCount = countMap.get(c._id.toString()) || 0;
      return {
        ...c,
        id: c._id,
        active_case_count: activeCount,
        activeCaseCount: activeCount,
        activeCasesCount: activeCount,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedCounselors.length,
      counselors: enrichedCounselors,
      data: enrichedCounselors,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign a counselor from registered list to an at-risk student
// @route   POST /api/teacher/students/:id/assign-counselor
// @access  Private (Teacher, Admin)
exports.assignCounselorToStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { counselorId, referralReason, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(counselorId)) {
      return res.status(400).json({ success: false, message: 'Invalid Student or Counselor ID.' });
    }

    const counselor = await User.findOne({ _id: counselorId, role: 'Counselor' });
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Selected counselor not found.' });
    }

    const logEntry = {
      action: 'Counselor Assigned',
      performed_by: req.user?.name || req.user?.role || 'Teacher',
      timestamp: new Date(),
      notes: notes || `Assigned to Counselor ${counselor.name}. Reason: ${referralReason || 'Supportive non-academic counseling initiated.'}`,
    };

    const profile = await StudentProfile.findOneAndUpdate(
      { user: id },
      { 
        $set: { 
          assignedCounselor: counselor._id,
          assigned_counselor_id: counselor._id,
          assignedRole: 'COUNSELOR',
          counselingStatus: 'Active Review',
        },
        $push: {
          intervention_logs: logEntry,
          qualitativeNotes: {
            authorRole: req.user?.role || 'Teacher',
            note: `Counselor ${counselor.name} assigned. Referral reason: ${referralReason || 'Non-academic intervention'}`,
            category: 'Personal',
            createdAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    // Sync to student User document
    await User.findByIdAndUpdate(id, {
      $set: {
        assignedCounselor: counselor._id,
        assigned_counselor_id: counselor._id,
      },
    });

    // Create tracking session record with student background context
    let session = null;
    if (CounselingSession) {
      const backgroundContext = {
        wellnessSummary: profile?.mentalHealthSelfReport || profile?.mentalHealthState || 'Moderate',
        disengagementReason: profile?.disengagementReason || 'None',
        financialStatus: profile?.financialStress || profile?.moneyFeeWorries || 'Stable',
        academicSnapshot: {
          cgpa: profile?.cgpa,
          attendance: profile?.attendancePercentage,
          backlogs: profile?.activeBacklogs || '0 Backlogs',
        },
        evaluationCase: profile?.evaluationCase || 'CASE_A_WELLNESS_DISENGAGEMENT',
      };

      session = await CounselingSession.create({
        student: id,
        assignedBy: req.user?._id,
        counselor: counselor._id,
        riskCategory: profile?.riskCategory || 'General Intervention',
        reasonForReferral: referralReason || 'Referred for specialized non-academic intervention.',
        notes: `Referred by ${req.user?.name || 'Faculty'}. Supportive counseling initiated.`,
        status: 'Assigned',
        studentBackgroundContext: backgroundContext,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully assigned Counselor ${counselor.name} to student and created counseling log.`,
      counselor: { _id: counselor._id, name: counselor.name, email: counselor.email },
      session,
      intervention_logs: profile.intervention_logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Alias handler for backwards-compatibility with route mappings
exports.assignCounselor = exports.assignCounselorToStudent;

// @desc    Submit application for College Emergency / Financial Aid Grant
// @route   POST /api/teacher/students/:id/grant-aid
// @access  Private (Teacher, Admin)
exports.applyCollegeFinancialAid = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedAmount, amount, notes, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID.' });
    }

    const grantAmount = Number(requestedAmount || amount) || 5000;

    const logEntry = {
      action: 'College Fund Requested',
      performed_by: req.user?.name || req.user?.role || 'Teacher',
      timestamp: new Date(),
      notes: `Requested College Emergency Fund Grant of ₹${grantAmount}. Reason: ${reason || 'Tuition / Living Support'}. Notes: ${notes || 'Pending institutional review.'}`,
    };

    const profile = await StudentProfile.findOneAndUpdate(
      { user: id },
      {
        $set: {
          'collegeFinancialAid.status': 'Pending Institutional Support',
          'collegeFinancialAid.grantAmount': grantAmount,
          'collegeFinancialAid.appliedAt': new Date(),
          financialAidStatus: 'Pending Institutional Support',
          financial_relief_status: 'REQUESTED',
          assignedRole: 'FINANCIAL_AID',
        },
        $push: {
          intervention_logs: logEntry,
          qualitativeNotes: {
            authorRole: req.user?.role || 'Teacher',
            note: `Requested College Emergency Fund Grant of ₹${grantAmount}. Reason: ${reason || 'Tuition / Living Support'}. Notes: ${notes || 'Pending institutional review.'}`,
            category: 'Financial',
            createdAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    // Sync to student User document
    await User.findByIdAndUpdate(id, {
      $set: {
        financialAidStatus: 'Pending Institutional Support',
        financial_relief_status: 'REQUESTED',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'College financial aid request submitted. Marked as Pending Institutional Support.',
      financialAid: profile?.collegeFinancialAid,
      financialAidStatus: profile?.financialAidStatus,
      financial_relief_status: profile?.financial_relief_status,
      intervention_logs: profile.intervention_logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Alias handler for backwards-compatibility with route mappings
exports.grantFinancialAid = exports.applyCollegeFinancialAid;

// @desc    Trigger AI Risk Evaluation for a Student (Gemini Integration)
// @route   POST /api/teacher/risk/evaluate
// @access  Private (Teacher, Admin)
exports.evaluateStudentRisk = async (req, res) => {
  try {
    const targetId = req.params.studentId || req.params.id || req.body.studentId || req.body.id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);

    // 1. Fetch Student Profile and User Document
    let profile = await StudentProfile.findOne(
      isObjectId ? { $or: [{ user: targetId }, { _id: targetId }] } : { studentId: targetId }
    );

    let user = await User.findById(isObjectId ? targetId : profile?.user);

    if (!user && !profile) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    if (!profile) {
      profile = new StudentProfile({
        user: user._id,
        studentId: user.studentId || `STU-${user._id.toString().slice(-4)}`,
        department: user.department || 'Computer Science',
        yearOfStudy: user.yearOfStudy || '1st Year',
      });
    }

    // 2. Validate prerequisites BEFORE running evaluation algorithm
    const hasCgpa = profile.cgpa !== null && profile.cgpa !== undefined;
    const hasAttendance = profile.attendancePercentage !== null && profile.attendancePercentage !== undefined;
    const hasSurvey = profile.surveyCompleted === true;

    if (!hasCgpa || !hasAttendance || !hasSurvey) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation locked: Requires Teacher Marks (CGPA & Attendance) AND Student Survey completion.',
      });
    }

    // 3. Prepare payload for Gemini API evaluation
    const evaluationPayload = {
      cgpa: profile.cgpa ?? user?.cgpa ?? 0,
      attendancePercentage: profile.attendancePercentage ?? user?.attendance ?? 0,
      activeBacklogs: profile.activeBacklogs || '0 Backlogs',
      surveyCompleted: profile.surveyCompleted,
      academicInterest: profile.academicInterest,
      disengagementReason: profile.disengagementReason,
      abilityToStudy: profile.abilityToStudy,
      financialStress: profile.financialStress || profile.moneyFeeWorries,
      familyIncome: profile.familyIncome || profile.familyMonthlyIncome,
      livingSituation: profile.livingSituation,
      commuteTime: profile.commuteTime || profile.dailyCommuteTime,
      partTimeJob: profile.partTimeJob || profile.partTimeWork,
      studyHoursPerDay: profile.studyHoursPerDay || profile.dailySelfStudyHours,
      sleepHoursPerNight: profile.sleepHoursPerNight || profile.nightlySleepHours,
      mentalHealthSelfReport: profile.mentalHealthSelfReport || profile.mentalHealthState || profile.mentalHealthStatus,
      addictions: profile.addictions || [],
      impactFactors: profile.impactFactors || [],
      qualitativeNotes: profile.qualitativeNotes || [],
      comments: profile.comments || profile.additionalNotes,
      surveyData: profile.surveyData || {},
    };

    // 4. Delegate risk analysis to Gemini AI Service / Decision Matrix
    const aiResult = await evaluateStudentRiskWithGemini(evaluationPayload);

    // 5. Update Profile & User documents with standard AI results
    profile.riskLevel = aiResult.riskLevel;
    profile.riskCategory = aiResult.riskCategory;
    profile.primaryRiskCategory = aiResult.primaryRiskCategory;
    profile.assignedRole = aiResult.assignedRole;
    profile.evaluationCase = aiResult.evaluationCase;
    profile.nonAcademicRisk = aiResult.nonAcademicRisk;
    profile.recommendedActions = aiResult.recommendedActions;
    profile.aiRecommendations = aiResult.aiRecommendations;
    profile.riskEvaluated = true;
    profile.lastAiAnalysisDate = new Date();
    profile.evaluation_source = 'AUTOMATED_AI';

    // Push audit entry to intervention_logs
    if (!profile.intervention_logs) profile.intervention_logs = [];
    profile.intervention_logs.push({
      action: `AI Risk Evaluated: ${aiResult.riskLevel}`,
      performed_by: req.user?.name || req.user?.role || 'Teacher',
      timestamp: new Date(),
      notes: `Evaluated Case: ${aiResult.evaluationCase}. Category: ${aiResult.riskCategory}. Role: ${aiResult.assignedRole}`,
    });

    // Automated Workflow Case B: Mark Pending Institutional Support
    if (aiResult.evaluationCase === 'CASE_B_FINANCIAL_STRESS') {
      profile.financialAidStatus = 'Pending Institutional Support';
      profile.financial_relief_status = 'REQUESTED';
      profile.collegeFinancialAid.status = 'Pending Institutional Support';
      if (!profile.collegeFinancialAid.appliedAt) {
        profile.collegeFinancialAid.appliedAt = new Date();
      }
    }

    if (user) {
      user.riskLevel = aiResult.riskLevel;
      await user.save();
    }

    profile.markModified('surveyData');
    profile.markModified('recommendedActions');
    profile.markModified('nonAcademicRisk');
    profile.markModified('collegeFinancialAid');
    await profile.save();

    return res.status(200).json({
      success: true,
      message: `AI Evaluation completed successfully. Assigned to ${aiResult.assignedRole} for ${aiResult.riskCategory}. Workflow: ${aiResult.evaluationCase}`,
      student: {
        _id: user?._id || profile.user,
        riskLevel: profile.riskLevel,
        riskCategory: profile.riskCategory,
        primaryRiskCategory: profile.primaryRiskCategory,
        assignedRole: profile.assignedRole,
        evaluationCase: profile.evaluationCase,
        nonAcademicRisk: profile.nonAcademicRisk,
        recommendedActions: profile.recommendedActions,
        financialAidStatus: profile.financialAidStatus,
        collegeFinancialAid: profile.collegeFinancialAid,
        aiRecommendations: profile.aiRecommendations,
      },
      evaluation: aiResult,
    });
  } catch (error) {
    console.error('Error evaluating risk:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during risk evaluation',
    });
  }
};

// @desc    Delete a student user and associated profile
// @route   DELETE /api/teacher/students/:id
// @access  Private (Teacher, Admin)
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await User.findByIdAndDelete(id);
    await StudentProfile.deleteMany({ user: id });

    return res.status(200).json({
      success: true,
      message: 'Student account and profile deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting student',
    });
  }
};