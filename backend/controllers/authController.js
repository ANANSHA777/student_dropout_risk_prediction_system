// backend/controllers/authController.js
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, studentId, yearOfStudy } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const assignedRole = role || 'Student';
    const assignedDept = department ? department.trim() : 'Computer Science';
    const assignedStudentId = studentId ? studentId.trim() : '';
    const assignedYear = yearOfStudy ? yearOfStudy.trim() : '1st Year';

    // 1. Password gets hashed automatically in User schema pre-save hook
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
      department: assignedDept,
      studentId: assignedStudentId,
      yearOfStudy: assignedYear,
      cgpa: null,
      attendance: null,
      surveyCompleted: false,
      riskLevel: null, // Initialized to null for "Not Evaluated"
    });

    // 2. Automatically create linked StudentProfile for Student role
    if (assignedRole === 'Student') {
      await StudentProfile.create({
        user: user._id,
        studentId: assignedStudentId || `STU-${user._id.toString().slice(-4)}`,
        department: assignedDept,
        yearOfStudy: assignedYear,
        cgpa: null,
        attendancePercentage: null,
        surveyCompleted: false,
        riskLevel: null,
      });
    }

    const token = generateToken(user._id);

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      studentId: user.studentId,
      yearOfStudy: user.yearOfStudy,
      cgpa: user.cgpa,
      attendance: user.attendance,
      surveyCompleted: user.surveyCompleted,
      riskLevel: user.riskLevel,
      token,
    };

    // Returns response supporting both flat (user, token) and nested (data) accessors
    res.status(201).json({
      success: true,
      token,
      user: userPayload,
      data: userPayload,
    });
  } catch (error) {
    console.error('Error in register controller:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Schema pre-save method handles comparison
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || 'Computer Science',
      studentId: user.studentId || '',
      yearOfStudy: user.yearOfStudy || '1st Year',
      cgpa: user.cgpa ?? null,
      attendance: user.attendance ?? null,
      surveyCompleted: user.surveyCompleted ?? false,
      riskLevel: user.riskLevel ?? null,
      token,
    };

    res.status(200).json({
      success: true,
      token,
      user: userPayload,
      data: userPayload,
    });
  } catch (error) {
    console.error('Error in login controller:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ 
      success: true, 
      user, 
      data: user 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Fetch user with password field included
    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify existing password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Pre-save hook handles hashing
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating password', error: error.message });
  }
};