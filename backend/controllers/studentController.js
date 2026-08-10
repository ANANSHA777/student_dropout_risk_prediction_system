const User = require('../models/User'); // Adjust path to models
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
          name: user.name,
          email: user.email,
          attendancePercentage: 0,
          latestMarks: 0,
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
    
    // Destructure all incoming survey data from req.body
    const {
      familyIncome,
      financialStress,
      livingSituation,
      commuteTime,
      partTimeJob,
      activeBacklogs,
      studyHoursPerDay,
      sleepHoursPerNight,
      mentalHealthStatus,
      addictions,
    } = req.body;

    // Map high financial or wellness stress to elevated risk categories
    let suggestedRiskCategory = 'None';
    if (financialStress === 'High') suggestedRiskCategory = 'Financial / Personal Concern';

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { user: studentId },
      {
        $set: {
          // --- CRITICAL FIXES FOR TEACHER PORTAL STATUS ---
          surveyCompleted: true,            // Marks survey as done (Boolean)
          surveyStatus: 'Completed',         // Marks status string for UI checks
          
          // --- DETAILED SURVEY DATA ---
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
          lastSurveySubmittedAt: new Date(),

          ...(suggestedRiskCategory !== 'None' && { riskCategory: suggestedRiskCategory }),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Self-assessment survey recorded successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error submitting self-assessment',
      error: error.message,
    });
  }
};