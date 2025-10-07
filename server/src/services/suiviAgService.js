const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('suiviAg');

const suiviAgModel = MongoDB.addSaveMiddleware('suiviAg');

async function connectAndExecute(callback) {
  try {
    logger.debug('MongoDB connect start');
    await MongoDB.connectToDatabase();
    const res = await callback();
    logger.info('MongoDB operation success');
    return res;
  } catch (error) {
    logError(error, 'Error connecting and executing');
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
        logger.warn('No copropriete found for id', { meta: { id: record.id } });
      }
    }
    logger.info('JSON data processed successfully');
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
        logger.info('Last temporal record', { meta: { idCopro, note: result[0].note } });
        return result[0];
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
  addsuiviAg,
  getLastTemporalRecord,
};