const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

const LebarocoproModel = MongoDB.addSaveMiddleware('lebarocopro');

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
    const lebarocoproCollection = mongoose.connection.collection('lebarocopro');
    const objectIdCopro = new mongoose.Types.ObjectId(idCopro);
    console.log(lebarocoproCollection);
    try {
      const cursor = lebarocoproCollection.aggregate([
        {
          $match: {
            idCopro: objectIdCopro, // Match documents where idCopro is equal to objectIdCopro
          },
        },
        {
          $sort: {
            date: -1, // Sort by date in descending order
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
      ]);

      const resultArray = await cursor.toArray();
      await cursor.close();

      if (resultArray.length > 0) {
        console.log('Last temporal record:', resultArray[0]);
        return resultArray[0].note;
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
