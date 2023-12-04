// coproService.js
const { ObjectID } = require('mongodb');
const MongoDB = require('../utils/mongodb');

async function addCopro(newCoproData) {
  const coproCollection = MongoDB.getCollection('copro');
  const result = await coproCollection.insertOne(newCoproData);
  return result;
}

async function editCopro(id, updatedCoproData) {
  const coproCollection = MongoDB.getCollection('copro');
  const result = await coproCollection.updateOne({ _id: ObjectID(id) }, { $set: updatedCoproData });
  return result;
}

module.exports = { addCopro, editCopro };