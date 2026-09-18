// backend/controllers/riskController.js
const mongoose = require('mongoose');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const CounselingSession = require('../models/CounselingSession');
const { evaluateStudentRiskWithGemini } = require('../services/riskService');
const { generateAcademicPlan } = require('../services/academicPlanService');

// @desc    Trigger AI Risk Evaluation checking Non-Academic Categories & Decision Matrix
// @route   POST /api/risk/evaluate
// @access  Private (Teacher, Counselor, Admin)
exports.evaluateStudentRisk = async (req, res) => {
  try {
    const { studentId, id, surveyData: incomingSurvey } = req.body;
    const targetId = studentId || id || req.params.id || req.params.studentId;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    // 1. Fetch User Document
    const query = mongoose.Types.ObjectId.isValid(targetId) ? { _id: targetId } : { studentId: targetId };
    const user = await User.findOne(query).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student user not found' });
    }

    // 2. Fetch or initialize StudentProfile Document
    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) {
      profile = new StudentProfile({ user: user._id });
    }

    // Sync incoming survey data into student profile memory & DB
    if (incomingSurvey && typeof incomingSurvey === 'object') {
      if (!profile.surveyData) profile.surveyData = new Map();
      Object.entries(incomingSurvey).forEach(([k, v]) => {
        if (profile.surveyData instanceof Map) {
          profile.surveyData.set(k, v);
        } else {
          profile.surveyData[k] = v;
        }
      });
    }

    // 3. Extract surveyData cleanly
    let dbSurvey = {};
    if (profile.surveyData) {
      dbSurvey = profile.surveyData instanceof Map
        ? Object.fromEntries(profile.surveyData)
        : profile.surveyData;
    }

    const survey = { ...dbSurvey, ...(incomingSurvey || {}) };

    const getField = (...keys) => {
      for (const key of keys) {
        if (survey[key] !== undefined && survey[key] !== null && survey[key] !== '') return survey[key];
        if (profile[key] !== undefined && profile[key] !== null && profile[key] !== '') return profile[key];
      }
      return null;
    };

    // Extract Academic & Attendance
    const cgpa = profile.cgpa ?? profile.latestMarks ?? getField('cgpa', 'latestMarks');
    const attendancePercentage = profile.attendancePercentage ?? profile.attendance ?? getField('attendancePercentage', 'attendance');
    const activeBacklogs = getField('activeBacklogs', 'backlogs', 'failedSubjects') || '0 Backlogs';
    const assignmentsSubmitted = profile.assignmentsSubmitted ?? 0;
    const assignmentsTotal = profile.assignmentsTotal ?? 0;

    // Extract Non-Academic Survey Factors
    const academicInterest = getField('academicInterest', 'interest', 'motivationLevel') || 'High (Interested & Motivated)';
    const disengagementReason = getField('disengagementReason') || 'None';
    const abilityToStudy = getField('abilityToStudy', 'studyEnvironment', 'studyAbility') || 'Full (Good Environment & Focus)';
    const familyIncome = getField('familyIncome', 'familyMonthlyIncome', 'income') || '';
    const financialStress = getField('financialStress', 'moneyFeeWorries', 'feeWorries') || '';
    const livingSituation = getField('livingSituation', 'residence', 'housing') || '';
    const partTimeJob = getField('partTimeJob', 'partTimeWork', 'job') || '';
    const studyHoursPerDay = getField('studyHoursPerDay', 'dailySelfStudyHours', 'studyHours') || '';
    const commuteTime = getField('commuteTime', 'dailyCommuteTime', 'commute') || '';
    const sleepHoursPerNight = getField('sleepHoursPerNight', 'nightlySleepHours', 'sleep') || '';
    const mentalHealthState = getField('mentalHealthState', 'mentalHealthSelfReport', 'mentalHealthStatus', 'mentalHealth') || '';

    let impactFactors = getField('impactFactors', 'addictions', 'distractions') || [];
    if (typeof impactFactors === 'string') impactFactors = [impactFactors];

    const evaluationPayload = {
      studentName: user.name,
      cgpa,
      attendancePercentage,
      activeBacklogs,
      assignmentsSubmitted,
      assignmentsTotal,
      academicInterest,
      disengagementReason,
      abilityToStudy,
      financialStress,
      familyIncome,
      livingSituation,
      partTimeJob,
      studyHoursPerDay,
      commuteTime,
      sleepHoursPerNight,
      mentalHealthState,
      impactFactors,
      qualitativeNotes: profile.qualitativeNotes || [],
    };

    // 4. Run AI & Decision Matrix Evaluation
    const assessment = await evaluateStudentRiskWithGemini(evaluationPayload);

    // 5. Update Profile
    profile.riskLevel = assessment.riskLevel;
    profile.riskCategory = assessment.riskCategory;
    profile.primaryRiskCategory = assessment.primaryRiskCategory;
    profile.assignedRole = assessment.assignedRole;
    profile.evaluationCase = assessment.evaluationCase;
    profile.nonAcademicRisk = assessment.nonAcademicRisk;
    profile.recommendedActions = assessment.recommendedActions;
    profile.aiRecommendations = assessment.aiRecommendations;
    profile.riskEvaluated = true;
    profile.lastEvaluatedAt = new Date();
    profile.lastAiAnalysisDate = new Date();
    profile.evaluation_source = 'AUTOMATED_AI';

    if (!profile.intervention_logs) profile.intervention_logs = [];
    profile.intervention_logs.push({
      action: `AI Risk Evaluated: ${assessment.riskLevel}`,
      performed_by: req.user?.name || req.user?.role || 'System / AI',
      timestamp: new Date(),
      notes: `Evaluated Case: ${assessment.evaluationCase}. Category: ${assessment.riskCategory}. Role: ${assessment.assignedRole}`,
    });

    // Automated Workflow for Case B: Mark status as "Pending Institutional Support"
    if (assessment.evaluationCase === 'CASE_B_FINANCIAL_STRESS') {
      profile.financialAidStatus = 'Pending Institutional Support';
      profile.financial_relief_status = 'REQUESTED';
      profile.collegeFinancialAid.status = 'Pending Institutional Support';
      if (!profile.collegeFinancialAid.appliedAt) {
        profile.collegeFinancialAid.appliedAt = new Date();
      }
    }

    // Automated Workflow for Case C: Route to Academic Plan Module
    if (assessment.evaluationCase === 'CASE_C_PURE_ACADEMIC') {
      const academicPlan = generateAcademicPlan({
        cgpa,
        attendancePercentage,
        activeBacklogs,
        assignmentsSubmitted,
        assignmentsTotal,
      });
      profile.academicInterventionPlan = {
        studySchedule: academicPlan.studySchedule,
        remedialClasses: academicPlan.remedialClasses,
        backlogTracking: academicPlan.backlogTracking,
        cgpaRecoveryMilestones: academicPlan.cgpaRecoveryMilestones,
        generatedAt: new Date(),
      };
      profile.assignedAcademicPlan = academicPlan.planType;
      profile.academicPlan = academicPlan.planType;
    }

    user.riskLevel = assessment.riskLevel;
    await user.save();

    profile.markModified('surveyData');
    profile.markModified('recommendedActions');
    profile.markModified('nonAcademicRisk');
    profile.markModified('collegeFinancialAid');
    await profile.save();

    return res.status(200).json({
      success: true,
      message: `Risk evaluation complete: ${assessment.riskLevel} (${assessment.riskCategory}). Workflow: ${assessment.evaluationCase}`,
      assessment: {
        studentId: user._id,
        id: user._id,
        name: user.name,
        riskLevel: profile.riskLevel,
        riskCategory: profile.riskCategory,
        primaryRiskCategory: profile.primaryRiskCategory,
        assignedRole: profile.assignedRole,
        evaluationCase: profile.evaluationCase,
        nonAcademicRisk: profile.nonAcademicRisk,
        recommendedActions: profile.recommendedActions,
        aiRecommendations: profile.aiRecommendations,
        financialAidStatus: profile.financialAidStatus,
        collegeFinancialAid: profile.collegeFinancialAid,
        academicInterventionPlan: profile.academicInterventionPlan,
      },
    });
  } catch (error) {
    console.error('Error in evaluateStudentRisk:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process risk evaluation',
      error: error.message,
    });
  }
};

