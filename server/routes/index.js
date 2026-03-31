const express = require('express');
const router = express.Router();

// Import route modules
const publicationsRoutes = require('./publications/publications.routes');
const authRoutes = require('./auth/auth.routes');
const systemAdminRoutes = require('./systemadmin/applications.routes');

// Mount routes
router.use('/', publicationsRoutes);
router.use('/auth', authRoutes);
router.use('/system-admin', systemAdminRoutes);

module.exports = router;