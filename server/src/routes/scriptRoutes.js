const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');


router.get('/',scriptController.getListScripts);

// Route to update script status
router.post('/update-status', scriptController.updateScriptStatus);

// Route to get all script logs
router.get('/logs', scriptController.getScriptStateLogs);

// Route to log script start
router.post('/log-start', scriptController.logScriptStart);

// Route to update log status
router.post('/update-log-status', scriptController.updateLogStatus);

module.exports = router;