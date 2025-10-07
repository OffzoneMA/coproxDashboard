const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('suiviFichen');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

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

function handleMongoError(message, error) {
  logError(error, message);
  throw error;
}

async function saveFiches(fiches) {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    logger.info('Saving fiches', { meta: { count: fiches?.length || 0 } });
    const formattedFiches = fiches.map(fiche => ({
      nom: fiche.nom || '',
      prenom: fiche.prenom || '',
      adresse: fiche.adresse || '',
      codepostale: fiche.codepostale || '',
      editPersonmail: fiche.Email || '',
      telephone1: fiche.telephone1 || '',
      telephone2: fiche.telephone2 || '',
      ville: fiche.ville || '',
      idCopro: new ObjectId(fiche.idCopro),
      status: fiche.status || '',
      creationDateTime: new Date(),
      editDateTime: new Date()
    }));
    const result = await ficheCollection.insertMany(formattedFiches);
    logger.info('Fiches saved', { meta: { insertedCount: result?.insertedCount } });
    return result;
  });
}

async function editFiche(id, updatedFicheData) {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    logger.info('Editing fiche', { meta: { id } });
    const result = await ficheCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFicheData }
    );
    logger.info('Fiche edited', { meta: { id, matched: result?.matchedCount, modified: result?.modifiedCount } });
    return result;
  });
}

async function getInfo(id) {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    logger.info('Get fiche info', { meta: { id } });
    const result = await ficheCollection.findOne({ _id: new ObjectId(id) });
    return result;
  });
}

async function getPersonsByInfo(infoName, infoValue) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('fiche');
    const query = { [infoName]: infoValue };
    logger.info('Get persons by info', { meta: { infoName } });
    const res = await suiviFichenCollection.find(query).toArray();
    logger.info('Got persons by info', { meta: { count: res?.length || 0 } });
    return res;
  });
}

async function getFichesByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    logger.info('Get fiches by copro', { meta: { idCopro } });
    const res = await ficheCollection.find({ idCopro: new ObjectId(idCopro) }).toArray();
    logger.info('Got fiches by copro', { meta: { count: res?.length || 0 } });
    return res;
  });
}

async function getAllFiches() {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    logger.info('Get all fiches');
    const res = await ficheCollection.find({}).toArray();
    logger.info('Got all fiches', { meta: { count: res?.length || 0 } });
    return res;
  });
}

async function countAllPersons() {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('fiche');
    const count = await suiviFichenCollection.countDocuments({});
    logger.info('Count all persons', { meta: { count } });
    return count;
  });
}

module.exports = {
  saveFiches,
  getInfo,
  editFiche,
  getPersonsByInfo,
  getFichesByCoproId,
  getAllFiches,
  countAllPersons
};