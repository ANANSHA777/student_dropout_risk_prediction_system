// backend/controllers/adminController.js
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// @desc    Get all staff members (Teachers & Counselors)
// @route   GET /api/admin/staff
// @access  Private/Admin
const getStaffMembers = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['Teacher', 'Counselor'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: staff.length, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching staff', error: error.message });
  }
};

// @desc    Create/Provision a new staff account
// @route   POST /api/admin/staff
// @access  Private/Admin
const createStaffMember = async (req, res) => {
  try {
    const { name, email, role, department, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!['Teacher', 'Counselor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be Teacher or Counselor' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const newStaff = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role,
      department: department || 'Computer Science',
      isFirstLogin: true,
    });

    const staffResponse = newStaff.toObject();
    delete staffResponse.password;

    res.status(201).json({ success: true, staff: staffResponse });
  } catch (error) {
    console.error('CRITICAL MONGOOSE CREATION ERROR:', error);
    res.status(500).json({ success: false, message: 'Server error while creating staff', error: error.message });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
const deleteStaffMember = async (req, res) => {
  try {
    const { id } = req.params;

    const staffMember = await User.findById(id);
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (!['Teacher', 'Counselor'].includes(staffMember.role)) {
      return res.status(400).json({ success: false, message: 'Cannot delete non-staff user via this endpoint' });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while deleting staff', error: error.message });
  }
};

// @desc    Get overall risk analytics broken down by department and year of study
// @route   GET /api/admin/risk-analytics
// @access  Private/Admin
const getOverallRiskAnalytics = async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' }).select('-password').lean();
    const userIds = students.map((s) => s._id);
    const profiles = await StudentProfile.find({ user: { $in: userIds } }).lean();

    const combinedStudents = students.map((user) => {
      const profile = profiles.find((p) => p.user?.toString() === user._id.toString()) || {};
      return {
        department: profile.department || user.department || 'Computer Science',
        yearOfStudy: profile.yearOfStudy || user.yearOfStudy || '1st Year',
        riskLevel: profile.riskLevel || user.riskLevel || null,
      };
    });

    const analytics = {};

    combinedStudents.forEach((student) => {
      const dept = student.department;
      const year = student.yearOfStudy;

      if (!analytics[dept]) analytics[dept] = {};
      if (!analytics[dept][year]) {
        analytics[dept][year] = {
          total: 0,
          highRisk: 0,
          mediumRisk: 0,
          lowRisk: 0,
          unevaluated: 0,
        };
      }

      const stats = analytics[dept][year];
      stats.total += 1;

      if (student.riskLevel === 'High') stats.highRisk += 1;
      else if (student.riskLevel === 'Medium') stats.mediumRisk += 1;
      else if (student.riskLevel === 'Low') stats.lowRisk += 1;
      else stats.unevaluated += 1;
    });

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching admin risk analytics:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching analytics', error: error.message });
  }
};

// @desc    Get students filtered strictly by department and year of study with fallbacks
// @route   GET /api/admin/students
// @access  Private/Admin
const getFilteredStudentsForAdmin = async (req, res) => {
  try {
    const { department, yearOfStudy } = req.query;

    // Fetch all student users and profiles to ensure legacy data is included
    const students = await User.find({ role: 'Student' }).select('-password').lean();
    const userIds = students.map((s) => s._id);
    const profiles = await StudentProfile.find({ user: { $in: userIds } }).lean();

    // Map combined student objects with defaults for legacy records
    let combinedStudents = students.map((user) => {
      const profile = profiles.find((p) => p.user?.toString() === user._id.toString()) || {};
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: profile.studentId || user.studentId || '',
        department: profile.department || user.department || 'Computer Science',
        yearOfStudy: profile.yearOfStudy || user.yearOfStudy || '1st Year',
        cgpa: profile.cgpa ?? user.cgpa ?? null,
        attendance: profile.attendancePercentage ?? user.attendance ?? null,
        surveyCompleted: profile.surveyCompleted ?? user.surveyCompleted ?? false,
        riskLevel: profile.riskLevel || user.riskLevel || null,
      };
    });

    // Apply Department Filter if set
    if (department && department !== 'All') {
      combinedStudents = combinedStudents.filter(
        (s) => s.department.toLowerCase() === department.toLowerCase()
      );
    }

    // Apply Year of Study Filter if set
    if (yearOfStudy && yearOfStudy !== 'All') {
      combinedStudents = combinedStudents.filter(
        (s) => s.yearOfStudy.toLowerCase() === yearOfStudy.toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      count: combinedStudents.length,
      students: combinedStudents,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching students', error: error.message });
  }
};

module.exports = {
  getStaffMembers,
  createStaffMember,
  deleteStaffMember,
  getOverallRiskAnalytics,
  getFilteredStudentsForAdmin,
};