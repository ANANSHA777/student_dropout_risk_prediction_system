// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Authenticate JWT Token
const protect = async (req, res, next) => {
  let token;

  // Extract Bearer token from Authorization header or Cookie parser
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Clean raw token string (strip quotes or excess whitespace)
  if (token && typeof token === 'string') {
    token = token.trim().replace(/^["']|["']$/g, '');
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided.',
    });
  }

  try {
    // Verify token signature against secret key
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret123'
    );

    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, malformed token payload.',
      });
    }

    // Attach user record to request object (excluding password hash) using lean() for query speed
    req.user = await User.findById(userId).select('-password').lean();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    return next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' 
        ? 'Session expired, please login again.' 
        : 'Not authorized, token verification failed.',
    });
  }
};

// 2. Authorize Specific User Roles (supports spread parameters or arrays)
const authorize = (...allowedRoles) => {
  // Flatten array arguments and normalize allowed roles to lowercase
  const normalizedRoles = allowedRoles
    .flat()
    .map((role) => String(role).trim().toLowerCase());

  return (req, res, next) => {
    // Verify user object exists (populated by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Extract and normalize the current user's role
    const userRole = req.user.role ? String(req.user.role).trim().toLowerCase() : '';

    // Verify user's role matches any allowed role
    if (!userRole || !normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role || 'Unassigned'}' is not authorized to access this route`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};