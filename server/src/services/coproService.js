const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('copro');

// Generic executor with DB connection
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

// List active copro
async function listCopropriete() {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    // Check both isActive boolean and status string for backward compatibility
    const results = await coproprieteCollection.find({ 
      $or: [
        { isActive: { $ne: false } },
        { status: { $ne: 'Inactif' } }
      ]
    }).toArray();
    logger.info('listCopropriete', { meta: { count: results.length } });
    return results;
  });
}

// List inactive copro
async function listCoproprieteInactive() {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    // Check both isActive boolean and status string for backward compatibility
    const results = await coproprieteCollection.find({ 
      $or: [
        { isActive: false },
        { status: 'Inactif' }
      ]
    }).toArray();
    logger.info('listCoproprieteInactive', { meta: { count: results.length } });
    return results;
  });
}

// Find copro by Monday.com ID
async function getCoprobyMondayId(mondayId) {
  const mondayIdStr = String(mondayId); // ✅ force string
  logger.info('Fetching copro by Monday ID', { meta: { mondayId: mondayIdStr } });

  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    try {
      const copro = await coproprieteCollection.findOne({ idMonday: mondayIdStr });
      if (!copro) {
        logger.warn('No copro found for Monday ID', { meta: { mondayId: mondayIdStr } });
      } else {
        logger.info('Copro found for Monday ID', { meta: { mondayId: mondayIdStr } });
      }
      return copro.idVilogi || null;
    } catch (error) {
      logError(error, 'Error fetching copro by Monday ID', { mondayId: mondayIdStr });
      throw error;
    }
  });
}

// Details by MongoDB _id
async function detailsCopropriete(id) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    const result = await coproprieteCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    logger.info('detailsCopropriete', { meta: { id, found: !!result } });
    return result;
  });
}

// Details by Vilogi id
async function detailsCoproprieteByidVilogi(id) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    const result = await coproprieteCollection.findOne({ idVilogi: id });
    logger.info('detailsCoproprieteByidVilogi', { meta: { id, found: !!result } });
    return result;
  });
}

// Details by Copro id
async function detailsCoproprieteByidCopro(id) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    const result = await coproprieteCollection.findOne({ idCopro: id });
    logger.info('detailsCoproprieteByidCopro', { meta: { id, found: !!result } });
    return result;
  });
}

// Add new copro
async function addCopropriete(newCoproprieteData) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    const result = await coproprieteCollection.insertOne(newCoproprieteData);
    logger.info('Added copro', { meta: { insertedId: String(result.insertedId) } });
    return result;
  });
}

// Edit existing copro
async function editCopropriete(id, updatedCoproprieteData) {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    const result = await coproprieteCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updatedCoproprieteData },
      { returnDocument: 'after' } // ✅ correct for Mongo driver >=4
    );
    logger.info('Edited copro', { meta: { id, found: !!result.value } });
    return result.value;
  });
}

// Count grouped by offers
async function countOffers() {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    const results = await coproprieteCollection.aggregate([
      { $group: { _id: '$Offre', count: { $sum: 1 } } },
      { $project: { _id: 0, Offre: '$_id', count: 1 } },
    ]).toArray();
    logger.info('countOffers', { meta: { results } });
    return results;
  });
}

// Count copro without suiviAG
async function countCoproprieteWithoutSuiviAG() {
  return connectAndExecute(async () => {
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    try {
      const result = await coproprieteCollection.aggregate([
        {
          $lookup: {
            from: 'suiviAG',
            localField: '_id',
            foreignField: 'idCopro',
            as: 'suiviAG',
          },
        },
        { $match: { suiviAG: { $size: 0 } } },
        { $count: 'count' },
      ]).toArray();

      const count = result.length > 0 ? result[0].count : 0;
      logger.info('Count copro without suiviAG', { meta: { count } });
      return count;
    } catch (error) {
      logError(error, 'Error counting copro without suiviAG');
      throw error;
    }
  });
}

module.exports = {
  listCopropriete,
  listCoproprieteInactive,
  getCoprobyMondayId,
  detailsCopropriete,
  detailsCoproprieteByidVilogi,
  detailsCoproprieteByidCopro,
  addCopropriete,
  editCopropriete,
  countOffers,
  countCoproprieteWithoutSuiviAG,
};