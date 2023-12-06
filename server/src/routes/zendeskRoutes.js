// zendeskRouter.js
const express = require('express');
const zendeskController = require('../controllers/zendeskController');

const router = express.Router();

router.get('/current-user', zendeskController.getCurrentUser);
router.get('/non-resolved-tickets/count', zendeskController.getNonResolvedTicketCount);

module.exports = router;
