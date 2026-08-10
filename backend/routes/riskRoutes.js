// routes/riskRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { evaluateStudentRisk } = require('../controllers/riskController');

// POST /api/risk/evaluate - Triggers dynamic Gemini AI evaluation
router.post('/evaluate', protect, authorize('Teacher', 'Counselor', 'Admin'), evaluateStudentRisk);

module.exports = router;