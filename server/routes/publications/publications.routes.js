const express = require('express');
const router = express.Router();
const { 
  searchPublicationsController, 
  advancedSearchController, 
  healthCheckController 
} = require('../../controller/publications/publications.controller');

// Search publications by query
// GET /api/search/:query
router.get('/search/:query', searchPublicationsController);

// Advanced search with query parameters
// GET /api/advanced-search?q=...&author=...&title=...&year=...
router.get('/advanced-search', advancedSearchController);

// Health check endpoint
// GET /api/health
router.get('/health', healthCheckController);

module.exports = router;
