// Auth model - Placeholder for authentication-related database operations
// This file can be used for user registration, login, and session management

// Example functions (to be implemented when auth is needed):
// const createUser = async (userData) => { ... };
// const findUserByEmail = async (email) => { ... };

const { pool } = require('../../db/db');
const { hashPassword, verifyPassword } = require('../../middleware/auth');

// User registration
const createUser = async (userData) => {
  const { fullname, institutionid, institutionemail, password, roleid, certificatelink, otherinstitution } = userData;
  
  try {
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    const query = `
      INSERT INTO user_table (fullname, institutionid, institutionemail, password, roleid, certificatelink, otherinstitution, enabled, status, dateentered)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, 'pending', CURRENT_DATE)
      RETURNING userid, fullname, institutionemail, roleid, certificatelink, otherinstitution, enabled, status, dateentered
    `;
    
    const values = [fullname, institutionid || null, institutionemail, hashedPassword, roleid || null, certificatelink || null, otherinstitution || null];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// User login
const loginUser = async (institutionemail, password) => {
  try {
    const query = `
      SELECT u.userid, u.fullname, u.institutionemail, u.password, u.roleid, r.rolename, i.institution, u.certificatelink, u.otherinstitution, u.enabled, u.status, u.dateentered
      FROM user_table u
      LEFT JOIN roles r ON u.roleid = r.roleid
      LEFT JOIN institution i ON u.institutionid = i.instid
      WHERE u.institutionemail = $1
    `;
    
    const result = await pool.query(query, [institutionemail]);
    
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = result.rows[0];
    
    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Check authentication rules based on user role
    if (user.roleid === 1) {
      // System Admin - only needs to be enabled
      if (!user.enabled) {
        throw new Error('Account is disabled');
      }
    } else {
      // Normal User - must be both approved AND enabled
      if (!user.enabled) {
        throw new Error('Account is disabled');
      }
      
      if (user.status !== 'approved') {
        throw new Error('Account is not approved. Please wait for admin approval.');
      }
    }
    
    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

// Get user by ID
const getUserById = async (userid) => {
  try {
    const query = `
      SELECT u.userid, u.fullname, u.institutionemail, u.roleid, r.rolename, i.institution, u.certificatelink, u.otherinstitution, u.enabled, u.status, u.dateentered
      FROM user_table u
      LEFT JOIN roles r ON u.roleid = r.roleid
      LEFT JOIN institution i ON u.institutionid = i.instid
      WHERE u.userid = $1
    `;
    
    const result = await pool.query(query, [userid]);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

// Get all users (admin only)
const getAllUsers = async () => {
  try {
    const query = `
      SELECT u.userid, u.fullname, u.institutionemail, r.rolename, i.institution, u.certificatelink, u.otherinstitution, u.enabled, u.status, u.dateentered
      FROM user_table u
      LEFT JOIN roles r ON u.roleid = r.roleid
      LEFT JOIN institution i ON u.institutionid = i.instid
      ORDER BY u.fullname
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Update user
const updateUser = async (userid, userData) => {
  const { fullname, institutionid, roleid, certificatelink, enabled, status } = userData;
  
  try {
    const query = `
      UPDATE user_table 
      SET fullname = $1, institutionid = $2, roleid = $3, certificatelink = $4, enabled = $5, status = $6
      WHERE userid = $7
      RETURNING userid, fullname, institutionemail, roleid, certificatelink, enabled, status, dateentered
    `;
    
    const values = [fullname, institutionid, roleid, certificatelink, enabled, status, userid];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Enable/disable user
const updateUserStatus = async (userid, enabled, status) => {
  try {
    const query = `
      UPDATE user_table 
      SET enabled = $1, status = $2
      WHERE userid = $3
      RETURNING userid, fullname, institutionemail, enabled, status
    `;
    
    const values = [enabled, status, userid];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Delete user
const deleteUser = async (userid) => {
  try {
    const query = 'DELETE FROM user_table WHERE userid = $1 RETURNING userid';
    const result = await pool.query(query, [userid]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get all roles
const getAllRoles = async () => {
  try {
    const query = 'SELECT roleid, rolename FROM roles ORDER BY rolename';
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Get all institutions
const getAllInstitutions = async () => {
  try {
    const query = 'SELECT instid, institution, region, country FROM institution ORDER BY institution';
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser,
  loginUser,
  getUserById,
  getAllUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAllRoles,
  getAllInstitutions
};