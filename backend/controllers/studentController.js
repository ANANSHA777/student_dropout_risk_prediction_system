const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path to models if needed
const StudentProfile = require('../models/StudentProfile');

/**
 * Helper to safely normalize and parse impact factors/addictions into a string array.
 * Prevents Mongoose CastError when objects or stringified JSON are received from the frontend.
 */
const normalizeImpactFactors = (rawFactors) => {
  if (!rawFactors) return ['None of the Above'];

  let parsed = rawFactors;

  // Handle case where frontend passes a stringified JSON array/object
  if (typeof rawFactors === 'string') {
    try {
      const trimmed = rawFactors.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed);
      } else {
        return [trimmed];
      }
    } catch (e) {
      return [rawFactors];
    }
  }

  const cleanFactors = [];

  // Handle Array input
  if (Array.isArray(parsed)) {
    parsed.forEach((item) => {
      if (typeof item === 'string') {
        cleanFactors.push(item);
      } else if (typeof item === 'object' && item !== null) {
        if (item.socialMedia) cleanFactors.push('Excessive Social Media');
        if (item.gaming) cleanFactors.push('Excessive Gaming');
        if (item.substances) cleanFactors.push('Substance / Alcohol Use');
        if (item.none) cleanFactors.push('None of the Above');
      }
    });
  } 
  // Handle Object input
  else if (typeof parsed === 'object' && parsed !== null) {
    if (parsed.socialMedia) cleanFactors.push('Excessive Social Media');
    if (parsed.gaming) cleanFactors.push('Excessive Gaming');
    if (parsed.substances) cleanFactors.push('Substance / Alcohol Use');
    if (parsed.none) cleanFactors.push('None of the Above');
  }

  return cleanFactors.length > 0 ? cleanFactors : ['None of the Above'];
};

// @desc    Get current student's academic profile and risk indicators
// @route   GET /api/student/profile
// @access  Private (Student)
exports.getStudentProfile = async (req, res) => {
  try {
    const rawUserId = req.user._id || req.user.id;
    const studentId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    // Fetch student profile document populated with user details
    let profile = await StudentProfile.findOne({ user: studentId }).lean();

    // Fallback if profile document does not exist yet
    if (!profile) {
      const user = await User.findById(studentId).select('-password').lean();
      return res.status(200).json({
        success: true,
        profile: {
          name: user ? user.name : req.user.name,
          email: user ? user.email : req.user.email,
          attendancePercentage: null,
          cgpa: null,
          surveyCompleted: false,
          surveyStatus: 'Pending',
          riskLevel: 'Unevaluated',
          riskCategory: 'None',
          aiRecommendations: ['Maintain regular class attendance.'],
          surveyData: {},
        },
      });
    }

    // Safely extract nested surveyData object
    const sData = profile.surveyData || {};

    // Reconstruct normalized survey values with fallbacks across flat and nested schemas
    const normalizedSurveyData = {
      familyMonthlyIncome: sData.familyMonthlyIncome || profile.familyIncome || '',
      moneyFeeWorries: sData.moneyFeeWorries || profile.financialStress || '',
      livingSituation: sData.livingSituation || profile.livingSituation || '',
      partTimeWork: sData.partTimeWork || profile.partTimeJob || '',
      dailySelfStudyHours: sData.dailySelfStudyHours || profile.studyHoursPerDay || '',
      dailyCommuteTime: sData.dailyCommuteTime || profile.commuteTime || '',
      activeBacklogs: sData.activeBacklogs || profile.activeBacklogs || '',
      nightlySleepHours: sData.nightlySleepHours || profile.sleepHoursPerNight || '',
      mentalHealthState: sData.mentalHealthState || profile.mentalHealthSelfReport || '',
      impactFactors: (sData.impactFactors && sData.impactFactors.length > 0)
        ? sData.impactFactors
        : (profile.addictions && profile.addictions.length > 0)
        ? profile.addictions
        : ['None of the Above'],
    };

    res.status(200).json({
      success: true,
      profile: {
        ...profile,
        name: req.user.name,
        email: req.user.email,
        surveyStatus: profile.surveyCompleted ? 'Completed' : 'Pending',
        // Guarantees all UI forms can read top-level AND nested fields reliably
        financialStress: profile.financialStress || normalizedSurveyData.moneyFeeWorries,
        mentalHealthStatus: profile.mentalHealthSelfReport || normalizedSurveyData.mentalHealthState,
        studyHoursPerDay: profile.studyHoursPerDay || normalizedSurveyData.dailySelfStudyHours,
        surveyData: normalizedSurveyData,
      },
    });
  } catch (error) {
    console.error('Error in getStudentProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching student profile',
      error: error.message,
    });
  }
};

