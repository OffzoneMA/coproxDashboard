// src/controllers/vilogiController.js
const vilogiService = require('../services/vilogiService');

const login = async (req, res) => {
  try {
    const result = await vilogiService.authenticateUser(req.body.login,req.body.pass);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCoproData = async (req, res) => {
  try {
    const coproID = req.params.coproID; 
    const coproData = await vilogiService.getCoproData(coproID);
    console.log('Copro Data:', coproData);
    res.json(coproData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const getAllAdherents = async (req, res) => {
  try {
    const coproID = req.params.coproID; 
    const allAdherents = await vilogiService.getAllAdherents(coproID);
    console.log('All Adherents:', allAdherents);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = {
  login,
  getAllAdherents,
  getCoproData
};
