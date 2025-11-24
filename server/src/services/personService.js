// services/personService.js
const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const vilogiService = require('./vilogiService');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('person');
const { executePaginatedQuery } = require('../utils/paginationHelper');

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
    const coproCollection = MongoDB.getCollection('copropriete');
    const _id = toObjectId(id);

    const person = await personCollection.findOne({ _id });
    if (!person) return null;

    // ✅ MULTI-COPRO: Enrich with full copro details for ALL copros
    if (person.idCopro && Array.isArray(person.idCopro) && person.idCopro.length > 0) {
      try {
        const copros = await coproCollection.find({ 
          _id: { $in: person.idCopro } 
        }).toArray();
        person.copros = copros; // Array of copros
        person.copro = copros[0]; // Keep backward compatibility with single copro
      } catch (e) {
        logger.warn('Failed to fetch copros for person', { meta: { personId: String(_id), error: e.message } });
      }
    } else if (person.idCopro && !Array.isArray(person.idCopro)) {
      // Legacy: single copro as ObjectId (shouldn't happen after migration)
      try {
        const copro = await coproCollection.findOne({ _id: person.idCopro });
        person.copros = copro ? [copro] : [];
        person.copro = copro;
      } catch (e) {
        logger.warn('Failed to fetch copro for person', { meta: { personId: String(_id), error: e.message } });
      }
    }

    logger.info('Get person with full copro details', { meta: { id: String(_id), coproCount: person.copros?.length || 0 } });
    return person;
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

async function getAllPersons(options = {}) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    
    const {
      limit = 100,
      skip = 0,
      sort = { createdAt: -1 },
      filter = {},
      projection = {}
    } = options;
    
    // Use pagination helper
    const result = await executePaginatedQuery(
      personCollection,
      filter,
      { limit, skip, sort, projection }
    );
    
    logger.info('Get all persons', { 
      meta: { 
        count: result.count, 
        total: result.total, 
        skip, 
        limit,
        hasMore: skip + result.count < result.total
      } 
    });
    
    return {
      data: result.data,
      pagination: {
        total: result.total,
        count: result.count,
        skip,
        limit,
        hasMore: skip + result.count < result.total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  });
}

/**
 * Returns persons with minimal copro data - optimized for list views
 * Only includes: Nom, ville, codepostal, idCopro from copro
 */
async function getAllPersonsWithCopro(options = {}) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    
    const {
      limit = 100,
      skip = 0,
      sort = { nom: 1 },
      filter = {}
    } = options;
    
    // ✅ MULTI-COPRO: Use aggregation pipeline for efficient lookup with projection
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'copropriete',
          localField: 'idCopro', // Now an array
          foreignField: '_id',
          as: 'copros', // Renamed from 'copro' to 'copros'
          // Project only minimal copro fields
          pipeline: [
            {
              $project: {
                _id: 1,
                Nom: 1,
                ville: 1,
                codepostal: 1,
                idCopro: 1
              }
            }
          ]
        }
      },
      // Add copro field for backward compatibility (first copro in array)
      {
        $addFields: {
          copro: { $arrayElemAt: ['$copros', 0] }
        }
      },
      { $sort: sort },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];
    
    const [result] = await personCollection.aggregate(pipeline).toArray();
    const data = result.data || [];
    const total = result.totalCount[0]?.count || 0;
    
    logger.info('Get all persons with minimal copro', { 
      meta: { 
        count: data.length, 
        total, 
        skip, 
        limit 
      } 
    });
    
    return {
      data,
      pagination: {
        total,
        count: data.length,
        skip,
        limit,
        hasMore: skip + data.length < total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      }
    };
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

/* ------------------------- Solde Management ------------------------- */

/**
 * Update solde for a person by ID
 * @param {string|ObjectId} personId - The person's MongoDB ID
 * @param {number} newSolde - The new solde value
 * @param {string} source - The source of the update (e.g., 'synchoBudgetCoproprietaire')
 * @returns {Promise<Object>} Update result
 */
async function updatePersonSolde(personId, newSolde, source = 'manual') {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    const _id = toObjectId(personId);
    
    // Get current person data
    const person = await personCollection.findOne({ _id });
    if (!person) {
      throw new Error(`Person with ID ${personId} not found`);
    }
    
    const oldSolde = person.solde || 0;
    const soldeChanged = oldSolde !== newSolde;
    
    const updateData = {
      solde: newSolde,
      lastSoldeSyncDate: new Date(),
      updatedAt: new Date()
    };
    
    // Update the solde
    await personCollection.updateOne(
      { _id },
      { $set: updateData }
    );
    
    if (soldeChanged) {
      logger.info('Updated person solde', { 
        meta: { 
          id: String(_id), 
          oldSolde, 
          newSolde, 
          source 
        } 
      });
    } else {
      logger.info('Refreshed person solde timestamp (no change)', { 
        meta: { id: String(_id), solde: newSolde, source } 
      });
    }
    
    return { 
      success: true, 
      soldeChanged, 
      oldSolde, 
      newSolde 
    };
  });
}

