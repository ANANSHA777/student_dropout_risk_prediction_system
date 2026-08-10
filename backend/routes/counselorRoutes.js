const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCounselorCases,
  logInterventionNote,
} = require('../controllers/counselorController');

// GET /api/counselor/cases
router.get('/cases', protect, authorize('Counselor', 'Admin'), getCounselorCases);

// POST /api/counselor/students/:id/intervention
router.post('/students/:id/intervention', protect, authorize('Counselor', 'Admin'), logInterventionNote);

module.exports = router;