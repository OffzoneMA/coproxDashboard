// personService.js
const { ObjectID } = require('mongodb');
const MongoDB = require('../utils/mongodb');

async function addPerson(newPersonData) {
  const personCollection = MongoDB.getCollection('person');
  const result = await personCollection.insertOne(newPersonData);
  return result;
}

async function editPerson(id, updatedPersonData) {
  const personCollection = MongoDB.getCollection('person');
  const result = await personCollection.updateOne({ _id: ObjectID(id) }, { $set: updatedPersonData });
  return result;
}

module.exports = { addPerson, editPerson };