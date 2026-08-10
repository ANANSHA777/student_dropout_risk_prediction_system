const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path to your User model
const { protect, authorize } = require('../middleware/authMiddleware');

// Import Teacher Controllers
const {
  getTeacherStudents,
  updateStudentMarks,
  createStudent,
  deleteStudent,
  evaluateStudentRisk,
} = require('../controllers/teacherController');

// Debug check on server startup
console.log({
  protect,
  authorize,
  getTeacherStudents,
  updateStudentMarks,
  createStudent,
  deleteStudent,
  evaluateStudentRisk,
});

// ==========================================
// STUDENT MANAGEMENT ROUTES
// ==========================================

// GET /api/teacher/students - Fetch class roster
router.get('/students', protect, authorize('Teacher', 'Admin'), getTeacherStudents);

// POST /api/teacher/students - Register a new student manually
router.post('/students', protect, authorize('Teacher', 'Admin'), createStudent);

// PUT & POST /api/teacher/students/:id/marks - Update marks & attendance
router.put('/students/:id/marks', protect, authorize('Teacher', 'Admin'), updateStudentMarks);
router.post('/students/:id/marks', protect, authorize('Teacher', 'Admin'), updateStudentMarks);

// AI RISK EVALUATION ROUTES (Multiple route aliases for full frontend compatibility)
router.post('/evaluate-risk/:studentId', protect, authorize('Teacher', 'Admin'), evaluateStudentRisk);
router.post('/students/:id/evaluate', protect, authorize('Teacher', 'Admin'), evaluateStudentRisk);
router.post('/risk/evaluate', protect, authorize('Teacher', 'Admin'), evaluateStudentRisk);

// DELETE /api/teacher/students/:id - Remove a student
router.delete('/students/:id', protect, authorize('Teacher', 'Admin'), async (req, res, next) => {
  if (deleteStudent) {
    return deleteStudent(req, res, next);
  }
  
  // Inline fallback if deleteStudent controller is not defined
  try {
    const student = await User.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.status(200).json({ message: 'Student deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Error deleting student' });
  }
});

// ==========================================
// ACCOUNT ROUTES
// ==========================================

// POST /api/teacher/change-password - Change Teacher Password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    // 1. Validate incoming body payload
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // 2. Extract user ID from authenticated JWT payload
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // 3. Explicitly select '+password' to bypass 'select: false' in Mongoose schemas
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (!user.password) {
      return res.status(500).json({ message: 'Unable to retrieve password hash from database' });
    }

    // 4. Safely perform bcrypt comparison
    const isMatch = await bcrypt.compare(String(currentPassword), String(user.password));
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // 5. Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(String(newPassword), salt);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ message: err.message || 'Server error updating password' });
  }
});

module.exports = router;