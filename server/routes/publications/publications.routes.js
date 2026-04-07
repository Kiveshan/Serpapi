const express = require('express');
const router = express.Router();
const { 
  searchPublicationsController, 
  advancedSearchController, 
  healthCheckController 
} = require('../../controller/publications/publications.controller');

router.get('/search/:query', searchPublicationsController);
router.get('/advanced-search', advancedSearchController);
router.get('/health', healthCheckController);

module.exports = router;
