// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Import controller safely
const studentController = require('../controllers/studentController');

// Extract or provide safe fallback handlers to prevent server crashes
const getStudentProfile =
  studentController.getStudentProfile ||
  ((req, res) => res.status(501).json({ message: 'getStudentProfile controller missing' }));

const submitStudentSurvey =
  studentController.submitStudentSurvey ||
  ((req, res) => res.status(501).json({ message: 'submitStudentSurvey controller missing' }));

const getStudentSurvey =
  studentController.getStudentSurvey ||
  ((req, res) => res.json({ message: 'getStudentSurvey endpoint placeholder', survey: null }));

const getStudentInterventions =
  studentController.getStudentInterventions ||
  ((req, res) => res.json({ message: 'getStudentInterventions endpoint placeholder', interventions: [] }));

// --- STUDENT PROFILE & SURVEY ROUTES ---

// GET /api/student/profile - Get profile, CGPA, attendance & evaluation status
router.get(
  '/profile',
  protect,
  authorize('Student', 'Admin'),
  getStudentProfile
);

// GET /api/student/survey - Get existing survey responses if already completed
router.get(
  '/survey',
  protect,
  authorize('Student', 'Admin'),
  getStudentSurvey
);

// POST /api/student/survey - Submit or update self-assessment survey answers
router.post(
  '/survey',
  protect,
  authorize('Student', 'Admin'),
  submitStudentSurvey
);

// GET /api/student/interventions - Fetch assigned academic plans & counselor assignments
router.get(
  '/interventions',
  protect,
  authorize('Student', 'Admin'),
  getStudentInterventions
);

module.exports = router;