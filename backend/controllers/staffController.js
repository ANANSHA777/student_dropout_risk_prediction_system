// backend/controllers/staffController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

let CounselingSession;
try {
  CounselingSession = require('../models/CounselingSession');
} catch (err) {
  CounselingSession = null;
}

// @desc    Get students assigned to teacher/counselor by department with populated StudentProfile
// @route   GET /api/staff/students
// @access  Private (Teacher, Counselor)
const getAssignedStudents = async (req, res) => {
  try {
    const department = req.user?.department;
    const userRole = req.user?.role || 'Teacher';

    // Build filter query: counselors can view all students if department is unrestricted
    const query = { role: 'Student' };
    if (department && userRole !== 'Admin') {
      query.department = department;
    }

    // Fetch students belonging to the staff member's department
    const students = await User.find(query)
      .select('-password')
      .sort({ name: 1 })
      .lean();

    const studentIds = students.map((s) => s._id);

    // Fetch matching student profiles for risk scores, CGPA, and attendance
    const profiles = await StudentProfile.find({ user: { $in: studentIds } }).lean();
    const profileMap = new Map();
    profiles.forEach((p) => {
      if (p.user) profileMap.set(p.user.toString(), p);
    });

    // Merge user account info with profile analytics
    const mergedStudents = students.map((student) => {
      const profile = profileMap.get(student._id.toString()) || {};
      return {
        ...student,
        profileId: profile._id || null,
        cgpa: profile.cgpa ?? student.cgpa ?? null,
        attendancePercentage: profile.attendancePercentage ?? student.attendance ?? null,
        attendance: profile.attendancePercentage ?? student.attendance ?? null,
        surveyCompleted: Boolean(profile.surveyCompleted || student.surveyCompleted),
        riskLevel: profile.riskLevel || student.riskLevel || 'Unevaluated',
        riskCategory: profile.riskCategory || 'None',
        primaryRiskCategory: profile.primaryRiskCategory || 'NONE',
        riskEvaluated: Boolean(profile.riskEvaluated),
        recommendedActions: profile.recommendedActions || {},
        aiRecommendations: profile.aiRecommendations || [],
        surveyData: profile.surveyData || {},
      };
    });

    res.status(200).json({
      success: true,
      count: mergedStudents.length,
      department: department || 'All Departments',
      students: mergedStudents,
      data: mergedStudents,
    });
  } catch (error) {
    console.error('Error in getAssignedStudents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assigned students',
      error: error.message,
    });
  }
};

// @desc    Get courses managed by logged-in Teacher
// @route   GET /api/staff/courses
// @access  Private (Teacher only)
const getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user?._id || req.user?.id;
    const department = req.user?.department || 'Computer Science';

    const mockCourses = [
      { id: 'cs101', code: 'CS101', name: 'Intro to Computer Science', department, instructor: teacherId },
      { id: 'cs201', code: 'CS201', name: 'Data Structures & Algorithms', department, instructor: teacherId },
      { id: 'cs301', code: 'CS301', name: 'Database Management Systems', department, instructor: teacherId },
    ];

    res.status(200).json({
      success: true,
      count: mockCourses.length,
      courses: mockCourses,
      data: mockCourses,
    });
  } catch (error) {
    console.error('Error in getTeacherCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher courses',
      error: error.message,
    });
  }
};

// @desc    Get upcoming/past counseling sessions for logged-in Counselor
// @route   GET /api/staff/sessions
// @access  Private (Counselor only)
const getCounselingSessions = async (req, res) => {
  try {
    const counselorId = req.user?._id || req.user?.id;

    let sessions = [];
    if (CounselingSession) {
      sessions = await CounselingSession.find({ counselor: counselorId })
        .populate('student', 'name email department studentId')
        .sort({ date: -1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
      data: sessions,
    });
  } catch (error) {
    console.error('Error in getCounselingSessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching counseling sessions',
      error: error.message,
    });
  }
};

// @desc    Add/Update a guidance note for a student counseling session
// @route   POST /api/staff/sessions/note
// @access  Private (Counselor only)
const createCounselingNote = async (req, res) => {
  try {
    const { studentId, id, sessionDate, notes, note, status } = req.body;
    const targetStudentId = studentId || id;
    const sessionNotes = notes || note;
    const counselorId = req.user?._id || req.user?.id;

    if (!targetStudentId || !sessionNotes) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and session notes are required',
      });
    }

    // Validate ObjectId format before querying MongoDB to prevent CastError crashes
    if (!mongoose.Types.ObjectId.isValid(targetStudentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format',
      });
    }

    // Check if student exists
    const studentExists = await User.findOne({ _id: targetStudentId, role: 'Student' });
    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found',
      });
    }

    let sessionPayload = null;

    // 1. Create session entry via CounselingSession collection if available
    if (CounselingSession) {
      const session = await CounselingSession.create({
        counselor: counselorId,
        student: targetStudentId,
        notes: sessionNotes,
        status: status || 'Completed',
        date: sessionDate || Date.now(),
      });
      sessionPayload = await session.populate('student', 'name email department');
    }

    // 2. Also append qualitative note to linked StudentProfile schema
    await StudentProfile.findOneAndUpdate(
      { user: targetStudentId },
      {
        $push: {
          qualitativeNotes: {
            author: req.user?.name || 'Counselor',
            note: sessionNotes,
            createdAt: new Date(),
          },
        },
      },
      { upsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Counseling note logged successfully',
      session: sessionPayload || {
        student: { name: studentExists.name, email: studentExists.email },
        notes: sessionNotes,
        status: status || 'Completed',
        date: sessionDate || new Date(),
      },
    });
  } catch (error) {
    console.error('Error in createCounselingNote:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while logging counseling note',
      error: error.message,
    });
  }
};

module.exports = {
  getAssignedStudents,
  getTeacherCourses,
  getCounselingSessions,
  createCounselingNote,
};