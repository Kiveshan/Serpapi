const express = require('express');
const router = express.Router();
const {
  getAllApplicationsController,
  getPendingApplicationsController,
  getApplicationByIdController,
  updateApplicationStatusController,
  getApplicationsByStatusController,
  getDocumentUrlController
} = require('../../controller/systemadmin/applications.controller');
const { 
  authenticateToken, 
  requireAnyAdmin 
} = require('../../middleware/auth');

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAnyAdmin);

// Get all applications with pending count
router.get('/', getAllApplicationsController);

// Get pending applications only
router.get('/pending', getPendingApplicationsController);

// Get applications by status
router.get('/status/:status', getApplicationsByStatusController);

// Get application details by ID
router.get('/:userid', getApplicationByIdController);

// Get signed URL for document download
router.get('/:userid/document', getDocumentUrlController);

// Update application status
router.put('/:userid/status', updateApplicationStatusController);

module.exports = router;