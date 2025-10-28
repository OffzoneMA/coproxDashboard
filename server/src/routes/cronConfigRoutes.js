const express = require('express');
const CronConfigController = require('../controllers/cronConfigController');

const router = express.Router();

// Basic CRUD operations
router.get('/', CronConfigController.getAllConfigs);
router.get('/enabled', CronConfigController.getEnabledConfigs);
router.get('/stats', CronConfigController.getStats);
router.get('/due', CronConfigController.getDueConfigs);
router.get('/high-error-rate', CronConfigController.getHighErrorRateConfigs);
router.get('/category/:category', CronConfigController.getConfigsByCategory);
router.get('/:name', CronConfigController.getConfigByName);

router.post('/', CronConfigController.createConfig);
router.post('/validate-expression', CronConfigController.validateCronExpression);
router.post('/bulk-update', CronConfigController.bulkUpdate);
router.post('/seed', CronConfigController.seedConfigs);
router.post('/reload', CronConfigController.reloadCronJobs);
router.post('/seed', CronConfigController.seedConfigs);
router.post('/reload', CronConfigController.reloadCronJobs);

router.put('/:name', CronConfigController.updateConfig);
router.put('/:name/enabled', CronConfigController.setEnabled);
router.put('/:name/reset-errors', CronConfigController.resetErrorCount);
router.put('/:name/run-stats', CronConfigController.updateRunStats);

router.delete('/:name', CronConfigController.deleteConfig);

// Script management within cron configurations
router.post('/:name/scripts', CronConfigController.addScript);
router.put('/:name/scripts/:scriptName', CronConfigController.updateScript);
router.delete('/:name/scripts/:scriptName', CronConfigController.removeScript);

module.exports = router;