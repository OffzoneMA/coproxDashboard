// src/controllers/trelloController.js
const axios = require('axios');
const trelloService = require('../services/trelloService');

exports.createTicket = async (req, res) => {
  const { cardName } = req.body;

  try {
    const result = await trelloService.createTicket(cardName);
    res.status(200).send(result);
  } catch (error) {
    console.error('Error creating Trello ticket:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getCardsWithIncompleteCheckItems = async (req, res) => {
  const { checkItemNames } = req.body;

  try {
    const cards = await trelloService.getCardsWithIncompleteCheckItems(checkItemNames);
    res.json(cards);
  } catch (error) {
    console.error('Error fetching Trello data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getAllChecklistItems = async (req, res) => {
  try {
    const allChecklistItems = await trelloService.getAllChecklistItems();
    res.json(allChecklistItems);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
