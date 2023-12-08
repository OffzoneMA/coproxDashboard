// src/controllers/vilogiController.js
const vilogiService = require('../services/vilogiService');

const login = async (req, res) => {
  try {
    const result = await vilogiService.authenticateUser();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  login,
};
