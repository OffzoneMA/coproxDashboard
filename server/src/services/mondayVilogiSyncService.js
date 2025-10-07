const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const { createServiceLogger, redact } = require('./logger');
const { logger, logError } = createServiceLogger('mondayVilogiSync');

// Optional helper for quick printf-style info logs (like mondayService)
function logExecution(...args) {
  logger.info(args.join(' '));
}

async function connectAndExecute(callback) {
  const startedAt = Date.now();
  try {
    logger.debug('MongoDB connect start');
    await MongoDB.connectToDatabase();
    const result = await callback();
    logger.info('MongoDB operation success', { meta: { duration_ms: Date.now() - startedAt } });
    return result;
  } catch (error) {
    logError(error, 'Error connecting and executing', { duration_ms: Date.now() - startedAt });
    throw error;
  }
}
function handleMongoError(message, error, meta = {}) {
  logError(error, message, meta);
  throw error;
}

async function addItem(newItemData) {
  return connectAndExecute(async () => {
    const ItemCollection = MongoDB.getCollection('mondayVilogi');
    const startedAt = Date.now();
    logger.info('Adding item', { meta: { collection: 'mondayVilogi', fields: Object.keys(newItemData || {}) } });
    const result = await ItemCollection.insertOne(newItemData);
    logger.info('Item added', { meta: { insertedId: result?.insertedId?.toString?.(), duration_ms: Date.now() - startedAt } });
    return result;
  });
}

async function editItem(id, updatedItemData) {
  return connectAndExecute(async () => {
    const ItemCollection = MongoDB.getCollection('mondayVilogi');
    const startedAt = Date.now();
    logger.info('Editing item', { meta: { collection: 'mondayVilogi', id } });
    const result = await ItemCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) }, 
      { $set: updatedItemData }
    );
    logger.info('Item edited', { meta: { id, matchedCount: result?.matchedCount, modifiedCount: result?.modifiedCount, duration_ms: Date.now() - startedAt } });
    return result;
  });
}

async function getItemsByInfo(boardID, vilogiItemID) {
  return connectAndExecute(async () => {
    const ItemCollection = MongoDB.getCollection('mondayVilogi');
    const query = { vilogiItemID: vilogiItemID, boardID: boardID };
    const startedAt = Date.now();
    logger.info('Query items by info', { meta: { collection: 'mondayVilogi', boardID, vilogiItemID } });
    const Items = await ItemCollection.find(query).toArray();
    logger.info('Items fetched by info', { meta: { count: Items?.length || 0, duration_ms: Date.now() - startedAt } });
    return Items;
  });
}

async function getItemsByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const ItemCollection = MongoDB.getCollection('mondayVilogi');
    const startedAt = Date.now();
    logger.info('Query items by copro ID', { meta: { collection: 'mondayVilogi', idCopro } });
    const Items = await ItemCollection.find({ idCopro: new mongoose.Types.ObjectId(idCopro) }).toArray();
    logger.info('Items fetched by copro ID', { meta: { idCopro, count: Items?.length || 0, duration_ms: Date.now() - startedAt } });
    return Items;
  });
}

module.exports = {
  addItem,
  editItem,
  getItemsByInfo,
  getItemsByCoproId, // ✅ Fixed missing export
};