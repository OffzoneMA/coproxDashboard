const express = require('express');
const trelloController = require('../controllers/trelloController');

const router = express.Router();

router.post('/createTicket', trelloController.createTicket);
router.post('/cardsWithCheckItems', trelloController.getCardsWithIncompleteCheckItems);
router.get('/checklist-items', trelloController.getAllChecklistItems);

module.exports = router;

