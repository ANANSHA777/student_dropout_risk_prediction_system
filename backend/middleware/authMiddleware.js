// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Authenticate JWT Token
const protect = async (req, res, next) => {
  let token;

  // Check for 'Bearer <token>' in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header and strip whitespace/quotes
      token = req.headers.authorization.split(' ')[1]?.trim();

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, malformed token structure.',
        });
      }

      // Verify token signature (uses fallback secret to match authController)
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret123'
      );

      // Attach authenticated user payload to req (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

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
        message: 'Not authorized, token verification failed.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided.',
    });
  }
};

// 2. Authorize Specific User Roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the 'protect' middleware
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'Guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};