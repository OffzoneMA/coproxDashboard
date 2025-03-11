const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    return await callback();
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}

function handleMongoError(message, error) {
  console.error(message, error.message);
  throw error;
}

async function saveFiches(fiches) {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
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
    return await ficheCollection.insertMany(formattedFiches);
  });
}

async function editFiche(id, updatedFicheData) {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    return await ficheCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFicheData }
    );
  });
}

async function getInfo(id) {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    return await ficheCollection.findOne({ _id: new ObjectId(id) });
  });
}

async function getPersonsByInfo(infoName, infoValue) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('fiche');
    const query = { [infoName]: infoValue };
    return await suiviFichenCollection.find(query).toArray();
  });
}

async function getFichesByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    return await ficheCollection.find({ idCopro: new ObjectId(idCopro) }).toArray();
  });
}

async function getAllFiches() {
  return connectAndExecute(async () => {
    const ficheCollection = MongoDB.getCollection('fiche');
    return await ficheCollection.find({}).toArray();
  });
}

async function countAllPersons() {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('fiche');
    return await suiviFichenCollection.countDocuments({});
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