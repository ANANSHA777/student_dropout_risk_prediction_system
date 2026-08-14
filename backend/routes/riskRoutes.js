// routes/riskRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { evaluateStudentRisk } = require('../controllers/riskController');

// POST /api/risk/evaluate - Triggers dynamic Gemini AI evaluation (via JSON body { studentId })
router.post('/evaluate', protect, authorize('Teacher', 'Counselor', 'Admin'), evaluateStudentRisk);

// POST /api/risk/evaluate/:studentId - Support URL parameter calls if frontend passes ID in route
router.post('/evaluate/:studentId', protect, authorize('Teacher', 'Counselor', 'Admin'), evaluateStudentRisk);

module.exports = router;