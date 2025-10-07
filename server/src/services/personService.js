// services/personService.js
const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const vilogiService = require('./vilogiService');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('person');

/* ------------------------- Helpers ------------------------- */

function toObjectId(value, fieldName = '_id') {
  try {
    // Accept ObjectId, string, or anything castable
    return new mongoose.Types.ObjectId(String(value));
  } catch (e) {
    const err = new Error(`Invalid ObjectId for ${fieldName}: ${value}`);
    err.status = 400;
    throw err;
  }
}

async function connectAndExecute(fn) {
  try {
    logger.debug('MongoDB connect start');
    await MongoDB.connectToDatabase();
    const res = await fn();
    logger.info('MongoDB operation success');
    return res;
  } catch (e) {
    logError(e, 'DB operation failed');
    throw e;
  }
}

/* ------------------------- CRUD ------------------------- */

async function addPerson(newPersonData) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    logger.info('Adding person');
    const { insertedId, acknowledged } = await personCollection.insertOne(newPersonData);
    logger.info('Added person', { meta: { insertedId } });
    return { acknowledged, insertedId };
  });
}

async function editPerson(id, updatedPersonData = {}) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const _id = toObjectId(id);
    logger.info('Editing person', { meta: { id: String(_id) } });
    const { matchedCount, modifiedCount } = await personCollection.updateOne(
      { _id },
      { $set: updatedPersonData }
    );
    logger.info('Edited person', { meta: { id: String(_id), matchedCount, modifiedCount } });
    return { matchedCount, modifiedCount };
  });
}

async function getPerson(id) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const _id = toObjectId(id);

    const person = await personCollection.findOne({ _id });
    if (!person) return null;

    // If vilogi expects string ids, convert here:
    const vilogiId = String(_id);

    const [
      proprietaireInfo,
      proprietaireLots,
      proprietaireComptes,
      proprietaireDocuments
    ] = await Promise.all([
      vilogiService.getProprietaireInfo(vilogiId),
      vilogiService.getProprietaireLots(vilogiId),
      vilogiService.getProprietaireComptes(vilogiId),
      vilogiService.getProprietaireDocuments(vilogiId)
    ]);

    return {
      ...person,
      proprietaireInfo,
      proprietaireLots,
      proprietaireComptes,
      proprietaireDocuments
    };
  });
}

async function getPersonsByInfo(infoName, infoValue) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');

    // If the field is an ObjectId (e.g., _id or idCopro), try to cast
    const castableFields = new Set(['_id', 'idCopro']);
    const queryValue = castableFields.has(infoName)
      ? toObjectId(infoValue, infoName)
      : infoValue;

    const query = { [infoName]: queryValue };
    const persons = await personCollection.find(query).toArray();
    logger.info('Get persons by info', { meta: { infoName, count: persons.length } });
    return persons;
  });
}

async function getPersonsById(idPerson) {
  // Keep original name/shape, but a single id should return a single doc (or null)
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const _id = toObjectId(idPerson);
    const person = await personCollection.findOne({ _id });
    return person ? [person] : []; // preserves your original array return type
  });
}

async function getPersonsByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const coproId = toObjectId(idCopro, 'idCopro');
    const persons = await personCollection.find({ idCopro: coproId }).toArray();
    logger.info('Get persons by copro', { meta: { idCopro: String(coproId), count: persons.length } });
    return persons;
  });
}

async function getAllPersons() {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const res = await personCollection.find({}).toArray();
    logger.info('Get all persons', { meta: { count: res.length } });
    return res;
  });
}

/**
 * Returns all persons, each enriched with Vilogi proprietaire details.
 * (Fixes the old typo "Coppro".)
 */
async function getAllPersonsWithCopro() {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const persons = await personCollection.find({}).toArray();

    // Enrich in parallel but don’t fail the whole call if one enrichment fails
    const enriched = await Promise.all(
      persons.map(async (p) => {
        const vilogiId = String(p._id);
        try {
          const [
            proprietaireInfo,
            proprietaireLots,
            proprietaireComptes,
            proprietaireDocuments
          ] = await Promise.all([
            vilogiService.getProprietaireInfo(vilogiId),
            vilogiService.getProprietaireLots(vilogiId),
            vilogiService.getProprietaireComptes(vilogiId),
            vilogiService.getProprietaireDocuments(vilogiId)
          ]);

          return {
            ...p,
            proprietaireInfo,
            proprietaireLots,
            proprietaireComptes,
            proprietaireDocuments
          };
        } catch (e) {
          // If Vilogi fails for one person, still return the base person
          return {
            ...p,
            vilogiError: e?.message || 'Failed to fetch Vilogi data'
          };
        }
      })
    );

    return enriched;
  });
}

async function countAllPersons() {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const count = await personCollection.countDocuments({});
    logger.info('Count all persons', { meta: { count } });
    return count;
  });
}

/* ------------------------- Exports ------------------------- */

module.exports = {
  addPerson,
  editPerson,
  getPerson,
  getPersonsByInfo,
  getPersonsById,
  getPersonsByCoproId,
  getAllPersons,
  countAllPersons,
  getAllPersonsWithCopro,
  // Backward-compat alias for the previous typo
  getAllPersonsWithCoppro: getAllPersonsWithCopro,
};
