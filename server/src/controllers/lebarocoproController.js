// coproController.js
const mongoose = require('mongoose');
const CoproService = require('../services/lebarocoproService');

async function getLastTemporalRecord(req, res) {
  const { id } = req.params;
  try {
    const result = await CoproService.getLastTemporalRecord(id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching lebarocopro details:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function addLebarocopro(req, res) {
  const coproprieteData = req.body;
  try {
    const result = await CoproService.addLebarocopro(coproprieteData);
    res.json(result);
  } catch (error) {
    console.error('Error adding lebarocopro:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getLastTemporalRecord,
  addLebarocopro,
};
