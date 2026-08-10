const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getStudentProfile,
  submitStudentSurvey,
} = require('../controllers/studentController');

// All routes here require student role authentication
router.get('/profile', protect, authorize('Student', 'Admin'), getStudentProfile);
router.post('/survey', protect, authorize('Student', 'Admin'), submitStudentSurvey);

module.exports = router;