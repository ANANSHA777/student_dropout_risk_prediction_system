const User = require('../models/User'); // Adjust path to models
const StudentProfile = require('../models/StudentProfile');

// @desc    Get all students flagged for counselor review/intervention
// @route   GET /api/counselor/cases
// @access  Private (Counselor, Admin)
exports.getCounselorCases = async (req, res) => {
  try {
    // Fetch students who are flagged with High/Medium risk or assigned to counseling
    const cases = await User.find({ role: 'Student' })
      .select('-password')
      .lean();

    res.status(200).json({
      success: true,
      count: cases.length,
      cases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching counselor cases',
      error: error.message,
    });
  }
};

// @desc    Log intervention note for a student
// @route   POST /api/counselor/students/:id/intervention
// @access  Private (Counselor, Admin)
exports.logInterventionNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionType, notes, status, actionPlan } = req.body;

    // Record the intervention on the student profile or user model
    await StudentProfile.findOneAndUpdate(
      { user: id },
      {
        $push: {
          interventions: {
            sessionType,
            notes,
            status,
            actionPlan,
            date: new Date(),
            counselor: req.user._id,
          },
        },
        $set: { status },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Intervention logged successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error logging intervention',
      error: error.message,
    });
  }
};