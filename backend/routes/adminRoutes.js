// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

// 1. Import authentication & authorization middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// 2. Import admin controller functions
const {
  getStaffMembers,
  createStaffMember,
  deleteStaffMember,
  getOverallRiskAnalytics,
  getFilteredStudentsForAdmin,
} = require('../controllers/adminController');

// -------------------------------------------------------------
// Protect EVERY route in this file for Admins only
// -------------------------------------------------------------
router.use(protect);
router.use(authorize('Admin'));

// --- Staff Management Routes ---
router.get('/staff', getStaffMembers);
router.post('/staff', createStaffMember);
router.delete('/staff/:id', deleteStaffMember);

// --- Student Analytics & Department Roster Routes ---
router.get('/risk-analytics', getOverallRiskAnalytics);
router.get('/students', getFilteredStudentsForAdmin);

module.exports = router;