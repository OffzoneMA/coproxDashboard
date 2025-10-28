// coproController.js
const mongoose = require('mongoose');
const CoproService = require('../services/suiviAgService');

async function getLastTemporalRecord(req, res) {
  const { id } = req.params;
  try {
    const result = await CoproService.getLastTemporalRecord(id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching suiviAg details:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function addsuiviAg(req, res) {
  const coproprieteData = req.body;
  try {
    const result = await CoproService.addsuiviAg(coproprieteData);
    res.json(result);
  } catch (error) {
    console.error('Error adding suiviAg:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getLastTemporalRecord,
  addsuiviAg,
};
