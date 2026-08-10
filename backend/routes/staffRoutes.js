// backend/routes/staffRoutes.js
const express = require('express');
const router = express.Router();

// Import Auth Middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// Import Controllers (create these in controllers/staffController.js)
const {
  getAssignedStudents,
  getTeacherCourses,
  getCounselingSessions,
  createCounselingNote
} = require('../controllers/staffController');

// 1. Require JWT login for ALL routes in this file
router.use(protect);

// -------------------------------------------------------------
// Shared Routes (Accessible by both Teachers and Counselors)
// -------------------------------------------------------------
router.get(
  '/students', 
  authorize('Teacher', 'Counselor'), 
  getAssignedStudents
);

// -------------------------------------------------------------
// Teacher-Only Routes
// -------------------------------------------------------------
router.get(
  '/courses', 
  authorize('Teacher'), 
  getTeacherCourses
);

// -------------------------------------------------------------
// Counselor-Only Routes
// -------------------------------------------------------------
router.get(
  '/sessions', 
  authorize('Counselor'), 
  getCounselingSessions
);

router.post(
  '/sessions/note', 
  authorize('Counselor'), 
  createCounselingNote
);

module.exports = router;