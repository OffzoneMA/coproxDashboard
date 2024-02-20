const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

function connectAndExecute(callback) {
  //console.log('Connecting to MongoDB');
  return new Promise(async (resolve, reject) => {
    try {
      await MongoDB.connectToDatabase();
      const result = await callback();
      //console.log('Closing MongoDB connection');
      await MongoDB.closeConnection();
      resolve(result);
    } catch (error) {
      console.error('Error connecting and executing:', error.message);
      await MongoDB.closeConnection();
      reject(error);
    }
  });
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
    const result = await personCollection.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updatedPersonData });
    return result;
  });
}


async function getPersonsByInfo(infoName,infoValue) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const query = {[infoName]: infoValue };
    const persons = await personCollection.find(query).toArray();
    return persons;
  });
}

async function getPersonsByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const persons = await personCollection.find({ idCopro: mongoose.Types.ObjectId(idCopro) }).toArray();
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

async function countAllPersons() {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const count = await personCollection.countDocuments({});
    return count;
  });
}

// Add your new functions here

module.exports = {
  addPerson,
  editPerson,
  getPersonsByInfo,
  getPersonsByCoproId,
  getAllPersons,
  countAllPersons
  // Add your new functions here
};
