const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        status: 401
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // KRITIKUS: req.user.id legyen, NEM req.user.userId!
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        status: 401
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        status: 401
      });
    }
    return res.status(500).json({
      error: 'Authentication error',
      status: 500
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const { pool } = require('../config/database');

    // Check if user has admin role
    const [roles] = await pool.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [req.user.id]
    );

    const hasAdminRole = roles.some(role => role.name === 'admin');

    if (!hasAdminRole) {
      return res.status(403).json({
        error: 'Admin access required',
        status: 403
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Authorization error',
      status: 500
    });
  }
};

module.exports = { authenticate, isAdmin };
