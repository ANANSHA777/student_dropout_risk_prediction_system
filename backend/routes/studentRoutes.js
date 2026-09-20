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

const uploadFinancialDocument =
  studentController.uploadFinancialDocument ||
  ((req, res) => res.status(501).json({ message: 'uploadFinancialDocument controller missing' }));

const getDashboardSummary =
  studentController.getDashboardSummary ||
  studentController.getStudentProfile ||
  ((req, res) => res.status(501).json({ message: 'getDashboardSummary controller missing' }));

const confirmCounselingSession =
  studentController.confirmCounselingSession ||
  ((req, res) => res.status(501).json({ message: 'confirmCounselingSession controller missing' }));

// --- STUDENT PROFILE & SURVEY ROUTES ---

// GET /api/student/dashboard-summary - Complete student dashboard summary with active plans & sessions
router.get(
  '/dashboard-summary',
  protect,
  authorize('Student', 'Admin'),
  getDashboardSummary
);

// GET /api/student/profile - Get profile, CGPA, attendance & evaluation status
router.get(
  '/profile',
  protect,
  authorize('Student', 'Admin'),
  getStudentProfile
);

// POST /api/student/confirm-session - Student confirms attendance for scheduled session
router.post(
  '/confirm-session',
  protect,
  authorize('Student', 'Admin'),
  confirmCounselingSession
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

// POST /api/student/upload-document - Upload financial relief verification document
router.post(
  '/upload-document',
  protect,
  authorize('Student', 'Admin'),
  uploadFinancialDocument
);

// GET /api/student/interventions - Fetch assigned academic plans & counselor assignments
router.get(
  '/interventions',
  protect,
  authorize('Student', 'Admin'),
  getStudentInterventions
);

module.exports = router;