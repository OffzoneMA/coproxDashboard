const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('prestataire');

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

// ============= PRESTATAIRE CRUD OPERATIONS =============

// List all prestataires (active by default)
async function listPrestataires(includeInactive = false) {
  return connectAndExecute(async () => {
    const prestataireCollection = MongoDB.getCollection('prestataires');
    const filter = includeInactive ? {} : { status: { $ne: 'Inactive' } };
    const results = await prestataireCollection.find(filter).toArray();
    logger.info('listPrestataires', { meta: { count: results.length, includeInactive } });
    return results;
  });
}

// Get prestataire by ID
async function detailsPrestataire(id) {
  return connectAndExecute(async () => {
    const prestataireCollection = MongoDB.getCollection('prestataires');
    const result = await prestataireCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    logger.info('detailsPrestataire', { meta: { id, found: !!result } });
    return result;
  });
}

// Get prestataire by idCompte
async function getPrestataireByIdCompte(idCompte) {
  return connectAndExecute(async () => {
    const prestataireCollection = MongoDB.getCollection('prestataires');
    const result = await prestataireCollection.findOne({ idCompte: parseInt(idCompte) });
    logger.info('getPrestataireByIdCompte', { meta: { idCompte, found: !!result } });
    return result;
  });
}

// Add new prestataire
async function addPrestataire(newPrestataireData) {
  return connectAndExecute(async () => {
    const prestataireCollection = MongoDB.getCollection('prestataires');
    newPrestataireData.dateCreation = new Date();
    newPrestataireData.dateModification = new Date();
    const result = await prestataireCollection.insertOne(newPrestataireData);
    logger.info('Added prestataire', { meta: { insertedId: String(result.insertedId) } });
    return result;
  });
}

// Update prestataire
async function editPrestataire(id, updatedPrestataireData) {
  return connectAndExecute(async () => {
    const prestataireCollection = MongoDB.getCollection('prestataires');
    updatedPrestataireData.dateModification = new Date();
    const result = await prestataireCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updatedPrestataireData }
    );
    logger.info('Updated prestataire', { meta: { id, modifiedCount: result.modifiedCount } });
    return result;
  });
}

// Delete prestataire
async function deletePrestataire(id) {
  return connectAndExecute(async () => {
    const prestataireCollection = MongoDB.getCollection('prestataires');
    const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
    
    // First delete all relationships
    await prestataireCoproCollection.deleteMany({ prestataireId: new mongoose.Types.ObjectId(id) });
    
    // Then delete the prestataire
    const result = await prestataireCollection.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    logger.info('Deleted prestataire', { meta: { id, deletedCount: result.deletedCount } });
    return result;
  });
}

// Upsert prestataire (create or update based on idCompte)
async function upsertPrestataire(prestataireData) {
  return connectAndExecute(async () => {
    const prestataireCollection = MongoDB.getCollection('prestataires');
    
    const existingPrestataire = await prestataireCollection.findOne({ 
      idCompte: prestataireData.idCompte 
    });
    
    if (existingPrestataire) {
      prestataireData.dateModification = new Date();
      const result = await prestataireCollection.updateOne(
        { idCompte: prestataireData.idCompte },
        { $set: prestataireData }
      );
      logger.info('Updated prestataire via upsert', { 
        meta: { idCompte: prestataireData.idCompte, modifiedCount: result.modifiedCount } 
      });
      return { ...existingPrestataire, ...prestataireData };
    } else {
      prestataireData.dateCreation = new Date();
      prestataireData.dateModification = new Date();
      const result = await prestataireCollection.insertOne(prestataireData);
      logger.info('Created prestataire via upsert', { 
        meta: { idCompte: prestataireData.idCompte, insertedId: String(result.insertedId) } 
      });
      return { ...prestataireData, _id: result.insertedId };
    }
  });
}

// ============= PRESTATAIRE-COPRO RELATIONSHIP OPERATIONS =============

// Link a prestataire to a copro
async function linkPrestataireToCopro(prestataireId, coproprieteId, linkData = {}) {
  return connectAndExecute(async () => {
    const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
    
    const relationshipData = {
      prestataireId: new mongoose.Types.ObjectId(prestataireId),
      coproprieteId: new mongoose.Types.ObjectId(coproprieteId),
      dateDebut: linkData.dateDebut || null,
      dateFin: linkData.dateFin || null,
      typePrestation: linkData.typePrestation || null,
      notes: linkData.notes || null,
      dateCreation: new Date(),
      dateModification: new Date()
    };
    
    const result = await prestataireCoproCollection.insertOne(relationshipData);
    logger.info('Linked prestataire to copro', { 
      meta: { prestataireId, coproprieteId, insertedId: String(result.insertedId) } 
    });
    return result;
  });
}

