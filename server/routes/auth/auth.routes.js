// Auth routes - Placeholder for authentication-related endpoints
const express = require('express');
const router = express.Router();
const { 
  registerController, 
  loginController, 
  getProfileController, 
  getAllUsersController,
  getAllRolesController,
  getAllInstitutionsController,
  updateUserStatusController,
  updateUserController
} = require('../../controller/auth/auth.controller');
const { 
  authenticateToken, 
  requireAnyAdmin, 
  requireAuthentication 
} = require('../../middleware/auth');
const { uploadCertificate } = require('../../middleware/upload.middleware');

// Public routes (no authentication required)
router.post('/register', uploadCertificate, registerController);
router.post('/login', loginController);
router.get('/institutions', getAllInstitutionsController);
router.get('/roles', getAllRolesController);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, getProfileController);
router.put('/profile', authenticateToken, updateUserController);

// Admin-only routes
router.get('/users', authenticateToken, requireAnyAdmin, getAllUsersController);
router.put('/users/:userid/status', authenticateToken, requireAnyAdmin, updateUserStatusController);

module.exports = router;