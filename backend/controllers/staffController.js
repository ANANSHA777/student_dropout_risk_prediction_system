const User = require('../models/User');
// Adjust path according to your models folder
const CounselingSession = require('../models/CounselingSession'); 

// @desc    Get students assigned to teacher/counselor by department
// @route   GET /api/staff/students
// @access  Private (Teacher, Counselor)
const getAssignedStudents = async (req, res) => {
  try {
    const { department } = req.user; // Set by 'protect' middleware

    // Fetch students belonging to the staff member's department
    const students = await User.find({
      role: 'Student',
      department: department
    })
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      department,
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assigned students',
      error: error.message
    });
  }
};

// @desc    Get courses managed by logged-in Teacher
// @route   GET /api/staff/courses
// @access  Private (Teacher only)
const getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Optional Course model lookup (if using a Course collection)
    // Replace with: const courses = await Course.find({ instructor: teacherId });
    const mockCourses = [
      { id: 'cs101', name: 'Intro to Computer Science', department: req.user.department },
      { id: 'cs201', name: 'Data Structures & Algorithms', department: req.user.department }
    ];

    res.status(200).json({
      success: true,
      count: mockCourses.length,
      courses: mockCourses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher courses',
      error: error.message
    });
  }
};

// @desc    Get upcoming/past counseling sessions for logged-in Counselor
// @route   GET /api/staff/sessions
// @access  Private (Counselor only)
const getCounselingSessions = async (req, res) => {
  try {
    const counselorId = req.user._id;

    const sessions = await CounselingSession.find({ counselor: counselorId })
      .populate('student', 'name email department')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching counseling sessions',
      error: error.message
    });
  }
};

// @desc    Add/Update a guidance note for a student counseling session
// @route   POST /api/staff/sessions/note
// @access  Private (Counselor only)
const createCounselingNote = async (req, res) => {
  try {
    const { studentId, sessionDate, notes, status } = req.body;
    const counselorId = req.user._id;

    if (!studentId || !notes) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and session notes are required'
      });
    }

    // Check if student exists
    const studentExists = await User.findOne({ _id: studentId, role: 'Student' });
    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found'
      });
    }

    // Create session entry
    const session = await CounselingSession.create({
      counselor: counselorId,
      student: studentId,
      notes,
      status: status || 'Completed',
      date: sessionDate || Date.now()
    });

    const populatedSession = await session.populate('student', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Counseling note logged successfully',
      session: populatedSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while logging counseling note',
      error: error.message
    });
  }
};

module.exports = {
  getAssignedStudents,
  getTeacherCourses,
  getCounselingSessions,
  createCounselingNote
};