// Unlink a prestataire from a copro
async function unlinkPrestataireFromCopro(prestataireId, coproprieteId) {
  return connectAndExecute(async () => {
    const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
    const result = await prestataireCoproCollection.deleteOne({
      prestataireId: new mongoose.Types.ObjectId(prestataireId),
      coproprieteId: new mongoose.Types.ObjectId(coproprieteId)
    });
    logger.info('Unlinked prestataire from copro', { 
      meta: { prestataireId, coproprieteId, deletedCount: result.deletedCount } 
    });
    return result;
  });
}

// Update relationship between prestataire and copro
async function updatePrestataireCooproLink(prestataireId, coproprieteId, linkData) {
  return connectAndExecute(async () => {
    const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
    linkData.dateModification = new Date();
    
    const result = await prestataireCoproCollection.updateOne(
      {
        prestataireId: new mongoose.Types.ObjectId(prestataireId),
        coproprieteId: new mongoose.Types.ObjectId(coproprieteId)
      },
      { $set: linkData }
    );
    logger.info('Updated prestataire-copro link', { 
      meta: { prestataireId, coproprieteId, modifiedCount: result.modifiedCount } 
    });
    return result;
  });
}

// Get all copros for a prestataire
async function getCoprosForPrestataire(prestataireId) {
  return connectAndExecute(async () => {
    const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
    const coproprieteCollection = MongoDB.getCollection('copropriete');
    
    const relationships = await prestataireCoproCollection.find({
      prestataireId: new mongoose.Types.ObjectId(prestataireId)
    }).toArray();
    
    const coprosWithDetails = await Promise.all(
      relationships.map(async (rel) => {
        const copro = await coproprieteCollection.findOne({ _id: rel.coproprieteId });
        return {
          ...copro,
          solde: rel.solde || 0, // Include the solde for this specific copro
          relationshipDetails: {
            dateDebut: rel.dateDebut,
            dateFin: rel.dateFin,
            typePrestation: rel.typePrestation,
            notes: rel.notes,
            solde: rel.solde || 0 // Also include in relationshipDetails for backwards compatibility
          }
        };
      })
    );
    
    logger.info('getCoprosForPrestataire', { 
      meta: { prestataireId, count: coprosWithDetails.length } 
    });
    return coprosWithDetails;
  });
}

// Get all prestataires for a copro
async function getPrestatairesForCopro(coproprieteId) {
  return connectAndExecute(async () => {
    const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
    const prestataireCollection = MongoDB.getCollection('prestataires');
    
    const relationships = await prestataireCoproCollection.find({
      coproprieteId: new mongoose.Types.ObjectId(coproprieteId)
    }).toArray();
    
    const prestatairesWithDetails = await Promise.all(
      relationships.map(async (rel) => {
        const prestataire = await prestataireCollection.findOne({ _id: rel.prestataireId });
        return {
          ...prestataire,
          relationshipDetails: {
            dateDebut: rel.dateDebut,
            dateFin: rel.dateFin,
            typePrestation: rel.typePrestation,
            notes: rel.notes
          }
        };
      })
    );
    
    logger.info('getPrestatairesForCopro', { 
      meta: { coproprieteId, count: prestatairesWithDetails.length } 
    });
    return prestatairesWithDetails;
  });
}

// Update solde for a specific prestataire-copro relationship
async function updatePrestataireCoproSolde(prestataireId, coproprieteId, solde) {
  return connectAndExecute(async () => {
    const prestataireCoproCollection = MongoDB.getCollection('prestatairecopros');
    
    const result = await prestataireCoproCollection.updateOne(
      {
        prestataireId: new mongoose.Types.ObjectId(prestataireId),
        coproprieteId: new mongoose.Types.ObjectId(coproprieteId)
      },
      { 
        $set: { 
          solde: solde,
          dateModification: new Date()
        } 
      }
    );
    
    logger.info('Updated prestataire-copro solde', { 
      meta: { prestataireId, coproprieteId, solde, modifiedCount: result.modifiedCount } 
    });
    return result;
  });
}

module.exports = {
  // CRUD operations
  listPrestataires,
  detailsPrestataire,
  getPrestataireByIdCompte,
  addPrestataire,
  editPrestataire,
  deletePrestataire,
  upsertPrestataire,
  
  // Relationship operations
  linkPrestataireToCopro,
  unlinkPrestataireFromCopro,
  updatePrestataireCooproLink,
  getCoprosForPrestataire,
  getPrestatairesForCopro,
  updatePrestataireCoproSolde
};
