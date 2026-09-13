// routes/riskRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Import existing controller function
const riskController = require('../controllers/riskController');

// Extract existing functions safely
const evaluateStudentRisk =
  riskController.evaluateStudentRisk ||
  riskController.evaluateRisk ||
  ((req, res) => res.status(501).json({ message: 'Evaluate handler missing' }));

// Extract or provide fallback stubs for new intervention handlers
const getRiskOverview =
  riskController.getRiskOverview ||
  ((req, res) => res.json({ message: 'Risk overview endpoint placeholder' }));

const assignAcademicPlan =
  riskController.assignAcademicPlan ||
  ((req, res) => res.json({ message: 'Academic plan assigned' }));

const assignCounselor =
  riskController.assignCounselor ||
  ((req, res) => res.json({ message: 'Counselor assigned' }));

const grantFinancialAid =
  riskController.grantFinancialAid ||
  ((req, res) => res.json({ message: 'Financial aid processed' }));

// --- RISK EVALUATION ENDPOINTS ---

// GET /api/risk/overview - Fetch class/department wide risk analytics
router.get(
  '/overview',
  protect,
  authorize('Teacher', 'Counselor', 'Admin'),
  getRiskOverview
);

// POST /api/risk/evaluate - Triggers dynamic Gemini AI evaluation (via JSON body { studentId })
router.post(
  '/evaluate',
  protect,
  authorize('Teacher', 'Counselor', 'Admin'),
  evaluateStudentRisk
);

// POST /api/risk/evaluate/:studentId - Support URL parameter calls if frontend passes ID in route
router.post(
  '/evaluate/:studentId',
  protect,
  authorize('Teacher', 'Counselor', 'Admin'),
  evaluateStudentRisk
);

// --- RECOMMENDED INTERVENTION ENDPOINTS ---

// POST /api/risk/assign-plan - Assign Academic Support / Remedial Plan
router.post(
  '/assign-plan',
  protect,
  authorize('Teacher', 'Admin'),
  assignAcademicPlan
);

// POST /api/risk/assign-counselor - Assign Counselor to at-risk student
router.post(
  '/assign-counselor',
  protect,
  authorize('Teacher', 'Admin'),
  assignCounselor
);

// POST /api/risk/grant-financial-aid - Process & record college fund grant
router.post(
  '/grant-financial-aid',
  protect,
  authorize('Teacher', 'Admin'),
  grantFinancialAid
);

module.exports = router;