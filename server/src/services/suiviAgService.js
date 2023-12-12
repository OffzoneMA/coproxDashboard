const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

const suiviAgModel = MongoDB.addSaveMiddleware('suiviAg');

function connectAndExecute(callback) {
  console.log('Connecting to MongoDB');
  return new Promise(async (resolve, reject) => {
    try {
      await MongoDB.connectToDatabase();
      const result = await callback();
      console.log('Closing MongoDB connection');
      await MongoDB.closeConnection();
      resolve(result);
    } catch (error) {
      console.error('Error connecting and executing:', error.message);
      await MongoDB.closeConnection();
      reject(error);
    }
  });
}

async function addsuiviAg(jsonData) {
  await connectAndExecute(async () => {
    for (const record of jsonData) {
      const coproprieteDocument = await MongoDB.getCollection('copropriete').findOne({ id: record.id });

      if (coproprieteDocument) {
        await suiviAgModel.create({
          idCopro: coproprieteDocument._id,
          note: parseInt(record.value),
          date: new Date(record.date),
        });
      } else {
        console.warn(`No copropriete found for id: ${record.id}`);
      }
    }

    console.log('JSON data processed successfully');
  });
}

async function getLastTemporalRecord(idCopro) {
}


module.exports = {
  addsuiviAg,
  getLastTemporalRecord,
};
