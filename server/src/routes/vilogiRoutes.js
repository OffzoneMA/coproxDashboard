// src/routes/vilogihRoutes.js
const express = require('express');
const vilogiController = require('../controllers/vilogiController');

const router = express.Router();

router.post('/login', vilogiController.login);
router.get('/getCoproData/:coproID', vilogiController.getCoproData);

module.exports = router;
