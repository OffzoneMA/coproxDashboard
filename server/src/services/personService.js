const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const vilogiService = require('./vilogiService');

async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    const result = await callback();
    return result;
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  } 
}

function handleMongoError(message, error) {
  console.error(message, error.message);
  throw error;
}

async function addPerson(newPersonData) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const result = await personCollection.insertOne(newPersonData);
    return result;
  });
}

async function editPerson(id, updatedPersonData) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const result = await personCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) }, 
      { $set: updatedPersonData }
    );
    return result;
  });
}

async function getPerson(id) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const person = await personCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (person) {
      const [proprietaireInfo, proprietaireLots, proprietaireComptes, proprietaireDocuments] = await Promise.all([
        vilogiService.getProprietaireInfo(id),
        vilogiService.getProprietaireLots(id),
        vilogiService.getProprietaireComptes(id),
        vilogiService.getProprietaireDocuments(id)
      ]);

      return {
        ...person,
        proprietaireInfo,
        proprietaireLots,
        proprietaireComptes,
        proprietaireDocuments
      };
    }

    return person;
  });
}

async function getPersonsByInfo(infoName, infoValue) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const query = { [infoName]: infoValue };
    const persons = await personCollection.find(query).toArray();
    return persons;
  });
}

async function getPersonsById(idPerson) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const persons = await personCollection.find({ _id: new mongoose.Types.ObjectId(idPerson) }).toArray();
    return persons;
  });
}

async function getPersonsByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const persons = await personCollection.find({ idCopro: new mongoose.Types.ObjectId(idCopro) }).toArray();
    return persons;
  });
}

async function getAllPersons() {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const persons = await personCollection.find({}).toArray();
    return persons;
  });
}

async function getAllPersonsWithCoppro() {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const persons = await personCollection.find({}).toArray();
    return persons;
  });
}

async function countAllPersons() {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const count = await personCollection.countDocuments({});
    return count;
  });
}

module.exports = {
  addPerson,
  editPerson,
  getPerson,
  getPersonsByInfo,
  getPersonsById,
  getPersonsByCoproId,
  getAllPersons,
  countAllPersons,
  getAllPersonsWithCoppro,
};