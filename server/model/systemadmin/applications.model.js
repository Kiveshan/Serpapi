const { pool } = require('../../db/db');

// Get all user applications with role information
const getAllApplications = async () => {
  try {
    const query = `
      SELECT u.userid, u.fullname, u.institutionemail, u.roleid, r.rolename, 
             u.status, u.enabled, u.dateentered, u.certificatelink, u.otherinstitution,
             i.institution
      FROM user_table u
      LEFT JOIN roles r ON u.roleid = r.roleid
      LEFT JOIN institution i ON u.institutionid = i.instid
      WHERE u.roleid != 1
      ORDER BY u.dateentered DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
};

// Get pending applications count
const getPendingApplicationsCount = async () => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM user_table u
      WHERE u.roleid != 1 AND u.status = 'pending'
    `;
    
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error fetching pending count:', error);
    throw error;
  }
};

// Get applications by status
const getApplicationsByStatus = async (status) => {
  try {
    const query = `
      SELECT u.userid, u.fullname, u.institutionemail, u.roleid, r.rolename, 
             u.status, u.enabled, u.dateentered, u.certificatelink, u.otherinstitution,
             i.institution
      FROM user_table u
      LEFT JOIN roles r ON u.roleid = r.roleid
      LEFT JOIN institution i ON u.institutionid = i.instid
      WHERE u.roleid != 1 AND u.status = $1
      ORDER BY u.dateentered DESC
    `;
    
    const result = await pool.query(query, [status]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching applications by status:', error);
    throw error;
  }
};

// Update user status
const updateApplicationStatus = async (userid, status, enabled) => {
  try {
    const query = `
      UPDATE user_table 
      SET status = $1, enabled = $2
      WHERE userid = $3
      RETURNING userid, fullname, institutionemail, status, enabled
    `;
    
    const result = await pool.query(query, [status, enabled, userid]);
    
    if (result.rows.length === 0) {
      throw new Error('Application not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Get application details by ID
const getApplicationById = async (userid) => {
  try {
    const query = `
      SELECT u.userid, u.fullname, u.institutionemail, u.roleid, r.rolename, 
             u.status, u.enabled, u.dateentered, u.certificatelink, u.otherinstitution,
             i.institution, i.region, i.country
      FROM user_table u
      LEFT JOIN roles r ON u.roleid = r.roleid
      LEFT JOIN institution i ON u.institutionid = i.instid
      WHERE u.userid = $1 AND u.roleid != 1
    `;
    
    const result = await pool.query(query, [userid]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching application details:', error);
    throw error;
  }
};

module.exports = {
  getAllApplications,
  getPendingApplicationsCount,
  getApplicationsByStatus,
  updateApplicationStatus,
  getApplicationById
};