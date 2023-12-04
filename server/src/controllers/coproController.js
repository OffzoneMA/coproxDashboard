// coproController.js
const { ObjectID } = require('mongodb');
const CoproService = require('../services/coproService');

async function addCopro(req, res) {
  const newCoproData = req.body;
  const result = await CoproService.addCopro(newCoproData);
  res.json(result);
}

async function editCopro(req, res) {
  const id = req.params.id;
  const updatedCoproData = req.body;
  const result = await CoproService.editCopro(id, updatedCoproData);
  res.json(result);
}

module.exports = { addCopro, editCopro };
