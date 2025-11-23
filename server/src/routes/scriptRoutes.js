const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');


router.get('/',scriptController.getListScripts);

// Route to add a new script
router.post('/add', scriptController.addScript);

// Route to get scripts for dashboard view
router.get('/dashboard-view', scriptController.getScriptsDashboardView);

// Route to update script status
router.post('/update-status', scriptController.updateScriptStatus);

// Route to get all script logs
router.get('/logs', scriptController.getScriptStateLogs);

// Route to log script start
router.post('/log-start', scriptController.logScriptStart);

// Route to update log status
router.post('/update-log-status', scriptController.updateLogStatus);

// Route to cleanup stale in-progress scripts
router.post('/cleanup-stale', scriptController.cleanupStaleScripts);

module.exports = router;