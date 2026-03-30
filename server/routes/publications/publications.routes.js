const express = require('express');
const router = express.Router();
const { 
  searchPublicationsController, 
  advancedSearchController, 
  healthCheckController 
} = require('../../controller/publications/publications.controller');
const { 
  authenticateToken, 
  requireAnyAdmin, 
  optionalAuth 
} = require('../../middleware/auth');

// Public routes (no authentication required)
router.get('/search/:query', searchPublicationsController);
router.get('/advanced-search', advancedSearchController);
router.get('/health', healthCheckController);

// Example of protected routes (you can uncomment these when needed)
// router.get('/saved-searches', authenticateToken, requireAuthentication, getSavedSearchesController);
// router.post('/save-search', authenticateToken, requireAuthentication, saveSearchController);
// router.delete('/saved-searches/:id', authenticateToken, requireAuthentication, deleteSearchController);

// Example of admin-only routes (you can uncomment these when needed)
// router.get('/admin/search-analytics', authenticateToken, requireAnyAdmin, getSearchAnalyticsController);

module.exports = router;
