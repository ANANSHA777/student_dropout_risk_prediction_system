// backend/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const teacherController = require('../controllers/teacherController');

// Clean helper fallbacks in case specific controller exports are missing
const getTeacherStudents = teacherController.getTeacherStudents || ((req, res) => res.status(501).json({ success: false, message: 'getTeacherStudents controller missing' }));
const createStudent = teacherController.createStudent || ((req, res) => res.status(501).json({ success: false, message: 'createStudent controller missing' }));
const updateStudentMarks = teacherController.updateStudentMarks || ((req, res) => res.status(501).json({ success: false, message: 'updateStudentMarks controller missing' }));
const evaluateStudentRisk = teacherController.evaluateStudentRisk || ((req, res) => res.status(501).json({ success: false, message: 'evaluateStudentRisk controller missing' }));
const getRegisteredCounselors = teacherController.getRegisteredCounselors || ((req, res) => res.status(501).json({ success: false, message: 'getRegisteredCounselors controller missing' }));
const assignCounselorToStudent = teacherController.assignCounselorToStudent || teacherController.assignCounselor || ((req, res) => res.status(501).json({ success: false, message: 'assignCounselorToStudent controller missing' }));
const applyCollegeFinancialAid = teacherController.applyCollegeFinancialAid || teacherController.grantFinancialAid || ((req, res) => res.status(501).json({ success: false, message: 'applyCollegeFinancialAid controller missing' }));
const deleteStudent = teacherController.deleteStudent || ((req, res) => res.status(501).json({ success: false, message: 'deleteStudent controller missing' }));
const requestSurveyResubmission = teacherController.requestSurveyResubmission || ((req, res) => res.status(501).json({ success: false, message: 'requestSurveyResubmission controller missing' }));

// Secure all teacher routes for Teachers and Admins
router.use(protect);
router.use(authorize('Teacher', 'Admin'));

// ==========================================
// STUDENT MANAGEMENT & MARKS ROUTES
// ==========================================
router.get('/students', getTeacherStudents);
router.post('/students', createStudent);
router.put('/students/:id/marks', updateStudentMarks);
router.post('/students/:id/marks', updateStudentMarks);
router.delete('/students/:id', deleteStudent);

// ==========================================
// AI RISK EVALUATION ROUTES
// ==========================================
router.post('/risk/evaluate', evaluateStudentRisk);
router.post('/evaluate-risk/:studentId', evaluateStudentRisk);
router.post('/students/:id/evaluate', evaluateStudentRisk);

// ==========================================
// COUNSELOR ASSIGNMENT & FINANCIAL AID ROUTES
// ==========================================
router.get('/counselors', getRegisteredCounselors);
router.post('/students/:id/assign-counselor', assignCounselorToStudent);
router.post('/students/:id/grant-aid', applyCollegeFinancialAid);
router.post('/students/:id/grant-financial-aid', applyCollegeFinancialAid); // Alias for frontend compatibility
router.post('/request-survey-resubmission', requestSurveyResubmission);
router.post('/students/:id/request-survey-resubmission', (req, res) => {
  req.body.studentId = req.params.id;
  return requestSurveyResubmission(req, res);
});

// ==========================================
// TEACHER ACCOUNT ROUTES
// ==========================================
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized access.' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), String(user.password));
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(String(newPassword), salt);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error updating password.' });
  }
});

module.exports = router;