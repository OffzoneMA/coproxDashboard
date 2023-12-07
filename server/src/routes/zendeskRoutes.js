// zendeskRouter.js
const express = require('express');
const zendeskController = require('../controllers/zendeskController');

const router = express.Router();

router.get('/current-user', zendeskController.getCurrentUser);
router.get('/non-resolved-tickets/count', zendeskController.getNonResolvedTicketCount);
router.get('/organization/:ID/ticket/count', zendeskController.getNonResolvedTicketCountOrganisation);


module.exports = router;
