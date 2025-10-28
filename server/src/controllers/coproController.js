// coproController.js
const mongoose = require('mongoose');
const CoproService = require('../services/coproService');

async function listCopropriete(req, res) {
  const result = await CoproService.listCopropriete();
  res.json(result);
}

async function detailsCopropriete(req, res) {
  const { id } = req.params;
  try {
    const result = await CoproService.detailsCopropriete(id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching copropriete details:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function addCopropriete(req, res) {
  const newCoproprieteData = req.body;
  const result = await CoproService.addCopropriete(newCoproprieteData);
  res.json(result);
}

async function editCopropriete(req, res) {
  const id = req.params.id;
  const updatedCoproprieteData = req.body;
  const result = await CoproService.editCopropriete(id, updatedCoproprieteData);
  res.json(result);
}

async function countOffers(req, res) {
  const result = await CoproService.countOffers();
  res.json(result);
}

async function countCoproprieteWithoutSuiviAG(req, res) {
  const result = await CoproService.countCoproprieteWithoutSuiviAG();
  res.json(result);
}

async function getLastTemporalRecord(req, res) {
  const { id } = req.params;
  try {
    const result = await CoproService.getLastTemporalRecord(id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching copropriete details:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function addLebarocopro(req, res) {
  const coproprieteData = req.body;
  const result = await CoproService.addLebarocopro(coproprieteData);
  res.json(result);
}

module.exports = {
  listCopropriete,
  detailsCopropriete,
  addCopropriete,
  editCopropriete,
  countOffers,
  countCoproprieteWithoutSuiviAG,
  getLastTemporalRecord,
  addLebarocopro,
};
