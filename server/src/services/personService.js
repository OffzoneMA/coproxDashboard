const MongoDB = require('../utils/mongodb');

async function connectAndExecute(callback) {
  try {
    console.log('Connecting to MongoDB');
    await MongoDB.connectToDatabase();
    return await callback();
  } catch (error) {
    handleMongoError('MongoDB error:', error);
  } finally {
    console.log('Closing MongoDB connection');
    MongoDB.closeConnection();
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
    const result = await personCollection.updateOne({ _id: ObjectID(id) }, { $set: updatedPersonData });
    return result;
  });
}

async function getPersonsByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const persons = await personCollection.find({ idCopro: ObjectID(idCopro) }).toArray();
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

// Add your new functions here

module.exports = {
  addPerson,
  editPerson,
  getPersonsByCoproId,
  getAllPersons,
  // Add your new functions here
};
