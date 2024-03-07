const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

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
    const suiviFichenCollection = MongoDB.getCollection('person');
    const result = await suiviFichenCollection.insertOne(newPersonData);
    return result;
  });
}

async function editPerson(id, updatedPersonData) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const result = await suiviFichenCollection.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updatedPersonData });
    return result;
  });
}


async function getinfo(id,infoValue) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const query = {[infoName]: infoValue };
    const persons = await suiviFichenCollection.find(query).toArray();
    return persons;
  });
}
async function getPersonsByInfo(infoName,infoValue) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const query = {[infoName]: infoValue };
    const persons = await suiviFichenCollection.find(query).toArray();
    return persons;
  });
}

async function getPersonsByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const persons = await suiviFichenCollection.find({ idCopro: mongoose.Types.ObjectId(idCopro) }).toArray();
    return persons;
  });
}

async function getAllPersons() {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const persons = await suiviFichenCollection.find({}).toArray();
    return persons;
  });
}

async function countAllPersons() {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const count = await suiviFichenCollection.countDocuments({});
    return count;
  });
}

// Add your new functions here

module.exports = {
  addPerson,
  editPerson,
  getinfo,
  getPersonsByInfo,
  getPersonsByCoproId,
  getAllPersons,
  countAllPersons
  // Add your new functions here
};
