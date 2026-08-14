const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { evaluateStudentRiskWithGemini } = require('../services/riskService');

// @desc    Trigger AI Risk Evaluation for a specific student
// @route   POST /api/risk/evaluate
// @access  Private (Teacher, Counselor, Admin)
exports.evaluateStudentRisk = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    // 1. Find user (Supports MongoDB ObjectId or studentId string)
    const query = studentId.match(/^[0-9a-fA-F]{24}$/) ? { _id: studentId } : { studentId };
    const user = await User.findOne(query).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student user not found' });
    }

    // 2. Fetch or initialize student profile
    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) {
      profile = new StudentProfile({ user: user._id });
    }

    // 3. Extract and sanitize survey data (Checks nested surveyData object with fallbacks)
    const survey = profile.surveyData || {};

    const financialStress =
      survey.moneyFeeWorries ||
      profile.financialStress ||
      profile.familyIncome ||
      '';

    const mentalHealthStatus =
      survey.mentalHealthState ||
      profile.mentalHealthSelfReport ||
      '';

    const sleepHours =
      survey.nightlySleepHours ||
      profile.sleepHoursPerNight ||
      '';

    const studyHours =
      survey.dailySelfStudyHours ||
      profile.studyHoursPerDay ||
      '';

    const impactFactors =
      survey.impactFactors ||
      profile.addictions ||
      [];

    const attendancePercentage = profile.attendancePercentage ?? profile.attendance ?? null;
    const cgpa = profile.cgpa ?? profile.latestMarks ?? null;

    // 4. Prepare comprehensive payload for Gemini AI Service
    const evaluationPayload = {
      name: user.name,
      cgpa: cgpa,
      latestMarks: cgpa,
      attendancePercentage: attendancePercentage,
      financialStress: financialStress,
      academicWorkload: studyHours,
      mentalHealthStatus: mentalHealthStatus,
      sleepHours: sleepHours,
      impactFactors: impactFactors,
      qualitativeNotes: profile.qualitativeNotes || [],
    };

    // 5. Execute Gemini AI Analysis
    let aiAssessment = { riskLevel: 'Low', riskCategory: 'None', aiRecommendations: [] };
    
    try {
      aiAssessment = await evaluateStudentRiskWithGemini(evaluationPayload);
    } catch (aiErr) {
      console.warn('Gemini Service unavailable/error. Falling back to rule engine:', aiErr.message);
    }

    let finalRiskLevel = aiAssessment.riskLevel || 'Low';
    let finalRiskCategory = aiAssessment.riskCategory || 'None';

    // 6. SAFEGUARD OVERRIDE: Ensure severe survey responses trigger appropriate categories
    const mentalLower = mentalHealthStatus.toLowerCase();
    const financialLower = financialStress.toLowerCase();

    const hasMentalStress =
      mentalLower.includes('anxious') ||
      mentalLower.includes('stress') ||
      mentalLower.includes('overwhelmed') ||
      sleepHours.toLowerCase().includes('less than 5');

    const hasFinancialStress =
      financialLower.includes('high') ||
      financialLower.includes('severe') ||
      financialLower.includes('burden');

    if (hasMentalStress) {
      finalRiskCategory = 'Wellness & Mental Health';
      if (finalRiskLevel === 'Low' || finalRiskLevel === 'Unevaluated') {
        finalRiskLevel = 'Medium';
      }
    } else if (hasFinancialStress) {
      finalRiskCategory = 'Financial Burden';
      if (finalRiskLevel === 'Low' || finalRiskLevel === 'Unevaluated') {
        finalRiskLevel = 'Medium';
      }
    }

    // 7. Update MongoDB Profile Document
    profile.riskLevel = finalRiskLevel;
    profile.riskCategory = finalRiskCategory;
    profile.riskEvaluated = true; // Sets flag for teacher portal table
    profile.aiRecommendations = aiAssessment.aiRecommendations || [];
    profile.lastEvaluatedAt = new Date();
    profile.lastAiAnalysisDate = new Date();

    // 8. Update Automated Action Flags for Counselor Referral
    const categoryLower = finalRiskCategory.toLowerCase();
    const isCounselorNeeded =
      categoryLower.includes('wellness') ||
      categoryLower.includes('mental') ||
      categoryLower.includes('financial') ||
      categoryLower.includes('personal');

    profile.recommendedActions = {
      enableRemedialQuiz: categoryLower.includes('academic') || (cgpa !== null && cgpa < 6.5),
      matchPeerTutor: cgpa !== null && cgpa < 6.0,
      escalateToCounselor: isCounselorNeeded,
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Student risk successfully evaluated',
      assessment: {
        studentId: user._id,
        name: user.name,
        riskLevel: profile.riskLevel,
        riskCategory: profile.riskCategory,
        riskEvaluated: profile.riskEvaluated,
        aiRecommendations: profile.aiRecommendations,
        recommendedActions: profile.recommendedActions,
      },
    });
  } catch (error) {
    console.error('Error in evaluateStudentRisk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI risk evaluation',
      error: error.message,
    });
  }
};