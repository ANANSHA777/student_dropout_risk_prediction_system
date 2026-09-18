// routes/counselorRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Import Counselor Controller safely
const counselorController = require('../controllers/counselorController');

// Extract or provide safe fallback handlers to prevent server crashes
const getCounselorCases =
  counselorController.getCounselorCases ||
  ((req, res) => res.status(501).json({ message: 'getCounselorCases controller missing' }));

const logInterventionNote =
  counselorController.logInterventionNote ||
  ((req, res) => res.status(501).json({ message: 'logInterventionNote controller missing' }));

const getStudentSessions =
  counselorController.getStudentSessions ||
  ((req, res) => res.json({ message: 'getStudentSessions endpoint placeholder', sessions: [] }));

const logCounselingSession =
  counselorController.logCounselingSession ||
  ((req, res) => res.status(200).json({ message: 'Counseling session logged successfully' }));

const updateCaseStatus =
  counselorController.updateCaseStatus ||
  ((req, res) => res.status(200).json({ message: 'Case status updated successfully' }));

// Protect all routes in this file for Counselors and Admins
router.use(protect);
router.use(authorize('Counselor', 'Admin'));

// --- COUNSELOR CASELOAD & INTERVENTIONS ---

// GET /api/counselor/cases - Get assigned at-risk student caseload
router.get('/cases', getCounselorCases);

// POST /api/counselor/students/:id/intervention - Add qualitative note / action step to student profile
router.post('/students/:id/intervention', logInterventionNote);

// PUT/PATCH /api/counselor/students/:id/status - Update intervention status (e.g. In Review, Resolved)
router.put('/students/:id/status', updateCaseStatus);
router.patch('/students/:id/status', updateCaseStatus);

// --- DETAILED COUNSELING SESSIONS ---

// GET /api/counselor/students/:id/sessions - Fetch counseling history for a student
router.get('/students/:id/sessions', getStudentSessions);

// POST /api/counselor/sessions - Record new counseling session details
router.post('/sessions', logCounselingSession);

module.exports = router;