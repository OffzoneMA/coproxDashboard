const express = require('express');
const trelloController = require('../controllers/trelloController');

const router = express.Router();

router.post('/createTicket', trelloController.createTicket);
router.post('/cardsWithCheckItems', trelloController.getCardsWithIncompleteCheckItems);
router.get('/checklist-items', trelloController.getAllChecklistItems);
router.get('/getAgSteps', trelloController.getAgSteps);
router.get('/getInfoAg/:id', trelloController.getInfoAg);


module.exports = router;

