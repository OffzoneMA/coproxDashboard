const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

const LebarocoproModel = MongoDB.addSaveMiddleware('lebarocopro');

async function connectAndExecute(callback) {
  try {
    console.log('Connecting to MongoDB');
    await MongoDB.connectToDatabase();
    return await callback();
  } finally {
    console.log('Closing MongoDB connection');
    await MongoDB.closeConnection();
  }
}

async function addLebarocopro(jsonData) {
  await connectAndExecute(async () => {
    for (const record of jsonData) {
      const coproprieteDocument = await MongoDB.getCollection('copropriete').findOne({ id: record.id });

      if (coproprieteDocument) {
        await LebarocoproModel.create({
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
    return connectAndExecute(async () => {
      const lebarocoproCollection = MongoDB.getCollection('lebarocopro');
      const objectIdCopro = new mongoose.Types.ObjectId(idCopro);
  
      try {
        const result = await lebarocoproCollection.aggregate([
          {
            $match: {
              _id: objectIdCopro,
            },
          },
          {
            $sort: {
              date: -1,
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: 0,
              note: 1,
            },
          },
        ]).toArray();
  
        if (result.length > 0) {
          console.log('Last temporal record:', result[0]);
          return result[0].note;
        } else {
          console.log('No temporal records found for idCopro:', idCopro);
          return null;
        }
      } catch (error) {
        console.error('Error getting last temporal record:', error.message);
        throw error;
      }
    });
  }

module.exports = {
  addLebarocopro,
  getLastTemporalRecord,
};
