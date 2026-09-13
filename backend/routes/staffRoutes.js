// backend/routes/staffRoutes.js
const express = require('express');
const router = express.Router();

// Import Auth Middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// Import Staff Controllers safely
const staffController = require('../controllers/staffController');

// Extract or provide safe fallback handlers to prevent server crashes
const getAssignedStudents =
  staffController.getAssignedStudents ||
  ((req, res) => res.status(501).json({ message: 'getAssignedStudents controller missing' }));

const getTeacherCourses =
  staffController.getTeacherCourses ||
  ((req, res) => res.status(501).json({ message: 'getTeacherCourses controller missing' }));

const getCounselingSessions =
  staffController.getCounselingSessions ||
  ((req, res) => res.status(501).json({ message: 'getCounselingSessions controller missing' }));

const createCounselingNote =
  staffController.createCounselingNote ||
  ((req, res) => res.status(501).json({ message: 'createCounselingNote controller missing' }));

const logStaffIntervention =
  staffController.logStaffIntervention ||
  ((req, res) => res.status(200).json({ message: 'Staff intervention logged successfully' }));

// 1. Require JWT login for ALL routes in this file
router.use(protect);

// -------------------------------------------------------------
// Shared Routes (Accessible by Teachers, Counselors, and Admins)
// -------------------------------------------------------------
router.get(
  '/students', 
  authorize('Teacher', 'Counselor', 'Admin'), 
  getAssignedStudents
);

router.post(
  '/students/:id/intervention',
  authorize('Teacher', 'Counselor', 'Admin'),
  logStaffIntervention
);

// -------------------------------------------------------------
// Teacher-Only Routes (And Admin)
// -------------------------------------------------------------
router.get(
  '/courses', 
  authorize('Teacher', 'Admin'), 
  getTeacherCourses
);

// -------------------------------------------------------------
// Counselor-Only Routes (And Admin)
// -------------------------------------------------------------
router.get(
  '/sessions', 
  authorize('Counselor', 'Admin'), 
  getCounselingSessions
);

router.post(
  '/sessions/note', 
  authorize('Counselor', 'Admin'), 
  createCounselingNote
);

module.exports = router;