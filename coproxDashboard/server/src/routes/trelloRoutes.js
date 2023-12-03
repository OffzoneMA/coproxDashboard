const express = require('express');
const trelloController = require('../controllers/trelloController');

const router = express.Router();

router.post('/createTicket', trelloController.createTicket);
router.get('/cardsWithCheckItems', trelloController.getCardsWithCheckItems);

module.exports = router;