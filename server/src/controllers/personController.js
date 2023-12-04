// personController.js
const { ObjectID } = require('mongodb');
const PersonService = require('../services/personService');

async function addPerson(req, res) {
  const newPersonData = req.body;
  const result = await PersonService.addPerson(newPersonData);
  res.json(result);
}

async function editPerson(req, res) {
  const id = req.params.id;
  const updatedPersonData = req.body;
  const result = await PersonService.editPerson(id, updatedPersonData);
  res.json(result);
}

module.exports = { addPerson, editPerson };
