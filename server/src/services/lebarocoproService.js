const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('lebarocopro');

const LebarocoproModel = MongoDB.addSaveMiddleware('lebarocopro');

async function connectAndExecute(callback) {
  try {
    logger.debug('MongoDB connect start');
    await MongoDB.connectToDatabase();
    const result = await callback();
    logger.info('MongoDB operation success');
    return result;
  } catch (error) {
    logError(error, 'Error connecting and executing');
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
        logger.warn('No copropriete found for id', { meta: { id: record.id } });
      }
    }
    logger.info('JSON data processed successfully');
  });
}

async function getLastTemporalRecord(idCopro) {
  return connectAndExecute(async () => {
    const lebarocoproCollection = mongoose.connection.collection('lebarocopro');
    const objectIdCopro = new mongoose.Types.ObjectId(idCopro);
    
    try {
      const cursor = lebarocoproCollection.aggregate([
        {
          $match: {
            idCopro: objectIdCopro,
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
      ]);

      const resultArray = await cursor.toArray();

      if (resultArray.length > 0) {
        logger.info('Last temporal record', { meta: { idCopro, note: resultArray[0].note } });
        return resultArray[0].note;
      } else {
        logger.info('No temporal records found for idCopro', { meta: { idCopro } });
        return null;
      }
    } catch (error) {
      logError(error, 'Error getting last temporal record', { idCopro });
      throw error;
    }
  });
}

module.exports = {
  addLebarocopro,
  getLastTemporalRecord,
};