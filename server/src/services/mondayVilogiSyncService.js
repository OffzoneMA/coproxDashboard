const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');

mongoose.set('useFindAndModify', false);

async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    const result = await callback();
    return result;
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  } 
}

function handleMongoError(message, error) {
  console.error(message, error.message);
  throw error;
}

async function addItem(newItemData) {
  return connectAndExecute(async () => {
    const ItemCollection = MongoDB.getCollection('mondayVilogi');
    const result = await ItemCollection.insertOne(newItemData);
    return result;
  });
}

async function editItem(id, updatedItemData) {
  return connectAndExecute(async () => {
    const ItemCollection = MongoDB.getCollection('mondayVilogi');
    const result = await ItemCollection.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updatedItemData });
    return result;
  });
}


async function getItemsByInfo(boardID,vilogiItemID) {
  return connectAndExecute(async () => {
    const ItemCollection = MongoDB.getCollection('mondayVilogi');
    const query = {"vilogiItemID": vilogiItemID,"boardID": boardID };
    const Items = await ItemCollection.find(query).toArray();
    return Items;
  });
}

async function getItemsByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const ItemCollection = MongoDB.getCollection('mondayVilogi');
    const Items = await ItemCollection.find({ idCopro: mongoose.Types.ObjectId(idCopro) }).toArray();
    return Items;
  });
}




// Add your new functions here

module.exports = {
  addItem,
  editItem,
  getItemsByInfo,
  // Add your new functions here
};
