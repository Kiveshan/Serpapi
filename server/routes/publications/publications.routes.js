const express = require('express');
const router = express.Router();
const { 
  searchPublicationsController, 
  advancedSearchController, 
  healthCheckController,
  exportPublicationsController
} = require('../../controller/publications/publications.controller');
const { 
  checkDhetAccreditationController 
} = require('../../controller/publications/dhet.controller');

router.get('/search/:query', searchPublicationsController);
router.get('/advanced-search', advancedSearchController);
router.get('/health', healthCheckController);
router.get('/dhet/check-accreditation', checkDhetAccreditationController);
router.post('/export', exportPublicationsController);

module.exports = router;