// @desc    Assign Academic Support Plan
// @route   POST /api/risk/assign-plan
// @access  Private (Teacher, Admin)
exports.assignAcademicPlan = async (req, res) => {
  try {
    const { studentId, id, planType, notes } = req.body;
    const targetId = studentId || id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
    const profile = await StudentProfile.findOne(
      isObjectId ? { $or: [{ user: targetId }, { _id: targetId }] } : { studentId: targetId }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const academicPlan = generateAcademicPlan({
      cgpa: profile.cgpa,
      attendancePercentage: profile.attendancePercentage,
      activeBacklogs: profile.activeBacklogs,
      assignmentsSubmitted: profile.assignmentsSubmitted,
      assignmentsTotal: profile.assignmentsTotal,
    });

    const chosenPlan = planType || academicPlan.planType;
    profile.assignedAcademicPlan = chosenPlan;
    profile.academicPlan = chosenPlan;
    profile.assignedPlan = chosenPlan;
    profile.academicInterventionPlan = {
      studySchedule: academicPlan.studySchedule,
      remedialClasses: academicPlan.remedialClasses,
      backlogTracking: academicPlan.backlogTracking,
      cgpaRecoveryMilestones: academicPlan.cgpaRecoveryMilestones,
      generatedAt: new Date(),
    };

    if (notes) {
      profile.qualitativeNotes.push({
        authorRole: req.user?.role || 'Teacher',
        note: `Assigned Academic Support: ${chosenPlan}. Notes: ${notes}`,
        category: 'Academic',
        createdAt: new Date(),
      });
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: `Academic plan assigned: ${chosenPlan}`,
      plan: chosenPlan,
      academicInterventionPlan: profile.academicInterventionPlan,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign Counselor to student and create Counseling Log with context
// @route   POST /api/risk/assign-counselor
// @access  Private (Teacher, Admin)
exports.assignCounselor = async (req, res) => {
  try {
    const { studentId, id, counselorId, reasonForReferral, notes } = req.body;
    const targetId = studentId || id;

    if (!targetId || !counselorId) {
      return res.status(400).json({ success: false, message: 'Student ID and Counselor ID are required' });
    }

    const counselor = await User.findOne({ _id: counselorId, role: 'Counselor' });
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Selected counselor not found' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
    const profile = await StudentProfile.findOne(
      isObjectId ? { $or: [{ user: targetId }, { _id: targetId }] } : { studentId: targetId }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    profile.assignedCounselor = counselor._id;
    profile.assigned_counselor_id = counselor._id;
    profile.assignedRole = 'COUNSELOR';
    profile.counselingStatus = 'Active Review';

    if (!profile.intervention_logs) profile.intervention_logs = [];
    profile.intervention_logs.push({
      action: 'Counselor Assigned',
      performed_by: req.user?.name || req.user?.role || 'Teacher',
      timestamp: new Date(),
      notes: notes || `Assigned to Counselor ${counselor.name}. Reason: ${reasonForReferral || 'Supportive non-academic counseling initiated.'}`,
    });

    await profile.save();

    await User.findByIdAndUpdate(profile.user, {
      $set: {
        assignedCounselor: counselor._id,
        assigned_counselor_id: counselor._id,
      },
    });

    // Create detailed Counseling Log notifying the assigned counselor with student background context
    const backgroundContext = {
      wellnessSummary: profile.mentalHealthSelfReport || profile.mentalHealthState || 'Moderate',
      disengagementReason: profile.disengagementReason || 'None',
      financialStatus: profile.financialStress || profile.moneyFeeWorries || 'Stable',
      academicSnapshot: {
        cgpa: profile.cgpa,
        attendance: profile.attendancePercentage,
        backlogs: profile.activeBacklogs || '0 Backlogs',
      },
      evaluationCase: profile.evaluationCase || 'CASE_A_WELLNESS_DISENGAGEMENT',
    };

    const session = await CounselingSession.create({
      student: profile.user,
      assignedBy: req.user?._id,
      counselor: counselor._id,
      riskCategory: profile.riskCategory || 'Wellness & Mental Health',
      reasonForReferral: reasonForReferral || 'Referred for supportive counseling.',
      notes: notes || `Referred by ${req.user?.name || 'Faculty'}. Non-academic counseling initiated.`,
      status: 'Assigned',
      studentBackgroundContext: backgroundContext,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully assigned Counselor ${counselor.name} and created counseling log.`,
      counselor: { _id: counselor._id, name: counselor.name, email: counselor.email },
      session,
      intervention_logs: profile.intervention_logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process College Fund Request / Emergency Financial Grant
// @route   POST /api/risk/grant-financial-aid
// @access  Private (Teacher, Admin)
exports.grantFinancialAid = async (req, res) => {
  try {
    const { studentId, id, amount, reason, notes } = req.body;
    const targetId = studentId || id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
    const profile = await StudentProfile.findOne(
      isObjectId ? { $or: [{ user: targetId }, { _id: targetId }] } : { studentId: targetId }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const grantAmount = Number(amount) || 5000;
    profile.financialAidStatus = 'Pending Institutional Support';
    profile.financial_relief_status = 'REQUESTED';
    profile.collegeFinancialAid = {
      status: 'Pending Institutional Support',
      grantAmount,
      appliedAt: new Date(),
    };
    profile.assignedRole = 'FINANCIAL_AID';

    profile.qualitativeNotes.push({
      authorRole: req.user?.role || 'Teacher',
      note: `Requested College Emergency Fund Grant of ₹${grantAmount}. Reason: ${reason || 'Tuition / Living Support'}. Notes: ${notes || 'Pending institutional review.'}`,
      category: 'Financial',
      createdAt: new Date(),
    });

    if (!profile.intervention_logs) profile.intervention_logs = [];
    profile.intervention_logs.push({
      action: 'College Fund Requested',
      performed_by: req.user?.name || req.user?.role || 'Teacher',
      timestamp: new Date(),
      notes: `Requested College Emergency Fund Grant of ₹${grantAmount}. Reason: ${reason || 'Tuition / Living Support'}. Notes: ${notes || 'Pending institutional review.'}`,
    });

    await profile.save();

    await User.findByIdAndUpdate(profile.user, {
      $set: {
        financialAidStatus: 'Pending Institutional Support',
        financial_relief_status: 'REQUESTED',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'College Fund Request submitted. Student marked as "Pending Institutional Support".',
      financialAidStatus: profile.financialAidStatus,
      financial_relief_status: profile.financial_relief_status,
      collegeFinancialAid: profile.collegeFinancialAid,
      intervention_logs: profile.intervention_logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch class/department wide risk overview
// @route   GET /api/risk/overview
// @access  Private (Teacher, Counselor, Admin)
exports.getRiskOverview = async (req, res) => {
  try {
    const profiles = await StudentProfile.find().populate('user', 'name email role department').lean();

    const counts = {
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      unevaluated: 0,
      caseA: 0,
      caseB: 0,
      caseC: 0,
      pendingInstitutionalSupport: 0,
    };

    profiles.forEach((p) => {
      const lvl = String(p.riskLevel || '').toLowerCase();
      if (lvl.includes('high')) counts.highRisk++;
      else if (lvl.includes('medium')) counts.mediumRisk++;
      else if (lvl.includes('low')) counts.lowRisk++;
      else counts.unevaluated++;

      if (p.evaluationCase === 'CASE_A_WELLNESS_DISENGAGEMENT') counts.caseA++;
      if (p.evaluationCase === 'CASE_B_FINANCIAL_STRESS') counts.caseB++;
      if (p.evaluationCase === 'CASE_C_PURE_ACADEMIC') counts.caseC++;
      if (p.financialAidStatus === 'Pending Institutional Support') counts.pendingInstitutionalSupport++;
    });

    return res.status(200).json({
      success: true,
      overview: counts,
      totalStudents: profiles.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};