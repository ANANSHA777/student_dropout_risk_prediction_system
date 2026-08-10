const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { evaluateStudentRiskWithGemini } = require('../services/riskService');

// @desc    Trigger AI Risk Evaluation for a specific student
// @route   POST /api/risk/evaluate
// @access  Private (Teacher, Counselor, Admin)
exports.evaluateStudentRisk = async (req, res) => {
  try {
    const { studentId } = req.body;

    // Find user and student profile
    const query = studentId.match(/^[0-9a-fA-F]{24}$/) ? { _id: studentId } : { studentId };
    const user = await User.findOne(query).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student user not found' });
    }

    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) {
      profile = new StudentProfile({ user: user._id });
    }

    // Prepare payload for Gemini
    const evaluationPayload = {
      name: user.name,
      attendancePercentage: profile.attendancePercentage || 0,
      latestMarks: profile.latestMarks || 0,
      financialStress: profile.financialStress,
      academicWorkload: profile.academicWorkload,
      mentalHealthStatus: profile.mentalHealthSelfReport,
      qualitativeNotes: profile.qualitativeNotes,
    };

    // Execute Gemini AI analysis
    const aiAssessment = await evaluateStudentRiskWithGemini(evaluationPayload);

    // Update student profile in MongoDB
    profile.riskLevel = aiAssessment.riskLevel;
    profile.riskCategory = aiAssessment.riskCategory;
    profile.aiRecommendations = aiAssessment.aiRecommendations;
    profile.lastEvaluatedAt = new Date();

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Student risk successfully evaluated by Gemini AI',
      assessment: {
        studentId: user._id,
        name: user.name,
        ...aiAssessment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process AI risk evaluation',
      error: error.message,
    });
  }
};