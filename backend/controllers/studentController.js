const User = require('../models/User'); // Adjust path to models if needed
const StudentProfile = require('../models/StudentProfile');

// @desc    Get current student's academic profile and risk indicators
// @route   GET /api/student/profile
// @access  Private (Student)
exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user._id;

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
        },
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        name: req.user.name,
        email: req.user.email,
        ...profile,
        // Ensure surveyStatus string aligns with surveyCompleted boolean
        surveyStatus: profile.surveyCompleted ? 'Completed' : 'Pending',
      },
    });
  } catch (error) {
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
    const studentId = req.user._id;

    // Support both naming conventions from frontend payload
    const familyIncome = req.body.familyIncome || req.body.familyMonthlyIncome || '';
    const financialStress = req.body.financialStress || req.body.moneyFeeWorries || '';
    const livingSituation = req.body.livingSituation || '';
    const commuteTime = req.body.commuteTime || req.body.dailyCommuteTime || '';
    const partTimeJob = req.body.partTimeJob || req.body.partTimeWork || '';
    const activeBacklogs = req.body.activeBacklogs || '';
    const studyHoursPerDay = req.body.studyHoursPerDay || req.body.dailySelfStudyHours || '';
    const sleepHoursPerNight = req.body.sleepHoursPerNight || req.body.nightlySleepHours || '';
    const mentalHealthStatus = req.body.mentalHealthStatus || req.body.mentalHealthState || '';
    const addictions = req.body.addictions || req.body.impactFactors || [];

    // --- FLEXIBLE RISK EVALUATION RULES ---
    let suggestedRiskCategory = 'None';
    let primaryCategoryEnum = 'NONE';
    let suggestedRiskLevel = 'Medium Risk'; // Default risk elevation for poor indicators

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
      impactFactors: Array.isArray(addictions) ? addictions : [addictions].filter(Boolean),
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
      addictions,

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
      { new: true, upsert: true, runValidators: false }
    );

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