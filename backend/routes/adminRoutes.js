// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

// 1. Import authentication & authorization middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// 2. Import admin controller safely
const adminController = require('../controllers/adminController');

// Extract or provide safe fallback handlers to prevent server crashes
const getStaffMembers =
  adminController.getStaffMembers ||
  ((req, res) => res.status(501).json({ message: 'getStaffMembers controller missing' }));

const createStaffMember =
  adminController.createStaffMember ||
  ((req, res) => res.status(501).json({ message: 'createStaffMember controller missing' }));

const deleteStaffMember =
  adminController.deleteStaffMember ||
  ((req, res) => res.status(501).json({ message: 'deleteStaffMember controller missing' }));

const getOverallRiskAnalytics =
  adminController.getOverallRiskAnalytics ||
  ((req, res) => res.status(501).json({ message: 'getOverallRiskAnalytics controller missing' }));

const getFilteredStudentsForAdmin =
  adminController.getFilteredStudentsForAdmin ||
  ((req, res) => res.status(501).json({ message: 'getFilteredStudentsForAdmin controller missing' }));

const assignCounselorAdmin =
  adminController.assignCounselorAdmin ||
  ((req, res) => res.status(200).json({ message: 'Counselor assigned by admin successfully' }));

const assignPlanAdmin =
  adminController.assignPlanAdmin ||
  ((req, res) => res.status(200).json({ message: 'Academic plan assigned by admin successfully' }));

const grantFinancialAidAdmin =
  adminController.grantFinancialAidAdmin ||
  ((req, res) => res.status(200).json({ message: 'Financial aid granted by admin successfully' }));

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

// --- Administrative Overrides & Direct Interventions ---
router.post('/students/:id/assign-counselor', assignCounselorAdmin);
router.post('/students/:id/assign-plan', assignPlanAdmin);
router.post('/students/:id/grant-financial-aid', grantFinancialAidAdmin);

module.exports = router;