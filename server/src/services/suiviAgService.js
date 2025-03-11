const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

const suiviAgModel = MongoDB.addSaveMiddleware('suiviAg');

async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    return await callback();
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}

async function addsuiviAg(jsonData) {
  return connectAndExecute(async () => {
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
  return connectAndExecute(async () => {
    const suiviAgCollection = MongoDB.getCollection('suiviAg');
    const objectIdCopro = new mongoose.Types.ObjectId(idCopro);

    try {
      const result = await suiviAgCollection
        .find({ idCopro: objectIdCopro })
        .sort({ date: -1 })
        .limit(1)
        .toArray();

      if (result.length > 0) {
        console.log('Last temporal record:', result[0]);
        return result[0];
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
  addsuiviAg,
  getLastTemporalRecord,
};