// backend/routes/academicPlanRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const academicPlanController = require('../controllers/academicPlanController');

// All routes require authentication
router.use(protect);

// POST /api/academic-plan/generate - Generate strictly academic intervention plan
router.post('/generate', authorize('Teacher', 'Admin'), academicPlanController.generatePlan);

// POST /api/academic-plan/assign - Assign academic plan to student
router.post('/assign', authorize('Teacher', 'Admin'), academicPlanController.assignPlan);

// GET /api/academic-plan/student/:id - Retrieve assigned academic plan for student
router.get('/student/:id', authorize('Teacher', 'Counselor', 'Admin', 'Student'), academicPlanController.getAcademicPlan);

module.exports = router;
