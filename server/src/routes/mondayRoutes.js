// routes/mondayRoutes.js

const express = require('express');
const router = express.Router();
const mondayController = require('../controllers/mondayController');

// Define routes
router.get('/boards/:boardId/items', mondayController.getItems);
router.post('/boards/:boardId/items', mondayController.createItem);
router.post('/items/:parentItemId/subitems', mondayController.createSubitem);

module.exports = router;