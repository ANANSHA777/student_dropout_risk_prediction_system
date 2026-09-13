// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import Auth Controllers safely
const authController = require('../controllers/authController');

const register =
  authController.register ||
  ((req, res) => res.status(501).json({ message: 'register controller missing' }));

const login =
  authController.login ||
  ((req, res) => res.status(501).json({ message: 'login controller missing' }));

const getMe =
  authController.getMe ||
  ((req, res) => res.status(501).json({ message: 'getMe controller missing' }));

const changePassword =
  authController.changePassword ||
  ((req, res) => res.status(501).json({ message: 'changePassword controller missing' }));

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/register - Register a new account
router.post('/register', register);

// POST /api/auth/login - User login & JWT issuance
router.post('/login', login);

// GET /api/auth/me - Fetch authenticated user profile
router.get('/me', protect, getMe);

// POST /api/auth/change-password - Change current user password
router.post('/change-password', protect, changePassword);

module.exports = router;