/**
 * Update solde for a person by Vilogi ID
 * @param {string} idVilogi - The person's Vilogi ID
 * @param {number} newSolde - The new solde value
 * @param {string|ObjectId} idCopro - Optional: copro ID for validation
 * @param {string} source - The source of the update
 * @returns {Promise<Object>} Update result
 */
async function updatePersonSoldeByVilogiId(idVilogi, newSolde, idCopro = null, source = 'synchoBudgetCoproprietaire') {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    
    // Build query
    const query = { idVilogi };
    if (idCopro) {
      query.idCopro = toObjectId(idCopro, 'idCopro');
    }
    
    const persons = await personCollection.find(query).toArray();
    
    if (persons.length === 0) {
      logger.warn('No person found for solde update', { meta: { idVilogi, idCopro } });
      return { success: false, message: 'Person not found' };
    }
    
    if (persons.length > 1) {
      logger.warn('Multiple persons found for solde update', { meta: { idVilogi, count: persons.length } });
    }
    
    const results = [];
    for (const person of persons) {
      const result = await updatePersonSolde(person._id, newSolde, source);
      results.push({ personId: person._id, email: person.email, ...result });
    }
    
    return { 
      success: true, 
      updated: results.length, 
      results 
    };
  });
}

/**
 * Get all persons with negative solde (debts) - with pagination
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Paginated result with persons with negative solde
 */
async function getPersonsWithNegativeSolde(options = {}) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    
    const {
      limit = 100,
      skip = 0,
      sort = { solde: 1 } // Most negative first by default
    } = options;
    
    const result = await executePaginatedQuery(
      personCollection,
      { solde: { $lt: 0 } },
      { limit, skip, sort }
    );
    
    logger.info('Retrieved persons with negative solde', { 
      meta: { 
        count: result.count, 
        total: result.total,
        skip,
        limit 
      } 
    });
    
    return {
      data: result.data,
      pagination: {
        total: result.total,
        count: result.count,
        skip,
        limit,
        hasMore: skip + result.count < result.total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  });
}

/**
 * Get all persons with positive solde (credits) - with pagination
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Paginated result with persons with positive solde
 */
async function getPersonsWithPositiveSolde(options = {}) {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    
    const {
      limit = 100,
      skip = 0,
      sort = { solde: -1 } // Highest first by default
    } = options;
    
    const result = await executePaginatedQuery(
      personCollection,
      { solde: { $gt: 0 } },
      { limit, skip, sort }
    );
    
    logger.info('Retrieved persons with positive solde', { 
      meta: { 
        count: result.count, 
        total: result.total,
        skip,
        limit 
      } 
    });
    
    return {
      data: result.data,
      pagination: {
        total: result.total,
        count: result.count,
        skip,
        limit,
        hasMore: skip + result.count < result.total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  });
}

/**
 * Get solde statistics
 * @returns {Promise<Object>} Statistics about soldes
 */
async function getSoldeStats() {
  return connectAndExecute(async () => {
    const personCollection = MongoDB.getCollection('person');
    
    const [totals, negativeCount, positiveCount, zeroCount] = await Promise.all([
      personCollection.aggregate([
        {
          $group: {
            _id: null,
            totalSolde: { $sum: '$solde' },
            avgSolde: { $avg: '$solde' },
            minSolde: { $min: '$solde' },
            maxSolde: { $max: '$solde' },
            count: { $sum: 1 }
          }
        }
      ]).toArray(),
      personCollection.countDocuments({ solde: { $lt: 0 } }),
      personCollection.countDocuments({ solde: { $gt: 0 } }),
      personCollection.countDocuments({ $or: [{ solde: 0 }, { solde: { $exists: false } }] })
    ]);
    
    const stats = totals[0] || {
      totalSolde: 0,
      avgSolde: 0,
      minSolde: 0,
      maxSolde: 0,
      count: 0
    };
    
    return {
      ...stats,
      negativeCount,
      positiveCount,
      zeroCount
    };
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
  // Solde management functions
  updatePersonSolde,
  updatePersonSoldeByVilogiId,
  getPersonsWithNegativeSolde,
  getPersonsWithPositiveSolde,
  getSoldeStats,
};
