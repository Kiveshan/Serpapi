// Auth controller - Placeholder for authentication-related request handlers
// This file can be used for user registration, login, and session management

const { 
  createUser, 
  loginUser, 
  getUserById, 
  getAllUsers, 
  getAllRoles, 
  getAllInstitutions,
  updateUserStatus 
} = require('../../model/auth/auth.model');
const { generateToken } = require('../../middleware/auth');

// User registration
const registerController = async (req, res) => {
  try {
    const { fullname, institutionid, institutionemail, password, roleid, certificatelink } = req.body;
    
    // Validate required fields
    if (!fullname || !institutionemail || !password) {
      return res.status(400).json({ 
        error: 'Fullname, email, and password are required' 
      });
    }
    
    // Create user
    const newUser = await createUser({
      fullname,
      institutionid: institutionid || null,
      institutionemail,
      password,
      roleid: roleid || null,
      certificatelink: certificatelink || null
    });
    
    // Generate token
    const token = generateToken(newUser);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error.message);
    
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
};

// User login
const loginController = async (req, res) => {
  try {
    const { institutionemail, password } = req.body;
    
    // Validate required fields
    if (!institutionemail || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Login user
    const user = await loginUser(institutionemail, password);
    
    // Generate token
    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      user,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user profile
const getProfileController = async (req, res) => {
  try {
    const user = await getUserById(req.user.userid);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
    
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Get all users (admin only)
const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ users });
    
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get all roles
const getAllRolesController = async (req, res) => {
  try {
    const roles = await getAllRoles();
    res.json({ roles });
    
  } catch (error) {
    console.error('Get all roles error:', error.message);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

// Get all institutions
const getAllInstitutionsController = async (req, res) => {
  try {
    const institutions = await getAllInstitutions();
    res.json({ institutions });
    
  } catch (error) {
    console.error('Get all institutions error:', error.message);
    res.status(500).json({ error: 'Failed to get institutions' });
  }
};

// Update user status (enable/disable user)
const updateUserStatusController = async (req, res) => {
  try {
    const { userid, enabled, status } = req.body;
    
    // Validate required fields
    if (!userid || enabled === undefined || !status) {
      return res.status(400).json({ 
        error: 'User ID, enabled status, and status are required' 
      });
    }
    
    const updatedUser = await updateUserStatus(userid, enabled, status);
    
    res.json({
      message: 'User status updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user status error:', error.message);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Update user profile
const updateUserController = async (req, res) => {
  try {
    const { fullname, institutionid, roleid, certificatelink } = req.body;
    const userid = req.user.userid;
    
    const updatedUser = await updateUser(userid, {
      fullname,
      institutionid,
      roleid,
      certificatelink
    });
    
    res.json({
      message: 'User profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

module.exports = {
  registerController,
  loginController,
  getProfileController,
  getAllUsersController,
  getAllRolesController,
  getAllInstitutionsController,
  updateUserStatusController,
  updateUserController
};