// @desc    Submit wellness, financial, and lifestyle self-assessment survey
// @route   POST /api/student/survey
// @access  Private (Student)
exports.submitStudentSurvey = async (req, res) => {
  try {
    const rawUserId = req.user._id || req.user.id;
    const studentId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    // Support both flat fields & nested surveyData objects in req.body
    const bodySource = req.body.surveyData || req.body;

    const familyIncome = bodySource.familyIncome || bodySource.familyMonthlyIncome || '';
    const financialStress = bodySource.financialStress || bodySource.moneyFeeWorries || '';
    const livingSituation = bodySource.livingSituation || '';
    const commuteTime = bodySource.commuteTime || bodySource.dailyCommuteTime || '';
    const partTimeJob = bodySource.partTimeJob || bodySource.partTimeWork || '';
    const activeBacklogs = bodySource.activeBacklogs || '';
    const studyHoursPerDay = bodySource.studyHoursPerDay || bodySource.dailySelfStudyHours || bodySource.academicWorkload || '';
    const sleepHoursPerNight = bodySource.sleepHoursPerNight || bodySource.nightlySleepHours || '';
    const mentalHealthStatus = bodySource.mentalHealthStatus || bodySource.mentalHealthState || '';
    
    // Normalize impact factors/addictions array strictly to string array
    const rawFactors = bodySource.addictions || bodySource.impactFactors || req.body.addictions || req.body.impactFactors;
    const cleanImpactFactors = normalizeImpactFactors(rawFactors);

    // --- FLEXIBLE RISK EVALUATION RULES ---
    let suggestedRiskCategory = 'None';
    let primaryCategoryEnum = 'NONE';

    const mentalHealthLower = mentalHealthStatus.toLowerCase();
    const financialLower = financialStress.toLowerCase();

    // Rule 1: Mental Health / Emotional Distress -> Trigger Counselor Category
    if (
      mentalHealthLower.includes('anxious') ||
      mentalHealthLower.includes('stress') ||
      mentalHealthLower.includes('overwhelmed') ||
      mentalHealthLower.includes('depressed') ||
      mentalHealthLower.includes('poor')
    ) {
      suggestedRiskCategory = 'Wellness & Mental Health';
      primaryCategoryEnum = 'WELLNESS';
    } 
    // Rule 2: High Financial Burden -> Trigger Financial / Counselor Category
    else if (
      financialLower.includes('high') ||
      financialLower.includes('severe') ||
      financialLower.includes('burden') ||
      financialLower.includes('emergency')
    ) {
      suggestedRiskCategory = 'Financial Burden';
      primaryCategoryEnum = 'FINANCIAL';
    }

    // Structured nested survey object for schema persistence
    const surveyDataObject = {
      familyMonthlyIncome: familyIncome,
      moneyFeeWorries: financialStress,
      livingSituation,
      partTimeWork: partTimeJob,
      dailySelfStudyHours: studyHoursPerDay,
      dailyCommuteTime: commuteTime,
      activeBacklogs,
      nightlySleepHours: sleepHoursPerNight,
      mentalHealthState: mentalHealthStatus,
      impactFactors: cleanImpactFactors,
    };

    // Prepare profile update payload
    const updateData = {
      surveyCompleted: true,
      surveyStatus: 'Completed',
      lastSurveySubmittedAt: new Date(),

      // Flat Survey Fields (For direct query access)
      familyIncome,
      financialStress,
      livingSituation,
      commuteTime,
      partTimeJob,
      activeBacklogs,
      studyHoursPerDay,
      sleepHoursPerNight,
      mentalHealthSelfReport: mentalHealthStatus,
      addictions: cleanImpactFactors,

      // Nested survey object (For StudentProfile schema mapping)
      surveyData: surveyDataObject,
    };

    // If wellness or financial flags were detected, update risk category & recommendation flags
    if (suggestedRiskCategory !== 'None') {
      updateData.riskCategory = suggestedRiskCategory;
      updateData.primaryRiskCategory = primaryCategoryEnum;
      
      // Upgrade risk level if currently unassigned or low
      updateData.riskLevel = 'Medium';
      
      // Auto-flag for counselor escalation
      updateData['recommendedActions.escalateToCounselor'] = true;
    }

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { user: studentId },
      { $set: updateData },
      { returnDocument: 'after', upsert: true, runValidators: false }
    ).lean();

    res.status(200).json({
      success: true,
      message: 'Self-assessment survey recorded successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error in submitStudentSurvey:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting self-assessment',
      error: error.message,
    });
  }
};