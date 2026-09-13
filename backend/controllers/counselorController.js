// backend/controllers/counselorController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// @desc    Get all students flagged for counselor review/intervention (High/Medium risk)
// @route   GET /api/counselor/cases
// @access  Private (Counselor, Admin)
exports.getCounselorCases = async (req, res) => {
  try {
    // 1. Fetch all students with role 'Student'
    const students = await User.find({ role: 'Student' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((s) => s._id);

    // 2. Fetch associated student profiles
    const profiles = await StudentProfile.find({ user: { $in: studentIds } }).lean();
    
    const profileMap = new Map();
    profiles.forEach((profile) => {
      if (profile.user) {
        profileMap.set(profile.user.toString(), profile);
      }
    });

    // 3. Combine user info with profiles and filter strictly for actionable/flagged cases
    const cases = students
      .map((user) => {
        const profile = profileMap.get(user._id.toString()) || {};
        const riskLevel = profile.riskLevel || user.riskLevel || 'Unevaluated';

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          studentId: profile.studentId || user.studentId || '',
          department: profile.department || user.department || 'Computer Science',
          yearOfStudy: profile.yearOfStudy || user.yearOfStudy || '1st Year',
          riskLevel: riskLevel,
          riskCategory: profile.riskCategory || 'None',
          primaryRiskCategory: profile.primaryRiskCategory || 'NONE',
          interventions: profile.interventions || [],
          qualitativeNotes: profile.qualitativeNotes || [],
          surveyCompleted: Boolean(profile.surveyCompleted || user.surveyCompleted),
          cgpa: profile.cgpa ?? user.cgpa ?? null,
          attendance: profile.attendancePercentage ?? user.attendance ?? null,
        };
      })
      // Keep students explicitly evaluated at 'High' or 'Medium' risk, or flagged for counseling
      .filter((student) => ['High', 'Medium'].includes(student.riskLevel));

    res.status(200).json({
      success: true,
      count: cases.length,
      cases,
      data: cases,
    });
  } catch (error) {
    console.error('Error in getCounselorCases:', error);
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

    if (!notes && !actionPlan) {
      return res.status(400).json({
        success: false,
        message: 'Intervention notes or action plan is required',
      });
    }

    // Validate parameter format to prevent CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format',
      });
    }

    // Check if target student user exists
    const studentUser = await User.findOne({ _id: id, role: 'Student' });
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found',
      });
    }

    const newIntervention = {
      sessionType: sessionType || 'Counseling Session',
      notes: notes || '',
      status: status || 'In Progress',
      actionPlan: actionPlan || '',
      date: new Date(),
      counselor: req.user?._id || req.user?.id,
    };

    // Record intervention on student profile
    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { user: id },
      {
        $push: { interventions: newIntervention },
        $set: { 
          counselingStatus: status || 'In Progress',
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Intervention logged successfully',
      intervention: newIntervention,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error in logInterventionNote:', error);
    res.status(500).json({
      success: false,
      message: 'Server error logging intervention',
      error: error.message,
    });
  }
};