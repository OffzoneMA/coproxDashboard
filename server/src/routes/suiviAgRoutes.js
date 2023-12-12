// suiviAgRoutes.js
const express = require('express');
const suiviAgModule = require('../controllers/suiviAgController');

const router = express.Router();

router.get('/suiviAg/:id', suiviAgModule.getLastTemporalRecord);
router.post('/addsuiviAg', suiviAgModule.addsuiviAg);

module.exports = router;
