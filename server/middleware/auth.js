const jwt = require('jsonwebtoken');
const { pool } = require('../db/db');

// JWT Secret key (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token and authenticate user
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists in database
    const userQuery = `
      SELECT u.userid, u.fullname, u.institutionemail, u.roleid, r.rolename, i.institution
      FROM user_table u
      LEFT JOIN roles r ON u.roleid = r.roleid
      LEFT JOIN institution i ON u.institutionid = i.instid
      WHERE u.userid = $1 AND u.institutionemail = $2
    `;
    
    const userResult = await pool.query(userQuery, [decoded.userid, decoded.email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    // Attach user info to request object
    req.user = userResult.rows[0];
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.' 
      });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({ 
        error: 'Authentication failed.' 
      });
    }
  }
};

// Middleware to check if user has specific role
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    const userRole = req.user.rolename;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Middleware to check if user is System Admin
const requireSystemAdmin = requireRole(['System Admin']);

// Middleware to check if user is Research Admin
const requireResearchAdmin = requireRole(['Research Admin']);

// Middleware to check if user is either System Admin or Research Admin
const requireAnyAdmin = requireRole(['System Admin', 'Research Admin']);

// Middleware to check if user is authenticated (any role)
const requireAuthentication = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required.' 
    });
  }
  next();
};

// Helper function to generate JWT token
const generateToken = (user) => {
  const payload = {
    userid: user.userid,
    email: user.institutionemail,
    rolename: user.rolename
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Helper function to verify password
const verifyPassword = async (plainPassword, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Helper function to hash password
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Middleware to optionally authenticate (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userQuery = `
      SELECT u.userid, u.fullname, u.institutionemail, u.roleid, r.rolename, i.institution
      FROM user_table u
      LEFT JOIN roles r ON u.roleid = r.roleid
      LEFT JOIN institution i ON u.institutionid = i.instid
      WHERE u.userid = $1 AND u.institutionemail = $2
    `;
    
    const userResult = await pool.query(userQuery, [decoded.userid, decoded.email]);
    
    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    } else {
      req.user = null;
    }
    
    next();
    
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSystemAdmin,
  requireResearchAdmin,
  requireAnyAdmin,
  requireAuthentication,
  optionalAuth,
  generateToken,
  verifyPassword,
  hashPassword,
  JWT_SECRET
};