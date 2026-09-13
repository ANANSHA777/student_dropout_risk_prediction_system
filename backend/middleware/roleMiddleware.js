// backend/middleware/roleMiddleware.js

const authorize = (...roles) => {
  // Flatten array arguments and normalize allowed roles to lowercase
  const normalizedRoles = roles
    .flat()
    .map((role) => String(role).trim().toLowerCase());

  return (req, res, next) => {
    // 1. Verify user object exists (populated by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // 2. Extract and normalize the current user's role
    const userRole = req.user.role ? String(req.user.role).trim().toLowerCase() : '';

    // 3. Verify user's role matches any allowed role
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
  authorize,
};